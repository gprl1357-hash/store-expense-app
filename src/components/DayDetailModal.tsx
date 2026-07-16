"use client";

import { useEffect } from "react";
import { ImageIcon, X } from "lucide-react";
import { formatAmount, formatDate } from "@/lib/constants";
import { CATEGORIES } from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";

type DayDetailModalProps = {
  date: string;
  expenses: Expense[];
  onClose: () => void;
  onSelectExpense: (expense: Expense) => void;
};

function getCategoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.emoji ?? "📦";
}

export function DayDetailModal({
  date,
  expenses,
  onClose,
  onSelectExpense,
}: DayDetailModalProps) {
  const dayExpenses = expenses.filter((e) => e.date === date);
  const total = dayExpenses.reduce((s, e) => s + e.amount, 0);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
            <p className="text-xl font-semibold text-blue-600">
              {formatAmount(total)} · {dayExpenses.length}건
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {dayExpenses.length === 0 ? (
          <p className="py-12 text-center text-xl text-gray-400">
            이 날짜에 지출 내역이 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {dayExpenses.map((expense) => (
              <li key={expense.id}>
                <button
                  type="button"
                  onClick={() => onSelectExpense(expense)}
                  className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-gray-50 px-4 py-4 text-left active:bg-gray-100"
                >
                  <span className="text-3xl">{getCategoryEmoji(expense.category)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold">{expense.category}</p>
                    <p className="text-base text-gray-500">
                      {expense.created_by}
                      {expense.memo ? ` · ${expense.memo}` : ""}
                      {expense.photo_url ? (
                        <ImageIcon className="ml-1 inline h-4 w-4 text-blue-500" aria-label="사진 있음" />
                      ) : null}
                    </p>
                  </div>
                  <span className="text-lg font-bold">{formatAmount(expense.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
