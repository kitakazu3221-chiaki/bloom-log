import { useState, useEffect, useRef } from "react";

export type BrightnessLevel = "dark" | "bright" | "normal" | null;

// Sample the video feed's luminance on an interval.
// getVideo is a stable getter (e.g. () => videoPreviewRef.current?.getVideoElement() ?? null).
// Returns null when no video is available or enabled is false.
export function useBrightnessCheck(
  getVideo: () => HTMLVideoElement | null,
  enabled: boolean
): BrightnessLevel {
  const [level, setLevel] = useState<BrightnessLevel>(null);
  const getVideoRef = useRef(getVideo);
  getVideoRef.current = getVideo;

  useEffect(() => {
    if (!enabled) {
      setLevel(null);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 36;
    const ctx = canvas.getContext("2d")!;

    const check = () => {
      const video = getVideoRef.current();
      if (!video || video.readyState < 2 || video.videoWidth === 0) {
        setLevel(null);
        return;
      }

      ctx.drawImage(video, 0, 0, 64, 36);
      const { data } = ctx.getImageData(0, 0, 64, 36);

      // Average luminance via ITU-R BT.601
      let sum = 0;
      const pixelCount = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avg = sum / pixelCount; // 0–255

      if (avg < 40) {
        setLevel("dark");
      } else if (avg > 220) {
        setLevel("bright");
      } else {
        setLevel("normal");
      }
    };

    const intervalId = setInterval(check, 1500);
    check();

    return () => {
      clearInterval(intervalId);
      setLevel(null);
    };
  }, [enabled]); // eslint-disable-line

  return level;
}
