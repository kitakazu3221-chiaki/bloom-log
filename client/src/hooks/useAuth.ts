import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  username: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check login status on mount
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<AuthUser>) : null))
      .catch(() => null)
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    const data = (await r.json()) as AuthUser & { error?: string };
    if (!r.ok) throw new Error(data.error ?? "ログインに失敗しました");
    setUser({ username: data.username });
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    const data = (await r.json()) as AuthUser & { error?: string };
    if (!r.ok) throw new Error(data.error ?? "登録に失敗しました");
    setUser({ username: data.username });
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
