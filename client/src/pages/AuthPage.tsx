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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-100/60 overflow-hidden">
          {/* Brand stripe */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-emerald-200 mb-4">
              <span className="text-2xl">🌱</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Bloom Log
            </h1>
            <p className="text-sm text-gray-400 mt-1">頭皮記録アプリ</p>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "login"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === "register"
                  ? "bg-white shadow text-gray-800"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              アカウント作成
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例: yamada_taro"
                autoComplete="username"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? "8文字以上" : ""}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-shadow"
              />
            </div>

            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  パスワード（確認）
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-shadow"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3">
                <span className="text-base leading-none mt-0.5">⚠</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-sm shadow-md shadow-emerald-200 hover:from-emerald-400 hover:to-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting
                ? "処理中..."
                : tab === "login"
                ? "ログイン"
                : "アカウントを作成"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Bloom Log &middot; 頭皮ケア記録
        </p>
      </div>
    </div>
  );
}
