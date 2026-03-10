import { useState } from "react";
import { useI18n } from "../hooks/useI18n";

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/subscription/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await r.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  };

  const trialText = locale === "ja"
    ? <><span className="font-semibold">{t["trial.label"]}</span>{" "}{t["trial.remaining"]} {daysLeft} {t["trial.days"]}</>
    : <><span className="font-semibold">{t["trial.label"]}</span>{" "}{daysLeft} {t["trial.days"]}</>;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
      <p className="text-sm text-amber-600">
        {trialText}
      </p>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="shrink-0 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-60"
      >
        {loading ? "..." : t["trial.selectPlan"]}
      </button>
    </div>
  );
}
