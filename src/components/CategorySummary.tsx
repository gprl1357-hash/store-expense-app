"use client";

import { CATEGORIES, formatAmount, type Category, type CategoryFilter } from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";

type CategorySummaryProps = {
  expenses: Expense[];
  title?: string;
  selectedCategory?: CategoryFilter;
  onCategorySelect?: (category: CategoryFilter) => void;
};

export function CategorySummary({
  expenses,
  title = "카테고리별 합계",
  selectedCategory = "전체",
  onCategorySelect,
}: CategorySummaryProps) {
  const totals = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  function handleClick(value: Category) {
    if (!onCategorySelect) return;
    onCategorySelect(selectedCategory === value ? "전체" : value);
  }

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <span className="text-base font-semibold text-blue-600">
          {formatAmount(grandTotal)}
        </span>
      </div>

      {onCategorySelect && (
        <p className="mb-3 text-sm text-gray-500">카드를 터치하면 해당 카테고리만 볼 수 있습니다</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {totals.map(({ value, label, emoji, total }) => {
          const ratio = grandTotal > 0 ? total / grandTotal : 0;
          const isSelected = selectedCategory === value;
          const className = `rounded-2xl p-4 text-left transition-all ${
            isSelected
              ? "bg-blue-600 ring-2 ring-blue-400"
              : total > 0
                ? "bg-blue-50 ring-1 ring-blue-100 active:bg-blue-100"
                : "bg-gray-50 ring-1 ring-gray-100"
          }`;

          const content = (
            <>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <span
                  className={`text-base font-bold ${isSelected ? "text-white" : "text-gray-800"}`}
                >
                  {label}
                </span>
              </div>
              <p
                className={`text-xl font-bold ${
                  isSelected ? "text-white" : total > 0 ? "text-blue-700" : "text-gray-300"
                }`}
              >
                {total > 0 ? formatAmount(total) : "-"}
              </p>
              {total > 0 && (
                <div
                  className={`mt-2 h-2 overflow-hidden rounded-full ${isSelected ? "bg-blue-500/50" : "bg-white/80"}`}
                >
                  <div
                    className={`h-full rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}
                    style={{ width: `${Math.round(ratio * 100)}%` }}
                  />
                </div>
              )}
            </>
          );

          if (onCategorySelect) {
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleClick(value)}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={value} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
