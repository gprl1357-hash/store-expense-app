import { CATEGORIES, type Category, type PeriodMode } from "./constants";
import type { Expense } from "./supabase/types";

export const CATEGORY_COLORS: Record<Category, string> = {
  식자재: "#22c55e",
  공과금: "#eab308",
  인건비: "#3b82f6",
  기타: "#94a3b8",
};

export type CategoryChartItem = {
  name: string;
  value: number;
  category: Category;
  fill: string;
};

export type TimelineChartItem = {
  label: string;
  amount: number;
};

/** 카테고리별 파이/도넛 차트 데이터 */
export function buildCategoryChartData(expenses: Expense[]): CategoryChartItem[] {
  return CATEGORIES.map(({ value, label }) => ({
    name: label,
    category: value,
    value: expenses.filter((e) => e.category === value).reduce((s, e) => s + e.amount, 0),
    fill: CATEGORY_COLORS[value],
  })).filter((d) => d.value > 0);
}

/** 기간별 막대 차트 데이터 */
export function buildTimelineChartData(
  expenses: Expense[],
  mode: PeriodMode,
  year: number,
  month: number
): TimelineChartItem[] {
  if (mode === "year") {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const prefix = `${year}-${String(m).padStart(2, "0")}`;
      const amount = expenses
        .filter((e) => e.date.startsWith(prefix))
        .reduce((s, e) => s + e.amount, 0);
      return { label: `${m}월`, amount };
    });
  }

  if (mode === "month") {
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const amount = expenses
        .filter((e) => e.date === dateStr)
        .reduce((s, e) => s + e.amount, 0);
      return { label: `${d}일`, amount };
    }).filter((item) => item.amount > 0);
  }

  return [];
}

/** 카테고리별 합계 (엑셀·표용) */
export function buildCategorySummary(expenses: Expense[]) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return CATEGORIES.map(({ value, label }) => {
    const items = expenses.filter((e) => e.category === value);
    const amount = items.reduce((s, e) => s + e.amount, 0);
    return {
      label,
      count: items.length,
      amount,
      ratio: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
    };
  });
}
