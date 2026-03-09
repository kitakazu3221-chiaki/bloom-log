import { useState } from "react";

interface PaywallPageProps {
  username: string;
  onLogout: () => void;
}

export function PaywallPage({ username, onLogout }: PaywallPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/subscription/checkout", {
        method: "POST",
        credentials: "include",
      });
      const data = (await r.json()) as { url?: string; error?: string };
      if (!r.ok) throw new Error(data.error ?? "エラーが発生しました");
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
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

  return (
    <div className="min-h-screen bg-[#0A1F14] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-800/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        <div className="glass-card rounded-3xl overflow-hidden glow-gold">
          {/* Gold accent stripe */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-2 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-400/30 mb-4">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bloom Log
            </h1>
            <p className="text-sm text-slate-400 mt-1">{username} さん</p>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-4">
            <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl px-5 py-4 text-center">
              <p className="text-sm font-semibold text-amber-400 mb-1">
                無料トライアルが終了しました
              </p>
              <p className="text-xs text-amber-400/60">
                引き続きご利用いただくにはサブスクリプションの登録が必要です
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-5 py-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-white">月額プラン</span>
                <span className="text-xs text-slate-500">毎月自動更新</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  頭皮写真の撮影・記録（無制限）
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  Before/After比較・タイムライン
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">&#10003;</span>
                  スマホカメラ連携（WebRTC）
                </li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3">
                <span className="text-base leading-none mt-0.5">&#9888;</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#0A1F14] font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? "処理中..." : "サブスクリプションを開始"}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleManage}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                お支払い管理
              </button>
              <button
                onClick={onLogout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Bloom Log &middot; 頭皮ケア記録
        </p>
      </div>
    </div>
  );
}
