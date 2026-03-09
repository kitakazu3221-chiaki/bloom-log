import { useCallback, useEffect, useRef } from "react";
import { useSignaling } from "../hooks/useSignaling";
import { useWebRTC } from "../hooks/useWebRTC";
import { VideoPreview } from "../components/VideoPreview";
import type { SignalingMessage } from "../types";

interface PhonePageProps {
  sessionId: string;
}

export function PhonePage({ sessionId }: PhonePageProps) {
  const rtcHandleSignalRef = useRef<(msg: SignalingMessage) => void>(() => {});

  const onSignal = useCallback((msg: SignalingMessage) => {
    rtcHandleSignalRef.current(msg);
  }, []);

  const ws = useSignaling({
    role: "phone",
    sessionId,
    onSignal,
  });

  const rtc = useWebRTC({
    role: "phone",
    peerJoined: ws.peerJoined,
    sendSignal: ws.sendSignal,
  });

  rtcHandleSignalRef.current = rtc.handleSignal;

  // Wake Lock to prevent phone screen from sleeping
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Wake Lock not supported or denied
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLock?.release();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1F14] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#112B1D] border-b border-white/[0.06]">
        <h1 className="text-white font-bold">Bloom Log</h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              rtc.connectionState === "connected"
                ? "bg-emerald-400"
                : ws.connectionState === "connected"
                  ? "bg-amber-400"
                  : "bg-red-400"
            }`}
          />
          <span className="text-slate-300 text-sm">
            {rtc.connectionState === "connected"
              ? "配信中"
              : ws.connectionState === "connected"
                ? "接続待ち..."
                : "サーバー接続中..."}
          </span>
        </div>
      </div>

      {/* Camera preview */}
      <div className="flex-1 relative">
        {rtc.localStream ? (
          <VideoPreview stream={rtc.localStream} />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-slate-400 p-8">
              <p className="text-lg mb-2">カメラを起動中...</p>
              <p className="text-sm">カメラへのアクセスを許可してください</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug info + Instructions */}
      <div className="px-4 py-6 bg-[#112B1D] border-t border-white/[0.06] text-center space-y-2">
        <p className="text-slate-300 text-sm">
          PC画面を見ながら位置を合わせてください
        </p>
        <div className="text-slate-600 text-xs space-y-1">
          <p>WS: {ws.connectionState} | Peer: {ws.peerJoined ? "Yes" : "No"}</p>
          <p>RTC: {rtc.connectionState}</p>
          <p>Session: {sessionId.substring(0, 8)}...</p>
        </div>
      </div>
    </div>
  );
}
