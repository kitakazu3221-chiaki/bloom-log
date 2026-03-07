import type { Plugin } from "vite";
import type { ServerResponse } from "http";
import { v4 as uuidv4 } from "uuid";

interface Session {
  pcMessages: SignalMessage[];
  phoneMessages: SignalMessage[];
  pcSSE: ServerResponse | null;
  phoneSSE: ServerResponse | null;
}

interface SignalMessage {
  type: string;
  [key: string]: unknown;
}

export function signalingPlugin(): Plugin {
  const sessions = new Map<string, Session>();

  function sendSSE(res: ServerResponse, data: SignalMessage) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  function flushMessages(session: Session, role: "pc" | "phone") {
    const target = role === "pc" ? session.pcSSE : session.phoneSSE;
    const queue = role === "pc" ? session.pcMessages : session.phoneMessages;
    if (target && queue.length > 0) {
      for (const msg of queue) {
        sendSSE(target, msg);
      }
      queue.length = 0;
    }
  }

  function pushToRole(
    session: Session,
    role: "pc" | "phone",
    msg: SignalMessage
  ) {
    if (role === "pc") {
      if (session.pcSSE) {
        sendSSE(session.pcSSE, msg);
      } else {
        session.pcMessages.push(msg);
      }
    } else {
      if (session.phoneSSE) {
        sendSSE(session.phoneSSE, msg);
      } else {
        session.phoneMessages.push(msg);
      }
    }
  }

  return {
    name: "bloom-log-signaling",
    configureServer(server) {
      // Parse JSON body from request
      function readBody(
        req: import("http").IncomingMessage
      ): Promise<Record<string, unknown>> {
        return new Promise((resolve, reject) => {
          let body = "";
          req.on("data", (chunk: Buffer) => (body += chunk.toString()));
          req.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error("Invalid JSON"));
            }
          });
          req.on("error", reject);
        });
      }

      // POST /api/session/create - PC creates a session
      server.middlewares.use("/api/session/create", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const sessionId = uuidv4();
        sessions.set(sessionId, {
          pcMessages: [],
          phoneMessages: [],
          pcSSE: null,
          phoneSSE: null,
        });
        console.log(`[signaling] Session created: ${sessionId}`);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ sessionId }));
      });

      // POST /api/session/join - Phone joins a session
      server.middlewares.use("/api/session/join", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          const body = await readBody(req);
          const sessionId = body.sessionId as string;
          const session = sessions.get(sessionId);
          if (!session) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Session not found" }));
            return;
          }
          console.log(`[signaling] Phone joined session: ${sessionId}`);
          // Notify both sides
          pushToRole(session, "pc", {
            type: "peer-joined",
            sessionId,
          });
          pushToRole(session, "phone", {
            type: "peer-joined",
            sessionId,
          });
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });

      // POST /api/session/signal - Send a signaling message to the peer
      server.middlewares.use("/api/session/signal", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        try {
          const body = await readBody(req);
          const sessionId = body.sessionId as string;
          const role = body.role as "pc" | "phone";
          const message = body.message as SignalMessage;
          const session = sessions.get(sessionId);
          if (!session) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: "Session not found" }));
            return;
          }
          // Push to the OTHER role
          const targetRole = role === "pc" ? "phone" : "pc";
          pushToRole(session, targetRole, message);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: "Invalid request" }));
        }
      });

      // GET /api/session/events?session=xxx&role=pc|phone - SSE stream
      server.middlewares.use("/api/session/events", (req, res) => {
        if (req.method !== "GET") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const url = new URL(req.url!, `https://${req.headers.host}`);
        const sessionId = url.searchParams.get("session");
        const role = url.searchParams.get("role") as "pc" | "phone" | null;

        if (!sessionId || !role) {
          res.statusCode = 400;
          res.end("Missing session or role");
          return;
        }

        const session = sessions.get(sessionId);
        if (!session) {
          res.statusCode = 404;
          res.end("Session not found");
          return;
        }

        // Set up SSE
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        });
        res.write("\n");

        // Register this SSE connection
        if (role === "pc") {
          session.pcSSE = res;
        } else {
          session.phoneSSE = res;
        }

        // Flush any pending messages
        flushMessages(session, role);

        console.log(`[signaling] SSE connected: ${role} for ${sessionId}`);

        // Handle disconnect
        req.on("close", () => {
          console.log(`[signaling] SSE disconnected: ${role} for ${sessionId}`);
          if (role === "pc") {
            session.pcSSE = null;
          } else {
            session.phoneSSE = null;
          }
          // Notify the other side
          const otherRole = role === "pc" ? "phone" : "pc";
          pushToRole(session, otherRole, { type: "peer-left" });
          // Clean up if both disconnected
          if (!session.pcSSE && !session.phoneSSE) {
            sessions.delete(sessionId);
            console.log(`[signaling] Session removed: ${sessionId}`);
          }
        });
      });
    },
  };
}
