import { useState, useCallback, useRef, useEffect } from "react";
import { useSignaling } from "../hooks/useSignaling";
import { useWebRTC } from "../hooks/useWebRTC";
import { useStorage } from "../hooks/useStorage";
import { useLocalCamera } from "../hooks/useLocalCamera";
import { useBrightnessCheck } from "../hooks/useBrightnessCheck";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import {
  VideoPreview,
  type VideoPreviewHandle,
} from "../components/VideoPreview";
import { GuideOverlay } from "../components/GuideOverlay";
import { AreaSelector } from "../components/AreaSelector";
import { CaptureButton } from "../components/CaptureButton";
import { PhotoSaveDialog } from "../components/PhotoSaveDialog";
import { PreviousPhotoOverlay } from "../components/PreviousPhotoOverlay";
import { TrialBanner } from "../components/TrialBanner";
import {
  type ScalpArea,
  type SignalingMessage,
  type CapturedPhoto,
  type NoteData,
} from "../types";

type CameraMode = "phone" | "pc";

interface PCPageProps {
  username: string;
  onLogout: () => void;
  subscription: "trialing" | "active";
  trialDaysLeft: number;
}

export function PCPage({ username, onLogout, subscription, trialDaysLeft }: PCPageProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>("phone");
  const [selectedArea, setSelectedArea] = useState<ScalpArea>("top");
  const [pendingPhoto, setPendingPhoto] = useState<CapturedPhoto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(40);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const videoPreviewRef = useRef<VideoPreviewHandle>(null);
  const prevOverlayUrl = useRef<string | null>(null);

  const rtcHandleSignalRef = useRef<(msg: SignalingMessage) => void>(() => {});

  const onSignal = useCallback((msg: SignalingMessage) => {
    rtcHandleSignalRef.current(msg);
  }, []);

  const ws = useSignaling({ role: "pc", onSignal });
  const rtc = useWebRTC({
    role: "pc",
    peerJoined: ws.peerJoined,
    sendSignal: ws.sendSignal,
  });
  const storage = useStorage();
  const localCamera = useLocalCamera(cameraMode === "pc");

  rtcHandleSignalRef.current = rtc.handleSignal;

  // Active stream: local webcam in PC mode, remote WebRTC stream in phone mode
  const activeStream =
    cameraMode === "pc" ? localCamera.stream : rtc.remoteStream;
  const isStreamReady = activeStream !== null;

  const brightness = useBrightnessCheck(
    () => videoPreviewRef.current?.getVideoElement() ?? null,
    isStreamReady
  );

  // Load the most recent photo for the selected area as overlay
  useEffect(() => {
    if (!storage.isReady) return;

    let cancelled = false;
    storage.loadRecords().then(async (records) => {
      const areaRecords = records.filter((r) => r.area === selectedArea);
      const latest = areaRecords[areaRecords.length - 1];
      if (!latest || cancelled) return;

      const url = await storage.loadPhotoUrl(latest.area, latest.filename);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      if (prevOverlayUrl.current) URL.revokeObjectURL(prevOverlayUrl.current);
      prevOverlayUrl.current = url;
      setOverlayUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedArea, storage.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actual photo capture (called when countdown reaches 0)
  const capturePhoto = useCallback(() => {
    const video = videoPreviewRef.current?.getVideoElement();
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setPendingPhoto({ dataUrl, area: selectedArea, timestamp: new Date() });
    setSaveError(null);
  }, [selectedArea]);

  // Countdown tick
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      capturePhoto();
      setCountdown(null);
      return;
    }
    const timer = setTimeout(
      () => setCountdown((c) => (c !== null ? c - 1 : null)),
      1000
    );
    return () => clearTimeout(timer);
  }, [countdown, capturePhoto]);

  const handleCaptureClick = useCallback(() => {
    setCountdown(3);
    setSaveError(null);
  }, []);

  const handleCancelCountdown = useCallback(() => {
    setCountdown(null);
  }, []);

  const handleSave = useCallback(
    async (notes: NoteData) => {
      if (!pendingPhoto) return;
      if (!storage.isReady) {
        try {
          await storage.selectDirectory();
        } catch {
          return;
        }
      }
      setIsSaving(true);
      try {
        const saved = await storage.saveCapture(
          pendingPhoto.dataUrl,
          pendingPhoto.area,
          notes
        );
        if (prevOverlayUrl.current) URL.revokeObjectURL(prevOverlayUrl.current);
        const newUrl = await storage.loadPhotoUrl(saved.area, saved.filename);
        prevOverlayUrl.current = newUrl;
        setOverlayUrl(newUrl);
        setPendingPhoto(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "保存に失敗しました");
      } finally {
        setIsSaving(false);
      }
    },
    [pendingPhoto, storage]
  );

  const handleCancelSave = useCallback(() => {
    setPendingPhoto(null);
    setSaveError(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A1F14] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-[#0A1F14]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-400/30 flex items-center justify-center">
              <span className="text-sm">🌱</span>
            </div>
            <h1 className="text-base font-bold text-white tracking-tight">
              Bloom Log
            </h1>
          </div>
          <a
            href="/history"
            className="text-xs font-medium text-slate-400 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors"
          >
            履歴
          </a>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block glow-green-sm" />
            クラウド保存
          </span>
          {cameraMode === "phone" && (
            <ConnectionStatus
              wsState={ws.connectionState}
              rtcState={rtc.connectionState}
              peerJoined={ws.peerJoined}
            />
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-white/[0.06]">
            <span className="text-xs text-slate-500">{username}</span>
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Trial banner */}
      {subscription === "trialing" && (
        <div className="px-6 pt-3">
          <TrialBanner daysLeft={trialDaysLeft} />
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center gap-5 p-6">
        {/* Camera mode toggle */}
        <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-1 text-xs self-start">
          <button
            onClick={() => setCameraMode("phone")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              cameraMode === "phone"
                ? "bg-white/[0.1] text-white shadow-sm shadow-black/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            スマホカメラ
          </button>
          <button
            onClick={() => setCameraMode("pc")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              cameraMode === "pc"
                ? "bg-white/[0.1] text-white shadow-sm shadow-black/20"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            PCカメラ
          </button>
        </div>

        {/* Video area */}
        <div className="relative w-full max-w-2xl aspect-video bg-black/40 rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/[0.08]">
          {isStreamReady ? (
            <>
              <VideoPreview ref={videoPreviewRef} stream={activeStream} />
              {showOverlay && overlayUrl && (
                <PreviousPhotoOverlay url={overlayUrl} opacity={overlayOpacity} />
              )}
              <GuideOverlay />
              {/* Brightness warning */}
              {(brightness === "dark" || brightness === "bright") && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 backdrop-blur-sm text-white text-xs px-4 py-2.5 rounded-full pointer-events-none shadow-lg">
                  <span className="text-sm">
                    {brightness === "dark" ? "🌑" : "☀️"}
                  </span>
                  <span>
                    {brightness === "dark"
                      ? "暗すぎます。明るい場所で撮影してください"
                      : "明るすぎます。光を調整してください"}
                  </span>
                </div>
              )}
              {/* Countdown overlay */}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                  <span
                    key={countdown}
                    className="text-white font-bold drop-shadow-2xl"
                    style={{
                      fontSize: "9rem",
                      lineHeight: 1,
                      animation: "countdown-pop 0.9s ease-out forwards",
                      textShadow: "0 4px 24px rgba(0,0,0,0.5)",
                    }}
                  >
                    {countdown}
                  </span>
                </div>
              )}
            </>
          ) : cameraMode === "pc" ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {localCamera.error ? (
                <div className="text-center text-red-400 px-6">
                  <p className="text-4xl mb-3">📷</p>
                  <p className="font-medium">カメラを起動できませんでした</p>
                  <p className="text-sm mt-1 opacity-70">{localCamera.error}</p>
                  <p className="text-xs mt-2 opacity-50">
                    ブラウザのカメラ権限を確認してください
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full mx-auto mb-3" />
                  <p className="text-sm">PCカメラを起動中...</p>
                </div>
              )}
            </div>
          ) : ws.sessionId ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {!ws.peerJoined ? (
                <QRCodeDisplay sessionId={ws.sessionId} />
              ) : (
                <div className="text-center text-slate-500">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full mx-auto mb-3" />
                  <p className="text-sm">映像接続を確立中...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="animate-spin w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm">サーバーに接続中...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls card */}
        <div className="w-full max-w-2xl glass-card rounded-2xl p-5 flex flex-col items-center gap-4">
          {/* Overlay controls */}
          {isStreamReady && overlayUrl && (
            <div className="flex items-center gap-4 text-sm w-full pb-4 border-b border-white/[0.06]">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={showOverlay}
                  onChange={(e) => setShowOverlay(e.target.checked)}
                  className="accent-emerald-400 w-3.5 h-3.5"
                />
                前回写真オーバーレイ
              </label>
              {showOverlay && (
                <label className="flex items-center gap-2 text-xs text-slate-400 ml-auto">
                  透明度
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="w-7 text-right tabular-nums">{overlayOpacity}%</span>
                </label>
              )}
            </div>
          )}

          {/* Area + Capture */}
          <AreaSelector selected={selectedArea} onChange={setSelectedArea} />
          <CaptureButton
            onCapture={handleCaptureClick}
            onCancel={handleCancelCountdown}
            disabled={!isStreamReady}
            countdown={countdown}
          />

          {saveError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
              {saveError}
            </p>
          )}
        </div>
      </main>

      {/* Photo save dialog */}
      {pendingPhoto && (
        <PhotoSaveDialog
          photo={pendingPhoto}
          onSave={handleSave}
          onCancel={handleCancelSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
