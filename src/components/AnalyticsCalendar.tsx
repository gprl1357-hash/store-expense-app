"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatAmount,
  formatAmountShort,
  getCalendarGrid,
  toDateString,
  WEEKDAYS,
  type PeriodMode,
} from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";

type AnalyticsCalendarProps = {
  mode: PeriodMode;
  year: number;
  month: number;
  day: number;
  expenses: Expense[];
  onModeChange: (mode: PeriodMode) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  onDaySelect: (day: number) => void;
  onDayClick: (dateStr: string) => void;
};

function sumByDate(expenses: Expense[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    map.set(e.date, (map.get(e.date) ?? 0) + e.amount);
  }
  return map;
}

function sumByMonth(expenses: Expense[], year: number): Map<number, number> {
  const map = new Map<number, number>();
  for (const e of expenses) {
    const [y, m] = e.date.split("-").map(Number);
    if (y === year) map.set(m, (map.get(m) ?? 0) + e.amount);
  }
  return map;
}

const MODES: { value: PeriodMode; label: string }[] = [
  { value: "year", label: "연" },
  { value: "month", label: "월" },
  { value: "day", label: "일" },
];

export function AnalyticsCalendar({
  mode,
  year,
  month,
  day,
  expenses,
  onModeChange,
  onYearChange,
  onMonthChange,
  onDaySelect,
  onDayClick,
}: AnalyticsCalendarProps) {
  const dailyTotals = sumByDate(expenses);
  const monthlyTotals = sumByMonth(expenses, year);

  const periodTotal =
    mode === "day"
      ? (dailyTotals.get(toDateString(year, month, day)) ?? 0)
      : expenses.reduce((s, e) => s + e.amount, 0);

  function navigate(delta: number) {
    if (mode === "year") {
      onYearChange(year + delta);
    } else if (mode === "month") {
      let m = month + delta;
      let y = year;
      if (m > 12) {
        m = 1;
        y++;
      } else if (m < 1) {
        m = 12;
        y--;
      }
      onYearChange(y);
      onMonthChange(m);
    } else {
      const d = new Date(year, month - 1, day + delta);
      onYearChange(d.getFullYear());
      onMonthChange(d.getMonth() + 1);
      onDaySelect(d.getDate());
    }
  }

  const navLabel =
    mode === "year"
      ? `${year}년`
      : mode === "month"
        ? `${year}년 ${month}월`
        : `${year}년 ${month}월 ${day}일`;

  return (
    <div className="space-y-4">
      {/* 연/월/일 전환 */}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onModeChange(m.value)}
            className={`min-h-16 rounded-2xl text-xl font-bold transition-colors ${
              mode === m.value
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                : "bg-white text-gray-800 ring-2 ring-gray-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 기간 네비게이션 */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-2 py-2 shadow-sm ring-1 ring-gray-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-16 w-16 items-center justify-center rounded-xl active:bg-gray-100"
          aria-label="이전"
        >
          <ChevronLeft className="h-9 w-9 text-gray-700" />
        </button>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{navLabel}</p>
          <p className="text-xl font-bold text-blue-600">{formatAmount(periodTotal)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(1)}
          className="flex h-16 w-16 items-center justify-center rounded-xl active:bg-gray-100"
          aria-label="다음"
        >
          <ChevronRight className="h-9 w-9 text-gray-700" />
        </button>
      </div>

      {/* 연 단위: 12개월 요약 */}
      {mode === "year" && (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const total = monthlyTotals.get(m) ?? 0;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onMonthChange(m);
                  onModeChange("month");
                }}
                className={`flex min-h-24 flex-col items-center justify-center rounded-2xl transition-colors ${
                  total > 0
                    ? "bg-blue-50 ring-2 ring-blue-300 active:bg-blue-100"
                    : "bg-white ring-2 ring-gray-200 active:bg-gray-50"
                }`}
              >
                <span className="text-xl font-bold text-gray-900">{m}월</span>
                <span
                  className={`text-lg font-bold ${total > 0 ? "text-blue-700" : "text-gray-400"}`}
                >
                  {total > 0 ? formatAmountShort(total) : "-"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 월 단위: 달력 */}
      {mode === "month" && (
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((wd, i) => (
              <div
                key={wd}
                className={`py-2 text-center text-base font-bold ${
                  i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
                }`}
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getCalendarGrid(year, month).map((d, idx) => {
              if (d === null) {
                return <div key={`empty-${idx}`} className="min-h-[5.5rem]" />;
              }
              const dateStr = toDateString(year, month, d);
              const total = dailyTotals.get(dateStr) ?? 0;
              const isToday =
                dateStr ===
                new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => total > 0 && onDayClick(dateStr)}
                  disabled={total === 0}
                  className={`flex min-h-[5.5rem] flex-col items-center justify-center rounded-xl p-1 transition-colors ${
                    total > 0
                      ? "bg-blue-50 ring-2 ring-blue-200 active:bg-blue-100"
                      : "bg-gray-100"
                  } ${isToday ? "ring-2 ring-blue-600" : ""}`}
                >
                  <span
                    className={`text-xl font-bold ${isToday ? "text-blue-600" : "text-gray-900"}`}
                  >
                    {d}
                  </span>
                  {total > 0 && (
                    <span className="mt-0.5 text-sm font-bold leading-tight text-blue-800">
                      {formatAmountShort(total)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 일 단위: 해당일 요약 */}
      {mode === "day" && (
        <button
          type="button"
          onClick={() => {
            const dateStr = toDateString(year, month, day);
            const total = dailyTotals.get(dateStr) ?? 0;
            if (total > 0) onDayClick(dateStr);
          }}
          className="flex min-h-32 w-full flex-col items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 active:bg-gray-50"
        >
          <p className="text-xl text-gray-600">이날 지출 합계</p>
          <p className="mt-2 text-4xl font-bold text-blue-600">
            {formatAmount(dailyTotals.get(toDateString(year, month, day)) ?? 0)}
          </p>
          {(dailyTotals.get(toDateString(year, month, day)) ?? 0) > 0 && (
            <p className="mt-3 text-lg font-semibold text-blue-600">터치하여 내역 보기 →</p>
          )}
        </button>
      )}
    </div>
  );
}
