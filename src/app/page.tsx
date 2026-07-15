"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BudgetGauge } from "@/components/BudgetGauge";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseModal } from "@/components/ExpenseModal";
import { TabNav, type Tab } from "@/components/TabNav";
import { UserFilterBar } from "@/components/UserFilterBar";
import {
  formatAmount,
  type UserFilter,
} from "@/lib/constants";
import {
  deleteExpense,
  fetchMonthlyExpenses,
  insertExpense,
  subscribeExpenses,
  updateExpense,
} from "@/lib/supabase/expenses";
import type { Expense } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("input");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<UserFilter>("전체");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [toast, setToast] = useState("");

  const loadExpenses = useCallback(async () => {
    try {
      const data = await fetchMonthlyExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
    const unsubscribe = subscribeExpenses(() => {
      loadExpenses();
    });
    return unsubscribe;
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    if (userFilter === "전체") return expenses;
    return expenses.filter((e) => e.created_by === userFilter);
  }, [expenses, userFilter]);

  const totalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  async function handleInsert(input: Parameters<typeof insertExpense>[0]) {
    await insertExpense(input);
    showToast("지출이 등록되었습니다 ✓");
    setTab("list");
  }

  async function handleUpdate(
    id: string,
    input: Parameters<typeof updateExpense>[1]
  ) {
    await updateExpense(id, input);
    showToast("수정되었습니다 ✓");
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
    showToast("삭제되었습니다");
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50 pb-24">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-gray-50/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <h1 className="text-2xl font-bold text-gray-900">매장 지출 관리</h1>
        <p className="mt-1 text-lg text-gray-500">함께 기록하고 확인해요</p>
      </header>

      <main className="space-y-5 px-5">
        {/* 예산 게이지 + 필터 (내역 탭에서 항상 표시, 입력 탭에서도 상단 요약) */}
        <BudgetGauge totalSpent={totalSpent} />

        <UserFilterBar selected={userFilter} onChange={setUserFilter} />

        {userFilter !== "전체" && (
          <p className="text-center text-lg text-gray-600">
            <span className="font-bold text-blue-600">{userFilter}</span> 합계{" "}
            <span className="font-bold">{formatAmount(totalSpent)}</span>
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : tab === "input" ? (
          <ExpenseForm onSubmit={handleInsert} />
        ) : (
          <ExpenseList
            expenses={filteredExpenses}
            onSelect={setSelectedExpense}
          />
        )}
      </main>

      <TabNav active={tab} onChange={setTab} />

      {/* 수정/삭제 모달 */}
      {selectedExpense && (
        <ExpenseModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-4 text-lg font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
