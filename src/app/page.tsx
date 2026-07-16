"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnalyticsCalendar } from "@/components/AnalyticsCalendar";
import { BudgetGauge } from "@/components/BudgetGauge";
import { DayDetailModal } from "@/components/DayDetailModal";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseModal } from "@/components/ExpenseModal";
import { CategoryFilterBar } from "@/components/CategoryFilterBar";
import { CategorySummary } from "@/components/CategorySummary";
import { ExpenseSearchBar } from "@/components/ExpenseSearchBar";
import { ExpenseCharts } from "@/components/ExpenseCharts";
import { ExportButtons } from "@/components/ExportButtons";
import { TrashModal } from "@/components/TrashModal";
import { TabNav, type Tab } from "@/components/TabNav";
import { UserFilterBar } from "@/components/UserFilterBar";
import {
  APP_TITLE,
  formatAmount,
  monthRange,
  todayString,
  toDateString,
  yearRange,
  type PeriodMode,
  type CategoryFilter,
  type UserFilter,
} from "@/lib/constants";
import { filterByCategory, filterBySearch } from "@/lib/filterExpenses";
import {
  deleteExpense,
  fetchDeletedExpenses,
  fetchExpensesInRange,
  fetchMonthlyExpenses,
  insertExpense,
  restoreExpense,
  subscribeExpenses,
  updateExpense,
} from "@/lib/supabase/expenses";
import { resizeImageFile, uploadExpensePhoto } from "@/lib/supabase/storage";
import type { Expense } from "@/lib/supabase/types";
import { triggerSlackExpenseNotify } from "@/lib/slack/trigger-notify";
import { Loader2, RotateCcw } from "lucide-react";

function parseToday() {
  const [y, m, d] = todayString().split("-").map(Number);
  return { year: y, month: m, day: d };
}

function periodLabel(mode: PeriodMode, year: number, month: number, day: number): string {
  if (mode === "year") return `${year}년`;
  if (mode === "month") return `${year}년 ${month}월`;
  return `${year}년 ${month}월 ${day}일`;
}

export default function HomePage() {
  const today = parseToday();
  const [tab, setTab] = useState<Tab>("input");
  const [budgetExpenses, setBudgetExpenses] = useState<Expense[]>([]);
  const [periodExpenses, setPeriodExpenses] = useState<Expense[]>([]);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [userFilter, setUserFilter] = useState<UserFilter>("전체");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [toast, setToast] = useState("");

  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [day, setDay] = useState(today.day);

  const loadBudgetExpenses = useCallback(async () => {
    try {
      const data = await fetchMonthlyExpenses();
      setBudgetExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  const loadPeriodExpenses = useCallback(async () => {
    setPeriodLoading(true);
    try {
      const range =
        periodMode === "year" ? yearRange(year) : monthRange(year, month);
      const data = await fetchExpensesInRange(range.start, range.end);
      setPeriodExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPeriodLoading(false);
    }
  }, [periodMode, year, month]);

  useEffect(() => {
    loadBudgetExpenses();
    const unsubscribe = subscribeExpenses(() => {
      loadBudgetExpenses();
      if (tab === "browse") loadPeriodExpenses();
    });
    return unsubscribe;
  }, [loadBudgetExpenses, loadPeriodExpenses, tab]);

  useEffect(() => {
    if (tab === "browse") loadPeriodExpenses();
  }, [tab, loadPeriodExpenses]);

  const filteredBudget = useMemo(() => {
    if (userFilter === "전체") return budgetExpenses;
    return budgetExpenses.filter((e) => e.created_by === userFilter);
  }, [budgetExpenses, userFilter]);

  const filteredPeriod = useMemo(() => {
    if (userFilter === "전체") return periodExpenses;
    return periodExpenses.filter((e) => e.created_by === userFilter);
  }, [periodExpenses, userFilter]);

  const periodBaseList = useMemo(() => {
    if (periodMode === "day") {
      return filteredPeriod.filter((e) => e.date === toDateString(year, month, day));
    }
    return filteredPeriod;
  }, [filteredPeriod, periodMode, year, month, day]);

  const displayList = useMemo(() => {
    let list = filterByCategory(periodBaseList, categoryFilter);
    list = filterBySearch(list, searchQuery);
    return list;
  }, [periodBaseList, categoryFilter, searchQuery]);

  const budgetTotal = useMemo(
    () => filteredBudget.reduce((sum, e) => sum + e.amount, 0),
    [filteredBudget]
  );

  const periodTotal = useMemo(
    () => displayList.reduce((sum, e) => sum + e.amount, 0),
    [displayList]
  );

  const label = periodLabel(periodMode, year, month, day);
  const showExpenseList = periodMode !== "year";
  const hasActiveFilter = categoryFilter !== "전체" || searchQuery.trim() !== "";

  useEffect(() => {
    if (tab !== "browse") {
      setCategoryFilter("전체");
      setSearchQuery("");
    }
  }, [tab]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  }

  async function handleInsert(
    input: Parameters<typeof insertExpense>[0],
    photo?: File | null
  ) {
    const expense = await insertExpense(input);
    let finalId = expense.id;

    if (photo) {
      try {
        const resized = await resizeImageFile(photo);
        const photoUrl = await uploadExpensePhoto(expense.id, resized);
        await updateExpense(expense.id, { photo_url: photoUrl });
      } catch (err) {
        console.error(err);
        triggerSlackExpenseNotify(finalId);
        showToast("지출은 등록되었으나 사진 업로드에 실패했습니다");
        setTab("browse");
        loadBudgetExpenses();
        loadPeriodExpenses();
        return;
      }
    }

    triggerSlackExpenseNotify(finalId);
    showToast("지출이 등록되었습니다 ✓");
    setTab("browse");
    loadBudgetExpenses();
    loadPeriodExpenses();
  }

  async function handleUpdate(
    id: string,
    input: Parameters<typeof updateExpense>[1]
  ) {
    await updateExpense(id, input);
    showToast("수정되었습니다 ✓");
    loadBudgetExpenses();
    loadPeriodExpenses();
  }

  async function handleDelete(id: string) {
    await deleteExpense(id);
    showToast("휴지통으로 이동했습니다 (복원 가능)");
    setSelectedDayDate(null);
    loadBudgetExpenses();
    loadPeriodExpenses();
  }

  async function handleRestore(id: string) {
    await restoreExpense(id);
    showToast("복원되었습니다 ✓");
    loadBudgetExpenses();
    loadPeriodExpenses();
  }

  const loadDeleted = useCallback(() => fetchDeletedExpenses(), []);

  function handleDayClick(dateStr: string) {
    setSelectedDayDate(dateStr);
  }

  const isLoading = tab === "input" ? budgetLoading : periodLoading;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-gray-50 pb-28">
      <header className="sticky top-0 z-30 bg-gray-50/95 px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold leading-snug text-gray-900">{APP_TITLE}</h1>
            <p className="mt-1 text-xl text-gray-600">함께 기록하고 확인해요</p>
          </div>
          {tab === "browse" && (
            <button
              type="button"
              onClick={() => setShowTrash(true)}
              className="flex min-h-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-5 shadow-sm ring-2 ring-gray-200 active:bg-gray-50"
              aria-label="삭제 복원"
            >
              <RotateCcw className="h-7 w-7 text-blue-600" />
              <span className="text-base font-bold text-blue-600">복원</span>
            </button>
          )}
        </div>
      </header>

      <main className="space-y-5 px-5">
        {tab === "input" && <BudgetGauge totalSpent={budgetTotal} />}

        <UserFilterBar selected={userFilter} onChange={setUserFilter} />

        {userFilter !== "전체" && tab === "input" && (
          <p className="text-center text-lg text-gray-600">
            <span className="font-bold text-blue-600">{userFilter}</span> 이번 달{" "}
            <span className="font-bold">{formatAmount(budgetTotal)}</span>
          </p>
        )}

        {userFilter !== "전체" && tab === "browse" && !isLoading && (
          <p className="text-center text-lg text-gray-600">
            <span className="font-bold text-blue-600">{userFilter}</span> · {label}{" "}
            <span className="font-bold">{formatAmount(periodTotal)}</span>
          </p>
        )}

        {tab === "browse" && !isLoading && hasActiveFilter && (
          <p className="text-center text-base text-gray-500">
            필터 적용 · {displayList.length}건 · {formatAmount(periodTotal)}
          </p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : tab === "input" ? (
          <ExpenseForm onSubmit={handleInsert} />
        ) : (
          <>
            <AnalyticsCalendar
              mode={periodMode}
              year={year}
              month={month}
              day={day}
              expenses={filteredPeriod}
              onModeChange={setPeriodMode}
              onYearChange={setYear}
              onMonthChange={setMonth}
              onDaySelect={setDay}
              onDayClick={handleDayClick}
            />
            <CategoryFilterBar
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />
            <CategorySummary
              expenses={periodBaseList}
              title={`${label} 카테고리별`}
              selectedCategory={categoryFilter}
              onCategorySelect={setCategoryFilter}
            />
            <ExpenseCharts
              expenses={displayList.length > 0 && hasActiveFilter ? displayList : periodBaseList}
              timelineExpenses={filteredPeriod}
              periodMode={periodMode}
              year={year}
              month={month}
              periodLabel={label}
            />
            {showExpenseList && (
              <ExpenseSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={searchQuery.trim() ? displayList.length : undefined}
              />
            )}
            <ExportButtons expenses={displayList} label={label} />
            {showExpenseList ? (
              <ExpenseList
                expenses={displayList}
                onSelect={setSelectedExpense}
              />
            ) : (
              <p className="rounded-2xl bg-blue-50 px-5 py-4 text-center text-lg text-blue-700">
                월별 카드를 터치하면 해당 월의 상세 목록을 볼 수 있습니다
              </p>
            )}
          </>
        )}
      </main>

      <TabNav active={tab} onChange={setTab} />

      {selectedExpense && (
        <ExpenseModal
          expense={selectedExpense}
          onClose={() => setSelectedExpense(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {selectedDayDate && (
        <DayDetailModal
          date={selectedDayDate}
          expenses={filteredPeriod}
          onClose={() => setSelectedDayDate(null)}
          onSelectExpense={(e) => {
            setSelectedDayDate(null);
            setSelectedExpense(e);
          }}
        />
      )}

      {showTrash && (
        <TrashModal
          onClose={() => setShowTrash(false)}
          onRestore={handleRestore}
          fetchDeleted={loadDeleted}
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl bg-gray-900 px-6 py-5 text-center text-xl font-bold text-white shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
