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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100/60 overflow-hidden">
          {/* Brand stripe */}
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-2 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-200 mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Bloom Log
            </h1>
            <p className="text-sm text-gray-400 mt-1">{username} さん</p>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-6 space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 text-center">
              <p className="text-sm font-semibold text-amber-700 mb-1">
                無料トライアルが終了しました
              </p>
              <p className="text-xs text-amber-600/80">
                引き続きご利用いただくにはサブスクリプションの登録が必要です
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl px-5 py-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">月額プラン</span>
                <span className="text-xs text-gray-400">毎月自動更新</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">&#10003;</span>
                  頭皮写真の撮影・記録（無制限）
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">&#10003;</span>
                  Before/After比較・タイムライン
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500">&#10003;</span>
                  スマホカメラ連携（WebRTC）
                </li>
              </ul>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3">
                <span className="text-base leading-none mt-0.5">&#9888;</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm shadow-md shadow-emerald-200 hover:from-emerald-400 hover:to-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? "処理中..." : "サブスクリプションを開始"}
            </button>

            <div className="flex items-center justify-between">
              <button
                onClick={handleManage}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                お支払い管理
              </button>
              <button
                onClick={onLogout}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Bloom Log &middot; 頭皮ケア記録
        </p>
      </div>
    </div>
  );
}
