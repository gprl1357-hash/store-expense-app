"use client";

import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { formatAmount } from "@/lib/constants";
import { useStore } from "@/lib/store-context";
import { useAuth } from "@/lib/auth/auth-context";
import { ChangePasswordSection } from "./ChangePasswordSection";

type SettingsPanelProps = {
  onSaved?: (message: string) => void;
};

export function SettingsPanel({ onSaved }: SettingsPanelProps) {
  const { storeId, store, users, monthlyBudget, budgetLoading, saveBudget } =
    useStore();
  const { logout } = useAuth();
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout(storeId);
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    setInput(monthlyBudget > 0 ? monthlyBudget.toLocaleString("ko-KR") : "");
  }, [monthlyBudget, store.id]);

  function handleChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = digits ? Number(digits) : 0;
    setInput(digits ? num.toLocaleString("ko-KR") : "");
  }

  async function handleSave() {
    setError("");
    const amount = Number(input.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setError("월 예산을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      await saveBudget(amount);
      onSaved?.("월 예산이 저장되었습니다 ✓");
    } catch (err) {
      console.error(err);
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <p className="text-lg text-gray-600">현재 매장</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{store.shortName}</p>
        <p className="mt-2 text-base text-gray-500">
          매장 ID: {store.loginId} · {store.title}
        </p>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <p className="mb-2 text-xl font-bold text-gray-900">월 예산</p>
        <p className="mb-4 text-base text-gray-500">
          이 매장의 이번 달 예산입니다. 언제든 바꿀 수 있습니다.
        </p>
        {budgetLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <>
            <input
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              className="min-h-[4.5rem] w-full rounded-2xl border-0 bg-gray-50 px-5 text-3xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
            />
            <p className="mt-2 text-lg text-gray-600">
              현재: {formatAmount(monthlyBudget)}
            </p>
            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-lg font-medium text-red-600">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-4 flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                "예산 저장"
              )}
            </button>
          </>
        )}
      </section>

      <ChangePasswordSection storeId={storeId} onSaved={onSaved} />

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <p className="mb-3 text-xl font-bold text-gray-900">작성자</p>
        <p className="mb-3 text-base text-gray-500">
          이 매장에서 선택할 수 있는 작성자입니다.
        </p>
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user}
              className="rounded-xl bg-gray-50 px-4 py-3 text-lg font-semibold text-gray-800"
            >
              {user}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
        <p className="mb-3 text-xl font-bold text-gray-900">{store.shortName} 로그아웃</p>
        <p className="mb-4 text-base text-gray-500">
          이 매장의 간편 로그인이 해제됩니다. 다음에 이 매장으로 전환하려면 비밀번호를 다시 입력해야 합니다.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-xl font-bold text-red-600 ring-2 ring-red-200 active:bg-red-50 disabled:opacity-60"
        >
          {loggingOut ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <LogOut className="h-5 w-5" />
              로그아웃
            </>
          )}
        </button>
      </section>
    </div>
  );
}
