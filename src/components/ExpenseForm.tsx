"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  AMOUNT_SHORTCUTS,
  CATEGORIES,
  USERS,
  todayString,
  type Category,
  type User,
} from "@/lib/constants";
import type { ExpenseInsert } from "@/lib/supabase/types";

type ExpenseFormProps = {
  onSubmit: (input: ExpenseInsert) => Promise<void>;
};

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState(0);
  const [amountInput, setAmountInput] = useState("");
  const [createdBy, setCreatedBy] = useState<User | null>(null);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const date = todayString();

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = digits ? Number(digits) : 0;
    setAmount(num);
    setAmountInput(digits ? num.toLocaleString("ko-KR") : "");
  }

  function addAmount(value: number) {
    const next = amount + value;
    setAmount(next);
    setAmountInput(next.toLocaleString("ko-KR"));
  }

  function resetAmount() {
    setAmount(0);
    setAmountInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("카테고리를 선택해 주세요.");
      return;
    }
    if (amount <= 0) {
      setError("금액을 입력해 주세요.");
      return;
    }
    if (!createdBy) {
      setError("작성자를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        date,
        category,
        amount,
        memo: memo.trim() || null,
        created_by: createdBy,
      });
      setCategory(null);
      resetAmount();
      setMemo("");
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 날짜 (자동) */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-gray-700">
          날짜
        </label>
        <div className="flex min-h-14 items-center rounded-2xl bg-gray-50 px-5 text-xl text-gray-600 ring-1 ring-gray-200">
          오늘 · {date.replace(/-/g, ".")}
        </div>
      </div>

      {/* 작성자 선택 */}
      <div>
        <label className="mb-3 block text-lg font-semibold text-gray-700">
          작성자
        </label>
        <div className="grid grid-cols-3 gap-3">
          {USERS.map((user) => (
            <button
              key={user}
              type="button"
              onClick={() => setCreatedBy(user)}
              className={`min-h-16 rounded-2xl text-lg font-bold transition-all ${
                createdBy === user
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 ring-2 ring-gray-200"
              }`}
            >
              {user}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 카드 */}
      <div>
        <label className="mb-3 block text-lg font-semibold text-gray-700">
          카테고리
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl text-lg font-bold transition-all ${
                category === cat.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-800 ring-2 ring-gray-200"
              }`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 금액 입력 */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-gray-700">
          금액
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={amountInput}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          className="min-h-16 w-full rounded-2xl border-0 bg-white px-5 text-3xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
        />
        <div className="mt-3 grid grid-cols-4 gap-2">
          {AMOUNT_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => addAmount(shortcut.value)}
              className="min-h-14 rounded-xl bg-blue-50 text-lg font-bold text-blue-700 ring-1 ring-blue-200 active:bg-blue-100"
            >
              {shortcut.label}
            </button>
          ))}
          <button
            type="button"
            onClick={resetAmount}
            className="min-h-14 rounded-xl bg-gray-100 text-lg font-bold text-gray-600 ring-1 ring-gray-200 active:bg-gray-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="mb-2 block text-lg font-semibold text-gray-700">
          메모 <span className="font-normal text-gray-400">(선택)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모"
          className="min-h-14 w-full rounded-2xl border-0 bg-white px-5 text-xl ring-2 ring-gray-200 focus:ring-blue-500"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-lg font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-xl font-bold text-white shadow-lg active:bg-blue-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Plus className="h-6 w-6" />
            지출 등록
          </>
        )}
      </button>
    </form>
  );
}
