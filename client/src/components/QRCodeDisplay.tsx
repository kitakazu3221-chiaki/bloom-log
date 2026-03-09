import { useState, useEffect } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  sessionId: string;
}

export function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.origin}/phone?session=${sessionId}`;
    QRCode.toDataURL(url, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [sessionId]);

  const sessionUrl = `${window.location.origin}/phone?session=${sessionId}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 rounded-xl" />
      ) : (
        <div className="w-64 h-64 bg-white/[0.04] animate-pulse rounded-xl" />
      )}
      <p className="text-slate-300 text-sm text-center">
        スマホでQRコードを読み取ってください
      </p>
      <p className="text-slate-600 text-xs text-center break-all max-w-xs">
        {sessionUrl}
      </p>
    </div>
  );
}
