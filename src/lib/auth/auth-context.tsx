"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { StoreId } from "../constants";

type LoginResult = { requireChange: boolean };

type AuthContextValue = {
  authenticatedStoreIds: Set<string>;
  loadingStatus: boolean;
  refreshStatus: () => Promise<void>;
  login: (storeId: StoreId, password: string) => Promise<LoginResult>;
  changePassword: (
    storeId: StoreId,
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  logout: (storeId: StoreId) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readError(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return body?.error ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticatedStoreIds, setAuthenticatedStoreIds] = useState<
    Set<string>
  >(new Set());
  const [loadingStatus, setLoadingStatus] = useState(true);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/status");
      const body = await res.json();
      setAuthenticatedStoreIds(new Set(body.authenticatedStoreIds ?? []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const login = useCallback(
    async (storeId: StoreId, password: string): Promise<LoginResult> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, password }),
      });
      if (!res.ok) {
        throw new Error(await readError(res, "로그인에 실패했습니다."));
      }
      const body = await res.json();
      if (!body.requireChange) {
        setAuthenticatedStoreIds((prev) => new Set(prev).add(storeId));
      }
      return { requireChange: Boolean(body.requireChange) };
    },
    []
  );

  const changePassword = useCallback(
    async (storeId: StoreId, currentPassword: string, newPassword: string) => {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, currentPassword, newPassword }),
      });
      if (!res.ok) {
        throw new Error(await readError(res, "비밀번호 변경에 실패했습니다."));
      }
      setAuthenticatedStoreIds((prev) => new Set(prev).add(storeId));
    },
    []
  );

  const logout = useCallback(async (storeId: StoreId) => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId }),
    });
    setAuthenticatedStoreIds((prev) => {
      const next = new Set(prev);
      next.delete(storeId);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authenticatedStoreIds,
      loadingStatus,
      refreshStatus,
      login,
      changePassword,
      logout,
    }),
    [authenticatedStoreIds, loadingStatus, refreshStatus, login, changePassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
