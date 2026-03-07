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
              ? "border-orange-400 pulse-orange"
              : disabled
              ? "border-gray-300"
              : "border-emerald-400 pulse-green"
          }`}
        />

        {/* Inner circle */}
        <span
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isCounting
              ? "bg-orange-400"
              : disabled
              ? "bg-gray-200"
              : "bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-300/50"
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

      <span className="text-xs text-gray-400 h-4 transition-all">
        {isCounting ? "タップでキャンセル" : disabled ? "" : "タップで撮影"}
      </span>
    </div>
  );
}
