import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useI18n, I18nProvider } from "./hooks/useI18n";
import { PCPage } from "./pages/PCPage";
import { PhonePage } from "./pages/PhonePage";
import { HistoryPage } from "./pages/HistoryPage";
import { AuthPage } from "./pages/AuthPage";
import { PaywallPage } from "./pages/PaywallPage";
import { LandingPage } from "./pages/LandingPage";
import { LegalPage } from "./pages/LegalPage";

function App() {
  const url = new URL(window.location.href);
  const { pathname } = url;
  const sessionId = url.searchParams.get("session");

  return (
    <I18nProvider>
      {pathname === "/phone" && sessionId ? (
        <PhonePage sessionId={sessionId} />
      ) : (
        <AuthGate pathname={pathname} />
      )}
    </I18nProvider>
  );
}

function AuthGate({ pathname }: { pathname: string }) {
  const { user, loading, login, register, logout, refreshUser } = useAuth();
  const { t } = useI18n();
  const [toast, setToast] = useState<string | null>(null);

  // Handle Stripe checkout redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      refreshUser();
      setToast(t["toast.subscriptionStarted"]);
      setTimeout(() => setToast(null), 4000);
    }
  }, [refreshUser, t]);

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      await register(username, password);
      setToast(`${t["toast.welcomePrefix"]}${username}${t["toast.welcomeSuffix"]}`);
      setTimeout(() => setToast(null), 4000);
    },
    [register, t]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-pulse">
            <span className="text-4xl">🌱</span>
          </div>
          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (pathname === "/legal") return <LegalPage />;

  if (!user) {
    if (pathname === "/auth") {
      return <AuthPage onLogin={login} onRegister={handleRegister} />;
    }
    return <LandingPage />;
  }

  if (user.subscription === "expired") {
    return (
      <PaywallPage
        username={user.username}
        onLogout={logout}
      />
    );
  }

  const mainPage =
    pathname === "/history" ? (
      <HistoryPage
        username={user.username}
        onLogout={logout}
        subscription={user.subscription}
        trialDaysLeft={user.trialDaysLeft}
        createdAt={user.createdAt}
        storageMode={user.storageMode}
      />
    ) : (
      <PCPage
        username={user.username}
        onLogout={logout}
        subscription={user.subscription}
        trialDaysLeft={user.trialDaysLeft}
        createdAt={user.createdAt}
        storageMode={user.storageMode}
        onStorageModeChange={async (mode) => {
          await fetch("/api/settings/storage-mode", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode }),
          });
          refreshUser();
        }}
      />
    );

  return (
    <>
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl animate-fade-in-up">
          <span>🌱</span>
          {toast}
        </div>
      )}
      {mainPage}
    </>
  );
}

export default App;
