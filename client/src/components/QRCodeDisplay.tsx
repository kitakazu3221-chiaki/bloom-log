import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useI18n } from "../hooks/useI18n";

interface QRCodeDisplayProps {
  sessionId: string;
}

export function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const { t } = useI18n();
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
        <div className="w-64 h-64 bg-secondary animate-pulse rounded-xl" />
      )}
      <p className="text-theme-secondary text-base text-center">
        {t["qr.instruction"]}
      </p>
      <p className="text-theme-faint text-sm text-center break-all max-w-xs">
        {sessionUrl}
      </p>
    </div>
  );
}
