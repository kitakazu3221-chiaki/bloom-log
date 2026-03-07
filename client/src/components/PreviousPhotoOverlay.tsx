interface PreviousPhotoOverlayProps {
  url: string;
  opacity: number; // 0–100
}

export function PreviousPhotoOverlay({ url, opacity }: PreviousPhotoOverlayProps) {
  return (
    <img
      src={url}
      alt="前回の写真"
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ opacity: opacity / 100 }}
    />
  );
}
