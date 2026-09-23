"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { validatePasswordRules } from "@/lib/auth/password-rules";
import type { StoreId } from "@/lib/constants";
import { PasswordInput } from "./PasswordInput";

type ChangePasswordSectionProps = {
  storeId: StoreId;
  onSaved?: (message: string) => void;
};

export function ChangePasswordSection({
  storeId,
  onSaved,
}: ChangePasswordSectionProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (!currentPassword) {
      setError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    const validation = validatePasswordRules(newPassword);
    if (!validation.valid) {
      setError(validation.reason);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(storeId, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSaved?.("비밀번호가 변경되었습니다 ✓");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="mb-2 text-xl font-bold text-gray-900">비밀번호 변경</p>
      <p className="mb-4 text-base text-gray-500">
        8자 이상, 영문·숫자·특수문자 중 2종류 이상 포함해야 합니다.
      </p>
      <div className="space-y-3">
        <PasswordInput
          value={currentPassword}
          onChange={setCurrentPassword}
          placeholder="현재 비밀번호"
          autoComplete="current-password"
        />
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          placeholder="새 비밀번호"
          autoComplete="new-password"
        />
        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          onEnter={handleSubmit}
          placeholder="새 비밀번호 확인"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-lg font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving}
        className="mt-4 flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "비밀번호 변경"}
      </button>

      <p className="mt-3 text-center text-base text-gray-400">
        비밀번호를 잊으셨다면 관리자에게 문의하세요.
      </p>
    </section>
  );
}
