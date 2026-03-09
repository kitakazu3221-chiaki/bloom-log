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
        style={{
          boxShadow: isCounting
            ? undefined
            : disabled
            ? undefined
            : undefined,
        }}
      >
        {/* Outer ring */}
        <span
          className={`absolute inset-0 rounded-full border-4 ${
            isCounting
              ? "border-amber-400 pulse-orange"
              : disabled
              ? "border-slate-700"
              : "border-emerald-400 pulse-green"
          }`}
        />

        {/* Inner circle */}
        <span
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isCounting
              ? "bg-amber-400"
              : disabled
              ? "bg-slate-800"
              : "bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-400/30"
          }`}
        >
          {isCounting ? (
            <span className="text-white text-2xl font-bold leading-none tabular-nums">
              {countdown}
            </span>
          ) : (
            <span className="text-white text-xl">📷</span>
          )}
        </span>
      </button>

      <span className="text-xs text-slate-500 h-4 transition-all">
        {isCounting ? "タップでキャンセル" : disabled ? "" : "タップで撮影"}
      </span>
    </div>
  );
}
