export const CATEGORIES = [
  { value: "식자재", label: "식자재", emoji: "🥬" },
  { value: "공과금", label: "공과금", emoji: "⚡" },
  { value: "인건비", label: "인건비", emoji: "👤" },
  { value: "기타", label: "기타", emoji: "📦" },
] as const;

export const USERS = ["사용자A", "사용자B", "사용자C"] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export type User = (typeof USERS)[number];
export type UserFilter = "전체" | User;

export const MONTHLY_BUDGET = Number(
  process.env.NEXT_PUBLIC_MONTHLY_BUDGET ?? 3_000_000
);

export const AMOUNT_SHORTCUTS = [
  { label: "+1천원", value: 1_000 },
  { label: "+1만원", value: 10_000 },
  { label: "+5만원", value: 50_000 },
] as const;

/** 예산 사용률에 따른 신호등 색상 */
export function getBudgetColor(ratio: number): {
  bar: string;
  text: string;
  label: string;
} {
  if (ratio >= 0.85) {
    return { bar: "bg-red-500", text: "text-red-600", label: "위험" };
  }
  if (ratio >= 0.6) {
    return { bar: "bg-yellow-400", text: "text-yellow-600", label: "주의" };
  }
  return { bar: "bg-green-500", text: "text-green-600", label: "양호" };
}

/** 금액 포맷 (원) */
export function formatAmount(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 오늘 날짜 (YYYY-MM-DD) */
export function todayString(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 이번 달 첫날·마지막날 */
export function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1).toLocaleDateString("sv-SE");
  const end = new Date(year, month + 1, 0).toLocaleDateString("sv-SE");
  return { start, end };
}

/** 날짜 표시 (M월 D일) */
export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}
