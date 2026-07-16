export const APP_TITLE = "제주은희네해장국광명GIDC 매장 지출 관리";
export const APP_TITLE_SHORT = "은희네 지출관리";

export const CATEGORIES = [
  { value: "식자재", label: "식자재", emoji: "🥬" },
  { value: "공과금", label: "공과금", emoji: "⚡" },
  { value: "인건비", label: "인건비", emoji: "👤" },
  { value: "기타", label: "기타", emoji: "📦" },
] as const;

export const USERS = ["홍혜기", "홍성미", "손선애"] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export type User = (typeof USERS)[number];
export type UserFilter = "전체" | User;
export type CategoryFilter = "전체" | Category;

export const MONTHLY_BUDGET = Number(
  process.env.NEXT_PUBLIC_MONTHLY_BUDGET ?? 10_000_000
);

export const AMOUNT_SHORTCUTS = [
  { label: "+1천", value: 1_000 },
  { label: "+1만", value: 10_000 },
  { label: "+5만", value: 50_000 },
  { label: "+10만", value: 100_000 },
  { label: "+100만", value: 1_000_000 },
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
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

const KST = "Asia/Seoul";

/** ISO 시각 → KST 24시간 (YYYY-MM-DD HH:mm:ss) */
export function formatDateTime24KST(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const date = d.toLocaleDateString("sv-SE", { timeZone: KST });
  const time = d.toLocaleTimeString("sv-SE", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

/** YYYY-MM-DD 포맷 */
export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** 날짜 문자열에 일수 더하기 (음수 가능) */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateString(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/** 특정 연·월의 시작·끝 */
export function monthRange(
  year: number,
  month: number
): { start: string; end: string } {
  const start = toDateString(year, month, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const end = toDateString(year, month, lastDay);
  return { start, end };
}

/** 특정 연도의 시작·끝 */
export function yearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** 달력 그리드용 (앞뒤 빈칸 포함, month: 1-12) */
export function getCalendarGrid(
  year: number,
  month: number
): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** 금액 축약 (달력 셀용) */
export function formatAmountShort(amount: number): string {
  if (amount === 0) return "";
  if (amount >= 10_000) {
    const man = amount / 10_000;
    return man % 1 === 0 ? `${man}만` : `${man.toFixed(1)}만`;
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}천`;
  return `${amount}`;
}

export type PeriodMode = "year" | "month" | "day";

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;
