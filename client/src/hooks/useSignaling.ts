import { useState, useEffect, useRef, useCallback } from "react";
import type { SignalingMessage, WSConnectionState } from "../types";

interface UseSignalingOptions {
  role: "pc" | "phone";
  sessionId?: string;
  onSignal: (msg: SignalingMessage) => void;
}

interface UseSignalingReturn {
  connectionState: WSConnectionState;
  sessionId: string | null;
  peerJoined: boolean;
  sendSignal: (msg: SignalingMessage) => void;
}

export function useSignaling({
  role,
  sessionId: joinSessionId,
  onSignal,
}: UseSignalingOptions): UseSignalingReturn {
  const [connectionState, setConnectionState] =
    useState<WSConnectionState>("connecting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerJoined, setPeerJoined] = useState(false);
  const onSignalRef = useRef(onSignal);
  const sessionIdRef = useRef<string | null>(null);

  onSignalRef.current = onSignal;

  const sendSignal = useCallback(
    (msg: SignalingMessage) => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      fetch("/api/session/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, role, message: msg }),
      }).catch((err) => console.error("Failed to send signal:", err));
    },
    [role]
  );

  useEffect(() => {
    let cancelled = false;
    let eventSource: EventSource | null = null;

    function setupSSE(sid: string) {
      eventSource = new EventSource(
        `/api/session/events?session=${sid}&role=${role}`
      );

      eventSource.onmessage = (event) => {
        if (cancelled) return;
        try {
          const msg: SignalingMessage = JSON.parse(event.data);
          switch (msg.type) {
            case "peer-joined":
              setPeerJoined(true);
              break;
            case "peer-left":
              setPeerJoined(false);
              break;
            case "signal":
              onSignalRef.current(msg);
              break;
            default:
              // Forward any signal-like messages (sdp/candidate)
              if ("sdp" in msg || "candidate" in msg) {
                onSignalRef.current({
                  type: "signal",
                  ...("sdp" in msg ? { sdp: msg.sdp as RTCSessionDescriptionInit } : {}),
                  ...("candidate" in msg ? { candidate: msg.candidate as RTCIceCandidateInit } : {}),
                });
              }
              break;
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = () => {
        if (!cancelled) {
          setConnectionState("error");
        }
      };
    }

    async function init() {
      try {
        if (role === "pc") {
          // Create session
          const res = await fetch("/api/session/create", { method: "POST" });
          if (cancelled) return;
          const data = await res.json();
          sessionIdRef.current = data.sessionId;
          setSessionId(data.sessionId);
          setConnectionState("connected");
          setupSSE(data.sessionId);
        } else if (role === "phone" && joinSessionId) {
          // Join session
          sessionIdRef.current = joinSessionId;
          const res = await fetch("/api/session/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: joinSessionId }),
          });
          if (cancelled) return;
          if (!res.ok) {
            setConnectionState("error");
            return;
          }
          setConnectionState("connected");
          setupSSE(joinSessionId);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Signaling init error:", err);
          setConnectionState("error");
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      eventSource?.close();
      sessionIdRef.current = null;
    };
  }, [role, joinSessionId]);

  return { connectionState, sessionId, peerJoined, sendSignal };
}
