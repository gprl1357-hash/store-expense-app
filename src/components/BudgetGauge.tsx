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
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-lg text-gray-500">이번 달 지출</p>
          <p className="text-3xl font-bold tracking-tight">
            {formatAmount(totalSpent)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg text-gray-500">월 예산</p>
          <p className="text-xl font-semibold text-gray-700">
            {formatAmount(MONTHLY_BUDGET)}
          </p>
        </div>
      </div>

      <div className="relative h-8 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${bar}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-lg">
        <span className={`font-bold ${text}`}>
          {label} · {percent}%
        </span>
        <span className="text-gray-500">
          남은 예산 {formatAmount(Math.max(MONTHLY_BUDGET - totalSpent, 0))}
        </span>
      </div>
    </section>
  );
}
