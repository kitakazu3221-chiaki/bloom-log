import { useI18n } from "../hooks/useI18n";

interface CaptureButtonProps {
  onCapture: () => void;
  onCancel?: () => void;
  disabled?: boolean;
  countdown: number | null; // null = idle, 1-3 = counting
}

export function CaptureButton({
  onCapture,
  onCancel,
  disabled,
  countdown,
}: CaptureButtonProps) {
  const { t } = useI18n();
  const isCounting = countdown !== null;

  const handleClick = () => {
    if (isCounting) {
      onCancel?.();
    } else {
      onCapture();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={disabled && !isCounting}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 focus:outline-none ${
          disabled && !isCounting ? "cursor-not-allowed opacity-40" : ""
        }`}
      >
        {/* Outer ring */}
        <span
          className={`absolute inset-0 rounded-full border-4 ${
            isCounting
              ? "border-amber-400 pulse-orange"
              : disabled
              ? "border-theme-faint"
              : "border-emerald-500 pulse-green"
          }`}
        />

        {/* Inner circle */}
        <span
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isCounting
              ? "bg-amber-400"
              : disabled
              ? "bg-secondary"
              : "bg-emerald-600 shadow-md shadow-emerald-600/20"
          }`}
        >
          {isCounting ? (
            <span className="text-white text-3xl font-bold leading-none tabular-nums">
              {countdown}
            </span>
          ) : (
            <span className="text-white text-2xl font-bold">●</span>
          )}
        </span>
      </button>

      <span className="text-sm text-theme-muted h-5 transition-all">
        {isCounting ? t["capture.tapToCancel"] : disabled ? "" : t["capture.tapToCapture"]}
      </span>
    </div>
  );
}
