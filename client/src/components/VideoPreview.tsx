import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

interface VideoPreviewProps {
  stream: MediaStream | null;
  className?: string;
}

export interface VideoPreviewHandle {
  getVideoElement: () => HTMLVideoElement | null;
}

export const VideoPreview = forwardRef<VideoPreviewHandle, VideoPreviewProps>(
  function VideoPreview({ stream, className = "" }, ref) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      getVideoElement: () => videoRef.current,
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
    }, [stream]);

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
);
