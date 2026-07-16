"use client";

import { useState } from "react";
import { Download, Loader2, Printer } from "lucide-react";
import { exportExpensesToExcel, printExpenses } from "@/lib/exportExcel";
import type { Expense } from "@/lib/supabase/types";

type ExportButtonsProps = {
  expenses: Expense[];
  label?: string;
};

export function ExportButtons({ expenses, label = "현재 목록" }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  async function handleExcelExport() {
    setExporting(true);
    try {
      const hasChart = await exportExpensesToExcel(expenses);
      if (!hasChart) {
        alert(
          "엑셀 저장은 완료되었습니다.\n(그래프 시트는 포함되지 않았습니다. 조회 탭에서 그래프가 보이는 상태에서 다시 시도해 주세요.)"
        );
      }
    } catch (err) {
      console.error(err);
      alert("엑셀 저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="mb-3 text-xl font-semibold text-gray-700">
        {label} · {expenses.length}건
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleExcelExport}
          disabled={exporting}
          className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-2xl bg-green-600 text-xl font-bold text-white active:bg-green-700 disabled:opacity-60"
        >
          {exporting ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Download className="h-7 w-7" />
          )}
          {exporting ? "저장 중..." : "엑셀 저장"}
        </button>
        <button
          type="button"
          onClick={() => printExpenses(expenses)}
          className="flex min-h-[4.5rem] items-center justify-center gap-2 rounded-2xl bg-gray-700 text-xl font-bold text-white active:bg-gray-800"
        >
          <Printer className="h-7 w-7" />
          인쇄하기
        </button>
      </div>
      <p className="mt-3 text-base text-gray-600">
        엑셀: 지출내역 + 카테고리합계 + 그래프 시트 포함
      </p>
    </div>
  );
}
