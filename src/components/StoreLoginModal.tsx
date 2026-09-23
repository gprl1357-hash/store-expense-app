"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import type { StoreConfig } from "@/lib/constants";
import { PasswordInput } from "./PasswordInput";

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
    <div className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-lg ring-1 ring-gray-100">
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          {step === "password" ? (
            <Lock className="h-9 w-9 text-blue-600" />
          ) : (
            <KeyRound className="h-9 w-9 text-blue-600" />
          )}
        </div>

        {step === "password" ? (
          <>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{store.shortName}</p>
              <p className="mt-2 inline-block rounded-full bg-gray-100 px-4 py-1 text-base font-semibold text-gray-500">
                매장 ID {store.loginId}
              </p>
            </div>

            <PasswordInput
              value={password}
              onChange={setPassword}
              onEnter={handleLogin}
              placeholder="비밀번호"
              autoComplete="current-password"
              centered
              autoFocus
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
              className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md active:bg-blue-700 disabled:opacity-60"
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
              <span className="mb-2 inline-block rounded-full bg-blue-50 px-4 py-1 text-sm font-bold text-blue-600">
                최초 로그인
              </span>
              <p className="text-2xl font-bold text-gray-900">비밀번호를 변경해 주세요</p>
              <p className="mt-2 text-base text-gray-500">
                8자 이상, 영문·숫자·특수문자 중 2종류 이상 포함
              </p>
            </div>

            <div className="w-full space-y-3">
              <PasswordInput
                value={newPassword}
                onChange={setNewPassword}
                placeholder="새 비밀번호"
                autoComplete="new-password"
                autoFocus
              />
              <PasswordInput
                value={confirmPassword}
                onChange={setConfirmPassword}
                onEnter={handleChangePassword}
                placeholder="새 비밀번호 확인"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-lg font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleChangePassword}
              disabled={loading}
              className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md active:bg-blue-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "비밀번호 변경"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
