import type { Expense } from "./supabase/types";
import { formatAmount } from "./constants";
import type { Category, CategoryFilter } from "./constants";

/** 검색어로 지출 항목 필터 */
export function filterBySearch(expenses: Expense[], query: string): Expense[] {
  const q = query.trim().toLowerCase();
  if (!q) return expenses;

  return expenses.filter((e) => {
    const text = [
      e.category,
      e.created_by,
      e.memo ?? "",
      e.date,
      String(e.amount),
      formatAmount(e.amount),
    ]
      .join(" ")
      .toLowerCase();
    return text.includes(q);
  });
}

/** 카테고리 필터 */
export function filterByCategory(
  expenses: Expense[],
  category: CategoryFilter
): Expense[] {
  if (category === "전체") return expenses;
  return expenses.filter((e) => e.category === category);
}
