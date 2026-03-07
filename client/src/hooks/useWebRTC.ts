import { useState, useEffect, useRef, useCallback } from "react";
import type { SignalingMessage, RTCConnectionState } from "../types";

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

interface UseWebRTCOptions {
  role: "pc" | "phone";
  peerJoined: boolean;
  sendSignal: (msg: SignalingMessage) => void;
}

interface UseWebRTCReturn {
  connectionState: RTCConnectionState;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  handleSignal: (msg: SignalingMessage) => void;
}

export function useWebRTC({
  role,
  peerJoined,
  sendSignal,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [connectionState, setConnectionState] =
    useState<RTCConnectionState>("new");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sendSignalRef = useRef(sendSignal);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescription = useRef(false);

  sendSignalRef.current = sendSignal;

  const handleSignal = useCallback((msg: SignalingMessage) => {
    if (msg.type !== "signal") return;

    const pc = pcRef.current;
    if (!pc) return;

    (async () => {
      try {
        if (msg.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
          hasRemoteDescription.current = true;

          // Process buffered ICE candidates
          for (const candidate of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current = [];

          // PC side: answer the offer
          if (msg.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignalRef.current({
              type: "signal",
              sdp: pc.localDescription!,
            });
          }
        } else if (msg.candidate) {
          if (hasRemoteDescription.current) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
          } else {
            pendingCandidates.current.push(msg.candidate);
          }
        }
      } catch (err) {
        console.error("WebRTC signal handling error:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!peerJoined) return;

    let cancelled = false;

    async function setup() {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;
      hasRemoteDescription.current = false;
      pendingCandidates.current = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalRef.current({
            type: "signal",
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        switch (pc.connectionState) {
          case "connecting":
            setConnectionState("connecting");
            break;
          case "connected":
            setConnectionState("connected");
            break;
          case "disconnected":
          case "closed":
            setConnectionState("disconnected");
            break;
          case "failed":
            setConnectionState("failed");
            break;
        }
      };

      if (role === "phone") {
        // Phone: get camera and send stream
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });

          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          localStreamRef.current = stream;
          setLocalStream(stream);

          for (const track of stream.getTracks()) {
            pc.addTrack(track, stream);
          }

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          sendSignalRef.current({
            type: "signal",
            sdp: pc.localDescription!,
          });
        } catch (err) {
          console.error("Failed to get camera:", err);
          setConnectionState("failed");
        }
      } else {
        // PC: receive remote stream
        pc.ontrack = (event) => {
          if (!cancelled) {
            setRemoteStream(event.streams[0]);
          }
        };
      }
    }

    setup();

    return () => {
      cancelled = true;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      setConnectionState("new");
      hasRemoteDescription.current = false;
      pendingCandidates.current = [];
    };
  }, [peerJoined, role]);

  return { connectionState, remoteStream, localStream, handleSignal };
}
