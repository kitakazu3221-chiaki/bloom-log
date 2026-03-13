import { useState, useEffect } from "react";

interface UseLocalCameraReturn {
  stream: MediaStream | null;
  error: string | null;
}

export function useLocalCamera(enabled: boolean, facingMode?: "user" | "environment"): UseLocalCameraReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
      setError(null);
      return;
    }

    let active = true;

    const videoConstraints: MediaTrackConstraints = facingMode
      ? { facingMode }
      : { facingMode: "user" };

    navigator.mediaDevices
      .getUserMedia({ video: videoConstraints, audio: false })
      .then((s) => {
        if (active) {
          setStream(s);
          setError(null);
        } else {
          s.getTracks().forEach((t) => t.stop());
        }
      })
      .catch((err: Error) => {
        if (active) setError(err.message);
      });

    return () => {
      active = false;
      setStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    };
  }, [enabled]);

  return { stream, error };
}
