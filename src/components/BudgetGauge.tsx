"use client";

import {
  MONTHLY_BUDGET,
  formatAmount,
  getBudgetColor,
} from "@/lib/constants";

type BudgetGaugeProps = {
  totalSpent: number;
};

export function BudgetGauge({ totalSpent }: BudgetGaugeProps) {
  const ratio = Math.min(totalSpent / MONTHLY_BUDGET, 1);
  const percent = Math.round(ratio * 100);
  const { bar, text, label } = getBudgetColor(ratio);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-2 ring-gray-100">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xl text-gray-600">이번 달 지출</p>
          <p className="text-4xl font-bold tracking-tight text-gray-900">
            {formatAmount(totalSpent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl text-gray-600">월 예산</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatAmount(MONTHLY_BUDGET)}
          </p>
        </div>
      </div>

      <div className="relative h-10 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-1 text-xl sm:flex-row sm:items-center sm:justify-between">
        <span className={`font-bold ${text}`}>
          {label} · {percent}%
        </span>
        <span className="font-semibold text-gray-700">
          남은 예산 {formatAmount(Math.max(MONTHLY_BUDGET - totalSpent, 0))}
        </span>
      </div>
    </section>
  );
}
