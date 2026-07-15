"use client";

import { CATEGORIES, formatAmount, formatDate } from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";
import { ChevronRight } from "lucide-react";

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
            className="flex min-h-20 w-full items-center gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-gray-100 active:bg-gray-50"
          >
            <span className="text-4xl">{getCategoryEmoji(expense.category)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-800">
                  {expense.category}
                </span>
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-base text-gray-600">
                  {expense.created_by}
                </span>
              </div>
              <p className="truncate text-base text-gray-500">
                {formatDate(expense.date)}
                {expense.memo ? ` · ${expense.memo}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-gray-900">
                {formatAmount(expense.amount)}
              </span>
              <ChevronRight className="h-6 w-6 text-gray-300" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
