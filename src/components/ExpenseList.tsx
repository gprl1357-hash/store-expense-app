"use client";

import { CATEGORIES, formatAmount, formatDate } from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";
import { ChevronRight, ImageIcon } from "lucide-react";

type ExpenseListProps = {
  expenses: Expense[];
  onSelect: (expense: Expense) => void;
};

function getCategoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.emoji ?? "📦";
}

export function ExpenseList({ expenses, onSelect }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-xl text-gray-400">아직 지출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <button
            type="button"
            onClick={() => onSelect(expense)}
            className="flex min-h-[5.5rem] w-full items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-2 ring-gray-100 active:bg-gray-50"
          >
            <span className="text-4xl">{getCategoryEmoji(expense.category)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {expense.category}
                </span>
                <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-lg font-semibold text-gray-700">
                  {expense.created_by}
                </span>
              </div>
              <p className="truncate text-lg text-gray-600">
                {formatDate(expense.date)}
                {expense.memo ? ` · ${expense.memo}` : ""}
                {expense.photo_url ? (
                  <span className="ml-1 inline-flex items-center text-blue-500">
                    <ImageIcon className="inline h-4 w-4" aria-hidden />
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-gray-900">
                {formatAmount(expense.amount)}
              </span>
              <ChevronRight className="h-7 w-7 text-gray-400" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
