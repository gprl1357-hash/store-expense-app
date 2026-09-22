"use client";

import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import type { StoreConfig } from "@/lib/constants";

type StoreLoginModalProps = {
  store: StoreConfig;
};

export function StoreLoginModal({ store }: StoreLoginModalProps) {
  const { login, changePassword } = useAuth();
  const [step, setStep] = useState<"password" | "change">("password");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { requireChange } = await login(store.id, password);
      if (requireChange) {
        setStep("change");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    setError("");
    const validation = validatePasswordRules(newPassword);
    if (!validation.valid) {
      setError(validation.reason);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setLoading(true);
    try {
      await changePassword(store.id, password, newPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        <Lock className="h-8 w-8 text-blue-600" />
      </div>

      {step === "password" ? (
        <>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{store.shortName}</p>
            <p className="mt-1 text-base text-gray-500">매장 ID: {store.loginId}</p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="비밀번호"
            className="min-h-16 w-full rounded-2xl border-0 bg-gray-50 px-5 text-center text-2xl font-bold tracking-widest text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
          />

          {error && (
            <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-lg font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "로그인"}
          </button>

          <p className="text-center text-base text-gray-400">
            비밀번호를 잊으셨다면 관리자에게 문의하세요.
          </p>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">최초 로그인 — 비밀번호 변경</p>
            <p className="mt-1 text-base text-gray-500">
              8자 이상, 영문·숫자·특수문자 중 2종류 이상 포함
            </p>
          </div>

          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="새 비밀번호"
            className="min-h-16 w-full rounded-2xl border-0 bg-gray-50 px-5 text-xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
            placeholder="새 비밀번호 확인"
            className="min-h-16 w-full rounded-2xl border-0 bg-gray-50 px-5 text-xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
          />

          {error && (
            <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-lg font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={loading}
            className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "비밀번호 변경"}
          </button>
        </>
      )}
    </div>
  );
}
