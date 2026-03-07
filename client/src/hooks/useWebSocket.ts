import { useState, useEffect, useRef, useCallback } from "react";
import type { SignalingMessage, WSConnectionState } from "../types";

interface UseWebSocketOptions {
  role: "pc" | "phone";
  sessionId?: string;
  onSignal: (msg: SignalingMessage) => void;
}

interface UseWebSocketReturn {
  connectionState: WSConnectionState;
  sessionId: string | null;
  peerJoined: boolean;
  sendSignal: (msg: SignalingMessage) => void;
}

export function useWebSocket({
  role,
  sessionId: joinSessionId,
  onSignal,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionState, setConnectionState] =
    useState<WSConnectionState>("connecting");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [peerJoined, setPeerJoined] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const onSignalRef = useRef(onSignal);

  onSignalRef.current = onSignal;

  const sendSignal = useCallback((msg: SignalingMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
      if (role === "pc") {
        ws.send(JSON.stringify({ type: "create-session" }));
      } else if (role === "phone" && joinSessionId) {
        ws.send(
          JSON.stringify({ type: "join-session", sessionId: joinSessionId })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        switch (msg.type) {
          case "session-created":
            setSessionId(msg.sessionId);
            break;
          case "peer-joined":
            setPeerJoined(true);
            break;
          case "peer-left":
            setPeerJoined(false);
            break;
          case "signal":
            onSignalRef.current(msg);
            break;
          case "error":
            console.error("Signaling error:", msg.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onerror = () => setConnectionState("error");
    ws.onclose = () => setConnectionState("disconnected");

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [role, joinSessionId]);

  return { connectionState, sessionId, peerJoined, sendSignal };
}
