import { useState, useEffect, useCallback } from "react";
import { useI18n } from "./useI18n";

export interface AuthUser {
  username: string;
  subscription: "free" | "active";
  trialDaysLeft: number;
  createdAt: string;
  storageMode: "cloud" | "local" | "filesystem";
  region: "jp" | "global";
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      if (!r.ok) return null;
      return (await r.json()) as AuthUser;
    } catch {
      return null;
    }
  }, []);

  // Check login status on mount
  useEffect(() => {
    fetchMe()
      .then((data) => setUser(data))
      .finally(() => setLoading(false));
  }, [fetchMe]);

  const refreshUser = useCallback(async () => {
    const data = await fetchMe();
    setUser(data);
  }, [fetchMe]);

  const login = useCallback(async (username: string, password: string) => {
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    const data = (await r.json()) as { error?: string };
    if (!r.ok) throw new Error(data.error ?? t["auth.loginFailed"]);
    const me = await fetchMe();
    setUser(me);
  }, [fetchMe, t]);

  const register = useCallback(async (username: string, password: string) => {
    const r = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    const data = (await r.json()) as { error?: string };
    if (!r.ok) throw new Error(data.error ?? t["auth.registerFailed"]);
    const me = await fetchMe();
    setUser(me);
  }, [fetchMe, t]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  return { user, loading, login, register, logout, refreshUser };
}
