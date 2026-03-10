import { useState } from "react";

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/subscription/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = (await r.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-xs text-amber-600">
        <span className="font-semibold">無料トライアル:</span>{" "}
        残り {daysLeft} 日
      </p>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="shrink-0 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
      >
        {loading ? "..." : "プランを選択"}
      </button>
    </div>
  );
}
