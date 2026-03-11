import { useState, useCallback, useRef, useEffect } from "react";
import { useSignaling } from "../hooks/useSignaling";
import { useWebRTC } from "../hooks/useWebRTC";
import { useStorage } from "../hooks/useStorage";
import { useLocalCamera } from "../hooks/useLocalCamera";
import { useBrightnessCheck } from "../hooks/useBrightnessCheck";
import { useI18n } from "../hooks/useI18n";
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
import { LanguageSelect } from "../components/LanguageSelect";
import { ThemeToggle } from "../components/ThemeToggle";

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
  createdAt: string;
  storageMode: "cloud" | "local";
  onStorageModeChange: (mode: "cloud" | "local") => void;
}

export function PCPage({ username, onLogout, subscription, trialDaysLeft, createdAt, storageMode, onStorageModeChange }: PCPageProps) {
  const { t, locale } = useI18n();
  const [cameraMode, setCameraMode] = useState<CameraMode>("phone");
  const [selectedArea, setSelectedArea] = useState<ScalpArea>("top");
  const [pendingPhoto, setPendingPhoto] = useState<CapturedPhoto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(40);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showStorageConfirm, setShowStorageConfirm] = useState(false);
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
  const storage = useStorage(storageMode);
  const localCamera = useLocalCamera(cameraMode === "pc");

  rtcHandleSignalRef.current = rtc.handleSignal;

  const activeStream =
    cameraMode === "pc" ? localCamera.stream : rtc.remoteStream;
  const isStreamReady = activeStream !== null;

  const brightness = useBrightnessCheck(
    () => videoPreviewRef.current?.getVideoElement() ?? null,
    isStreamReady
  );

  const dayCount = Math.max(1, Math.ceil((Date.now() - new Date(createdAt).getTime()) / 86400000));

  useEffect(() => {
    if (!storage.isReady) return;
    let cancelled = false;
    storage.loadRecords().then(async (records) => {
      const areaRecords = records.filter((r) => r.area === selectedArea);
      const latest = areaRecords[areaRecords.length - 1];
      if (!latest || cancelled) return;
      const url = await storage.loadPhotoUrl(latest.area, latest.filename, latest.id);
      if (cancelled) { if (url) URL.revokeObjectURL(url); return; }
      if (prevOverlayUrl.current) URL.revokeObjectURL(prevOverlayUrl.current);
      prevOverlayUrl.current = url;
      setOverlayUrl(url);
    });
    return () => { cancelled = true; };
  }, [selectedArea, storage.isReady]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { capturePhoto(); setCountdown(null); return; }
    const timer = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, capturePhoto]);

  const handleCaptureClick = useCallback(() => { setCountdown(3); setSaveError(null); }, []);
  const handleCancelCountdown = useCallback(() => { setCountdown(null); }, []);

  const handleSave = useCallback(
    async (notes: NoteData) => {
      if (!pendingPhoto) return;
      if (!storage.isReady) { try { await storage.selectDirectory(); } catch { return; } }
      setIsSaving(true);
      try {
        const saved = await storage.saveCapture(pendingPhoto.dataUrl, pendingPhoto.area, notes);
        if (prevOverlayUrl.current) URL.revokeObjectURL(prevOverlayUrl.current);
        const newUrl = await storage.loadPhotoUrl(saved.area, saved.filename, saved.id);
        prevOverlayUrl.current = newUrl;
        setOverlayUrl(newUrl);
        setPendingPhoto(null);
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : t["pc.saveFailed"]);
      } finally { setIsSaving(false); }
    },
    [pendingPhoto, storage, t]
  );

  const handleCancelSave = useCallback(() => { setPendingPhoto(null); setSaveError(null); }, []);

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-header backdrop-blur-sm border-b border-theme">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <h1 className="text-lg font-bold text-theme-primary tracking-tight">Bloom Log</h1>
          </div>
          <a href="/" className="text-sm font-medium text-theme-secondary bg-secondary hover:bg-[var(--border)] border border-theme rounded-lg px-3 py-1.5 transition-colors">
            {t["home.home"]}
          </a>
          <a href="/history" className="text-sm font-medium text-theme-secondary bg-secondary hover:bg-[var(--border)] border border-theme rounded-lg px-3 py-1.5 transition-colors">
            {t["pc.history"]}
          </a>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
            {locale === "ja" ? `${dayCount}${t["pc.dayCount"]}` : `Day ${dayCount}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelect />
          <button
            onClick={() => setShowStorageConfirm(true)}
            className="text-sm text-theme-muted flex items-center gap-1.5 hover:text-theme-secondary transition-colors"
            title={t["pc.storageSwitchTitle"]}
          >
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${storageMode === "cloud" ? "bg-emerald-500" : "bg-amber-500"}`} />
            {storageMode === "cloud" ? t["pc.cloudStorage"] : t["pc.localStorage"]}
          </button>
          {cameraMode === "phone" && (
            <ConnectionStatus wsState={ws.connectionState} rtcState={rtc.connectionState} peerJoined={ws.peerJoined} />
          )}
          {subscription === "trialing" && (
            <div className="flex items-center gap-2 pl-2 border-l border-theme">
              <span className="text-sm text-amber-600">
                {locale === "ja"
                  ? `${t["trial.label"]} ${t["trial.remaining"]} ${trialDaysLeft} ${t["trial.days"]}`
                  : `${t["trial.label"]} ${trialDaysLeft} ${t["trial.days"]}`}
              </span>
              <button onClick={() => window.location.href = "/paywall"} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md px-2 py-1 transition-colors">
                {t["trial.selectPlan"]}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 pl-2 border-l border-theme">
            <span className="text-sm text-theme-muted">{username}</span>
            <button onClick={onLogout} className="text-sm text-theme-muted hover:text-theme-secondary transition-colors">
              {t["common.logout"]}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center gap-5 p-6">
        {/* Camera mode toggle */}
        <div className="flex items-center gap-1.5 bg-secondary border border-theme rounded-2xl p-1.5 text-base">
          <button
            onClick={() => setCameraMode("phone")}
            className={`px-5 py-3 rounded-xl font-bold transition-all ${
              cameraMode === "phone"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "text-theme-muted hover:text-theme-secondary hover:bg-surface"
            }`}
          >
            {t["pc.phoneCamera"]}
          </button>
          <button
            onClick={() => setCameraMode("pc")}
            className={`px-5 py-3 rounded-xl font-bold transition-all ${
              cameraMode === "pc"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "text-theme-muted hover:text-theme-secondary hover:bg-surface"
            }`}
          >
            {t["pc.pcCamera"]}
          </button>
        </div>

        {/* Video area */}
        <div className="relative w-full max-w-2xl aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-lg ring-1 ring-theme">
          {isStreamReady ? (
            <>
              <VideoPreview ref={videoPreviewRef} stream={activeStream} />
              {showOverlay && overlayUrl && <PreviousPhotoOverlay url={overlayUrl} opacity={overlayOpacity} />}
              <GuideOverlay />
              {(brightness === "dark" || brightness === "bright") && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/75 backdrop-blur-sm text-white text-sm px-4 py-2.5 rounded-full pointer-events-none shadow-lg">
                  <span className="text-base">{brightness === "dark" ? "🌑" : "☀️"}</span>
                  <span>{brightness === "dark" ? t["pc.tooDark"] : t["pc.tooBright"]}</span>
                </div>
              )}
              {countdown !== null && countdown > 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                  <span key={countdown} className="text-white font-bold drop-shadow-2xl" style={{ fontSize: "9rem", lineHeight: 1, animation: "countdown-pop 0.9s ease-out forwards", textShadow: "0 4px 24px rgba(0,0,0,0.5)" }}>
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
                  <p className="font-medium text-base">{t["pc.cameraFailed"]}</p>
                  <p className="text-base mt-1 opacity-70">{localCamera.error}</p>
                  <p className="text-sm mt-2 opacity-50">{t["pc.checkPermission"]}</p>
                </div>
              ) : (
                <div className="text-center text-theme-muted">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-3" />
                  <p className="text-base">{t["pc.startingCamera"]}</p>
                </div>
              )}
            </div>
          ) : ws.sessionId ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {!ws.peerJoined ? (
                <QRCodeDisplay sessionId={ws.sessionId} />
              ) : (
                <div className="text-center text-theme-muted">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full mx-auto mb-3" />
                  <p className="text-base">{t["pc.establishingVideo"]}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-theme-muted">
                <div className="animate-spin w-8 h-8 border-2 border-theme-faint border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-base">{t["pc.connectingServer"]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls card */}
        <div className="w-full max-w-2xl card rounded-2xl p-5 flex flex-col items-center gap-4">
          {isStreamReady && overlayUrl && (
            <div className="flex items-center gap-4 text-sm w-full pb-4 border-b border-theme">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-theme-secondary">
                <input type="checkbox" checked={showOverlay} onChange={(e) => setShowOverlay(e.target.checked)} className="accent-emerald-600 w-4 h-4" />
                {t["pc.overlayLabel"]}
              </label>
              {showOverlay && (
                <label className="flex items-center gap-2 text-sm text-theme-secondary ml-auto">
                  {t["pc.opacity"]}
                  <input type="range" min={10} max={80} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-20" />
                  <span className="w-7 text-right tabular-nums">{overlayOpacity}%</span>
                </label>
              )}
            </div>
          )}
          <AreaSelector selected={selectedArea} onChange={setSelectedArea} />
          <CaptureButton onCapture={handleCaptureClick} onCancel={handleCancelCountdown} disabled={!isStreamReady} countdown={countdown} />
          {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{saveError}</p>}
        </div>
      </main>

      {pendingPhoto && <PhotoSaveDialog photo={pendingPhoto} onSave={handleSave} onCancel={handleCancelSave} isSaving={isSaving} />}

      {showStorageConfirm && (() => {
        const nextMode = storageMode === "cloud" ? "local" : "cloud";
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStorageConfirm(false)} />
            <div className="relative bg-surface rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <h3 className="text-lg font-bold text-theme-primary">
                {nextMode === "local" ? t["pc.switchToLocal"] : t["pc.switchToCloud"]}
              </h3>
              <div className="text-base text-theme-secondary space-y-2">
                {nextMode === "local" ? (
                  <>
                    <p>{t["pc.localWarning"]}</p>
                    <p className="text-amber-600 font-medium">{t["pc.localCaution"]}</p>
                  </>
                ) : (
                  <>
                    <p>{t["pc.cloudDesc"]}</p>
                    <p className="text-theme-muted">{t["pc.cloudNote"]}</p>
                  </>
                )}
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setShowStorageConfirm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-theme-secondary text-base font-medium border border-theme">
                  {t["common.cancel"]}
                </button>
                <button onClick={() => { onStorageModeChange(nextMode); setShowStorageConfirm(false); }} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-base font-bold shadow-md">
                  {t["pc.switch"]}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
