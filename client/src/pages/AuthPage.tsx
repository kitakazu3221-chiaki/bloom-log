import { useState, useEffect, useRef } from "react";
import { useI18n } from "../hooks/useI18n";

interface AuthPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
  onGoogleLogin: (credential: string) => Promise<void>;
}

export function AuthPage({ onLogin, onRegister, onGoogleLogin }: AuthPageProps) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId || !window.google?.accounts?.id || !googleBtnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: { credential: string }) => {
        setSubmitting(true);
        setError(null);
        try {
          await onGoogleLogin(response.credential);
        } catch (err) {
          setError(err instanceof Error ? err.message : t["common.error"]);
          setSubmitting(false);
        }
      },
    });
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline", size: "large", width: 320, text: "signin_with",
      shape: "pill", locale: locale === "ja" ? "ja" : "en",
    });
  }, [onGoogleLogin, t, locale]);

  const handleTabChange = (next: "login" | "register") => {
    setTab(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === "register" && password !== confirmPassword) {
      setError(t["auth.passwordMismatch"]);
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
      setError(err instanceof Error ? err.message : t["common.error"]);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-50/60 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-in-up relative z-10">
        {/* Card */}
        <div className="bg-surface rounded-3xl overflow-hidden shadow-lg shadow-[var(--shadow-color-md)] border border-theme-light">
          {/* Green accent stripe */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

          {/* Logo */}
          <div className="px-8 pt-8 pb-5 text-center">
            <div className="inline-flex items-center justify-center mb-4 animate-float">
              <span className="text-4xl">🌱</span>
            </div>
            <h1 className="text-3xl font-bold text-theme-primary tracking-tight">
              Bloom Log
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex mx-6 mb-1 bg-secondary rounded-xl p-1">
            <button
              onClick={() => handleTabChange("login")}
              className={`flex-1 py-2.5 text-base font-medium rounded-lg transition-all ${
                tab === "login"
                  ? "bg-surface text-theme-primary shadow-sm"
                  : "text-theme-muted hover:text-theme-secondary"
              }`}
            >
              {t["auth.login"]}
            </button>
            <button
              onClick={() => handleTabChange("register")}
              className={`flex-1 py-2.5 text-base font-medium rounded-lg transition-all ${
                tab === "register"
                  ? "bg-surface text-theme-primary shadow-sm"
                  : "text-theme-muted hover:text-theme-secondary"
              }`}
            >
              {t["auth.createAccount"]}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-theme-secondary uppercase tracking-wide mb-1.5">
                {t["auth.username"]}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t["auth.usernamePlaceholder"]}
                autoComplete="username"
                required
                className="w-full bg-input border border-theme rounded-xl px-4 py-3.5 text-base text-theme-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-theme-secondary uppercase tracking-wide mb-1.5">
                {t["auth.password"]}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "register" ? t["auth.passwordHint"] : ""}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                required
                className="w-full bg-input border border-theme rounded-xl px-4 py-3.5 text-base text-theme-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
              />
            </div>

            {tab === "register" && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-theme-secondary uppercase tracking-wide mb-1.5">
                  {t["auth.confirmPassword"]}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full bg-input border border-theme rounded-xl px-4 py-3.5 text-base text-theme-primary placeholder-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
                <span className="text-lg leading-none mt-0.5">⚠</span>
                <p className="text-base">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-base shadow-md shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {submitting
                ? t["common.processing"]
                : tab === "login"
                ? t["auth.login"]
                : t["auth.submitCreate"]}
            </button>

            {/* Divider + Google Sign-In */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-theme-light" />
              <span className="text-sm text-theme-muted">{t["auth.or"]}</span>
              <div className="flex-1 h-px bg-theme-light" />
            </div>
            <div ref={googleBtnRef} className="flex justify-center" />
          </form>
        </div>

      </div>
    </div>
  );
}
