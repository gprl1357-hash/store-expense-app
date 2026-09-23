import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";
import { currentMonthRange, type StoreId } from "../constants";
import { handleJson } from "./http";

/** 기간별 활성 지출 목록 조회 (매장 필터) */
export async function fetchExpensesInRange(
  storeId: StoreId,
  start: string,
  end: string
): Promise<Expense[]> {
  const params = new URLSearchParams({ storeId, start, end });
  const res = await fetch(`/api/expenses?${params.toString()}`);
  return handleJson<Expense[]>(res);
}

/** 이번 달 활성 지출 목록 조회 */
export async function fetchMonthlyExpenses(
  storeId: StoreId
): Promise<Expense[]> {
  const { start, end } = currentMonthRange();
  return fetchExpensesInRange(storeId, start, end);
}

/** 휴지통(삭제된) 지출 목록 — 최근 90일 이내, 매장 필터 */
export async function fetchDeletedExpenses(
  storeId: StoreId
): Promise<Expense[]> {
  const params = new URLSearchParams({ storeId });
  const res = await fetch(`/api/expenses/deleted?${params.toString()}`);
  return handleJson<Expense[]>(res);
}

/** 지출 추가 */
export async function insertExpense(input: ExpenseInsert): Promise<Expense> {
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJson<Expense>(res);
}

/** 지출 수정 */
export async function updateExpense(
  id: string,
  input: ExpenseUpdate & { store_id: StoreId }
): Promise<Expense> {
  const res = await fetch(`/api/expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJson<Expense>(res);
}

/** 지출 삭제 (휴지통으로 이동) */
export async function deleteExpense(
  id: string,
  storeId: StoreId
): Promise<void> {
  const params = new URLSearchParams({ storeId });
  const res = await fetch(`/api/expenses/${id}?${params.toString()}`, {
    method: "DELETE",
  });
  await handleJson<{ ok: true }>(res);
}

/** 삭제된 지출 복원 */
export async function restoreExpense(
  id: string,
  storeId: StoreId
): Promise<Expense> {
  const res = await fetch(`/api/expenses/${id}/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ store_id: storeId }),
  });
  return handleJson<Expense>(res);
}
