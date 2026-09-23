"use client";

import { useState } from "react";
import { KeyRound, Loader2, Lock, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import { STORES, type StoreConfig, type StoreId } from "@/lib/constants";
import { PasswordInput } from "./PasswordInput";

const GENERIC_LOGIN_ERROR = "매장 ID 또는 비밀번호가 올바르지 않습니다.";

type StoreLoginModalProps = {
  /** 이미 선택된 매장(스위처로 전환한 경우). null이면 매장 ID를 직접 입력받는다. */
  store: StoreConfig | null;
  /** 로그인/비밀번호 변경 성공 시 어떤 매장인지 알려줌 (매장 ID 직접 입력 모드에서 필요) */
  onResolvedStore?: (id: StoreId) => void;
  /** 있으면 닫기 버튼 표시 (이미 다른 매장에 로그인된 상태에서 "매장 추가" 시 취소 가능하게) */
  onCancel?: () => void;
};

export function StoreLoginModal({ store, onResolvedStore, onCancel }: StoreLoginModalProps) {
  const { login, changePassword } = useAuth();
  const [step, setStep] = useState<"identify" | "password" | "change">(
    store ? "password" : "identify"
  );
  const [resolvedStore, setResolvedStore] = useState<StoreConfig | null>(store);
  const [loginIdInput, setLoginIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeStore = store ?? resolvedStore;

  function handleIdentify() {
    setError("");
    const found = STORES.find((s) => s.loginId === loginIdInput.trim());
    if (!found) {
      setError(GENERIC_LOGIN_ERROR);
      return;
    }
    setResolvedStore(found);
    setStep("password");
  }

  async function handleLogin() {
    if (!activeStore) return;
    setError("");
    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const { requireChange } = await login(activeStore.id, password);
      if (requireChange) {
        setStep("change");
      } else {
        onResolvedStore?.(activeStore.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_LOGIN_ERROR);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!activeStore) return;
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
      await changePassword(activeStore.id, password, newPassword);
      onResolvedStore?.(activeStore.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-md rounded-3xl bg-white p-7 shadow-lg ring-1 ring-gray-100">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          {step === "change" ? (
            <KeyRound className="h-9 w-9 text-blue-600" />
          ) : (
            <Lock className="h-9 w-9 text-blue-600" />
          )}
        </div>

        {step === "identify" && (
          <>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">매장 로그인</p>
              <p className="mt-2 text-base text-gray-500">매장 ID를 입력해 주세요</p>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={loginIdInput}
              onChange={(e) => setLoginIdInput(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
              placeholder="매장 ID (4자리)"
              className="min-h-16 w-full rounded-2xl border-0 bg-gray-50 px-5 text-center text-2xl font-bold tracking-widest text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
            />

            {error && (
              <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-lg font-medium text-red-600">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleIdentify}
              className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-md active:bg-blue-700"
            >
              다음
            </button>
          </>
        )}

        {step === "password" && activeStore && (
          <>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{activeStore.shortName}</p>
              <p className="mt-2 inline-block rounded-full bg-gray-100 px-4 py-1 text-base font-semibold text-gray-500">
                매장 ID {activeStore.loginId}
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
        )}

        {step === "change" && (
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
