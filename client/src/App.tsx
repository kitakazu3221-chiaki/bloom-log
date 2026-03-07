import { useState, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { PCPage } from "./pages/PCPage";
import { PhonePage } from "./pages/PhonePage";
import { HistoryPage } from "./pages/HistoryPage";
import { AuthPage } from "./pages/AuthPage";

function App() {
  const url = new URL(window.location.href);
  const { pathname } = url;
  const sessionId = url.searchParams.get("session");

  if (pathname === "/phone" && sessionId) {
    return <PhonePage sessionId={sessionId} />;
  }

  return <AuthGate pathname={pathname} />;
}

function AuthGate({ pathname }: { pathname: string }) {
  // Single useAuth instance — auth state is shared with AuthPage via props
  const { user, loading, login, register, logout } = useAuth();
  const [toast, setToast] = useState<string | null>(null);

  const handleRegister = useCallback(
    async (username: string, password: string) => {
      await register(username, password);
      // After register, user becomes non-null → main app is shown with this toast
      setToast(`ようこそ、${username} さん！アカウントを作成しました`);
      setTimeout(() => setToast(null), 4000);
    },
    [register]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200 animate-pulse">
            <span className="text-xl">🌱</span>
          </div>
          <div className="animate-spin w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    // Pass login/register from this hook so state updates here when called
    return <AuthPage onLogin={login} onRegister={handleRegister} />;
  }

  const mainPage =
    pathname === "/history" ? (
      <HistoryPage username={user.username} onLogout={logout} />
    ) : (
      <PCPage username={user.username} onLogout={logout} />
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
