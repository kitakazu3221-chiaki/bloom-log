import { useState } from "react";
import { useI18n } from "../hooks/useI18n";

interface PaywallPageProps {
  username: string;
  onLogout: () => void;
}

export function PaywallPage({ username, onLogout }: PaywallPageProps) {
  const { t, locale } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/subscription/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      const data = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? t["common.error"]);
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t["common.error"]);
      setLoading(false);
    }
  };

  const handleManage = async () => {
    try {
      const r = await fetch("/api/subscription/portal", {
        method: "POST",
        credentials: "include",
      });
      const data = (await r.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
    } catch {
      // portal not available for this user
    }
  };

  const greetingText = locale === "ja"
    ? `${username} ${t["paywall.greeting"]}`
    : username;

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        <div className="bg-surface rounded-3xl overflow-hidden shadow-lg shadow-[var(--shadow-color-md)] border border-theme-light">
          {/* Green accent stripe */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-2 text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <span className="text-4xl">🌱</span>
            </div>
            <h1 className="text-3xl font-bold text-theme-primary tracking-tight">
              Bloom Log
            </h1>
            <p className="text-base text-theme-muted mt-1">{greetingText}</p>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-center">
              <p className="text-base font-semibold text-amber-600 mb-1">
                {t["paywall.trialEnded"]}
              </p>
              <p className="text-sm text-amber-500">
                {t["paywall.subscriptionRequired"]}
              </p>
            </div>

            <div className="bg-input border border-theme rounded-2xl px-5 py-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-base font-semibold text-theme-primary">{t["paywall.monthlyPlan"]}</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-emerald-600">{t["paywall.price"]}</span>
                  <span className="text-sm text-theme-muted">{t["paywall.pricePeriod"]}</span>
                </div>
              </div>
              <p className="text-xs text-theme-muted mb-2">{t["paywall.autoRenew"]}</p>
              <ul className="space-y-1.5 text-sm text-theme-secondary">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">&#10003;</span>
                  {t["paywall.feature1"]}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">&#10003;</span>
                  {t["paywall.feature2"]}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-600">&#10003;</span>
                  {t["paywall.feature3"]}
                </li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
                <span className="text-lg leading-none mt-0.5">&#9888;</span>
                <p className="text-base">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? t["common.processing"] : t["paywall.subscribe"]}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleManage}
                className="text-sm text-theme-muted hover:text-theme-secondary transition-colors"
              >
                {t["paywall.managePayment"]}
              </button>
              <button
                onClick={onLogout}
                className="text-sm text-theme-muted hover:text-theme-secondary transition-colors"
              >
                {t["common.logout"]}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-theme-muted mt-6">
          Bloom Log &middot; {t["paywall.tagline"]}
        </p>
      </div>
    </div>
  );
}
