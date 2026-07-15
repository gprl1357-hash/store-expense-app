"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import {
  AMOUNT_SHORTCUTS,
  CATEGORIES,
  USERS,
  type Category,
  type User,
} from "@/lib/constants";
import type { Expense, ExpenseUpdate } from "@/lib/supabase/types";

type ExpenseModalProps = {
  expense: Expense;
  onClose: () => void;
  onUpdate: (id: string, input: ExpenseUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function ExpenseModal({
  expense,
  onClose,
  onUpdate,
  onDelete,
}: ExpenseModalProps) {
  const [category, setCategory] = useState<Category>(expense.category);
  const [amount, setAmount] = useState(expense.amount);
  const [amountInput, setAmountInput] = useState(
    expense.amount.toLocaleString("ko-KR")
  );
  const [createdBy, setCreatedBy] = useState<User>(expense.created_by);
  const [memo, setMemo] = useState(expense.memo ?? "");
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  async function handleSave() {
    if (amount <= 0) return;
    setLoading(true);
    try {
      await onUpdate(expense.id, {
        category,
        amount,
        memo: memo.trim() || null,
        created_by: createdBy,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setLoading(true);
    try {
      await onDelete(expense.id);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">지출 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">날짜</p>
            <p className="min-h-14 rounded-2xl bg-gray-50 px-5 py-4 text-xl text-gray-600">
              {expense.date.replace(/-/g, ".")}
            </p>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">작성자</p>
            <div className="grid grid-cols-3 gap-2">
              {USERS.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => setCreatedBy(user)}
                  className={`min-h-14 rounded-xl text-lg font-bold ${
                    createdBy === user
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">카테고리</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-base font-bold ${
                    category === cat.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">금액</p>
            <input
              type="text"
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="min-h-14 w-full rounded-2xl px-5 text-2xl font-bold ring-2 ring-gray-200"
            />
            <div className="mt-2 grid grid-cols-4 gap-2">
              {AMOUNT_SHORTCUTS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => addAmount(s.value)}
                  className="min-h-12 rounded-lg bg-blue-50 text-base font-bold text-blue-700"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAmount(0);
                  setAmountInput("");
                }}
                className="min-h-12 rounded-lg bg-gray-100 text-base font-bold text-gray-600"
              >
                초기화
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-lg font-semibold text-gray-700">메모</p>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-14 w-full rounded-2xl px-5 text-xl ring-2 ring-gray-200"
            />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || amount <= 0}
            className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "저장하기"}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 text-xl font-bold text-white disabled:opacity-60"
          >
            <Trash2 className="h-6 w-6" />
            {confirmDelete ? "정말 삭제할까요? (한 번 더 누르세요)" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
