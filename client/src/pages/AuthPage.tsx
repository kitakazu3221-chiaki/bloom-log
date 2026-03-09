import { useState } from "react";

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
}

export function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTabChange = (next: "login" | "register") => {
    setTab(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "register" && password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setSubmitting(true);
    try {
      if (tab === "login") {
        await onLogin(username, password);
      } else {
        await onRegister(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1F14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-900/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-800/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        {/* Card */}
        <div className="glass-card rounded-3xl overflow-hidden glow-green">
          {/* Gold accent stripe */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-400/30 mb-4 animate-float">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bloom Log
            </h1>
            <p className="text-sm text-slate-400 mt-1">頭皮記録アプリ</p>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
            <button
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "login"
                  ? "bg-white/[0.1] text-white shadow-sm shadow-black/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "register"
                  ? "bg-white/[0.1] text-white shadow-sm shadow-black/20"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              アカウント作成
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例: yamada_taro"
                autoComplete="username"
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "8文字以上" : ""}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/30 transition-all"
              />
            </div>

            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/30 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3">
                <span className="text-base leading-none mt-0.5">⚠</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-[#0A1F14] font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:from-emerald-400 hover:to-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting
                ? "処理中..."
                : tab === "login"
                ? "ログイン"
                : "アカウントを作成"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Bloom Log &middot; 頭皮ケア記録
        </p>
      </div>
    </div>
  );
}
