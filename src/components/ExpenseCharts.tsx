"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAmount, type PeriodMode } from "@/lib/constants";
import {
  buildCategoryChartData,
  buildTimelineChartData,
  CATEGORY_COLORS,
} from "@/lib/chartData";
import type { Expense } from "@/lib/supabase/types";

type ExpenseChartsProps = {
  expenses: Expense[];
  timelineExpenses: Expense[];
  periodMode: PeriodMode;
  year: number;
  month: number;
  periodLabel: string;
};

const CHART_FONT = 14;

function formatAxisAmount(value: number) {
  if (value >= 10_000) return `${Math.round(value / 10_000)}만`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}천`;
  return String(value);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-gray-900 px-4 py-3 text-base text-white shadow-lg">
      {label && <p className="mb-1 font-bold">{label}</p>}
      <p>{formatAmount(payload[0].value)}</p>
    </div>
  );
}

export function ExpenseCharts({
  expenses,
  timelineExpenses,
  periodMode,
  year,
  month,
  periodLabel,
}: ExpenseChartsProps) {
  const categoryData = buildCategoryChartData(expenses);
  const timelineData = buildTimelineChartData(timelineExpenses, periodMode, year, month);
  const categoryTotal = categoryData.reduce((s, d) => s + d.value, 0);
  const showTimeline = periodMode !== "day" && timelineData.some((d) => d.amount > 0);

  if (categoryTotal === 0 && !showTimeline) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100">
        <p className="text-lg text-gray-400">표시할 그래프 데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div
      id="expense-chart-export"
      className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100"
      style={{ backgroundColor: "#ffffff", color: "#111827" }}
    >
      <div>
        <h2 className="text-lg font-bold text-gray-800">지출 그래프</h2>
        <p className="text-base text-gray-500">{periodLabel}</p>
      </div>

      {categoryData.length > 0 && (
        <div>
          <p className="mb-2 text-base font-semibold text-gray-700">카테고리별 비율</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={{ strokeWidth: 2 }}
              >
                {categoryData.map((entry) => (
                  <Cell key={entry.category} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: CHART_FONT, paddingTop: 8 }}
                formatter={(value) => <span className="text-base">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {showTimeline && (
        <div>
          <p className="mb-2 text-base font-semibold text-gray-700">
            {periodMode === "year" ? "월별 지출 추이" : "일별 지출 추이"}
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={timelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: CHART_FONT }}
                interval={periodMode === "month" ? "preserveStartEnd" : 0}
              />
              <YAxis tickFormatter={formatAxisAmount} tick={{ fontSize: CHART_FONT }} width={48} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="amount" name="지출" radius={[6, 6, 0, 0]}>
                {timelineData.map((_, i) => (
                  <Cell key={i} fill="#3b82f6" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {periodMode === "day" && categoryData.length > 0 && (
        <p className="text-center text-base text-gray-500">
          일별 추이는 월·연 단위에서 확인할 수 있습니다
        </p>
      )}
    </div>
  );
}
