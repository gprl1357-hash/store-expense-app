import { getSupabase } from "./client";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";
import { parseExpense } from "./types";
import { currentMonthRange, type StoreId } from "../constants";

/** 기간별 활성 지출 목록 조회 (매장 필터) */
export async function fetchExpensesInRange(
  storeId: StoreId,
  start: string,
  end: string
): Promise<Expense[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
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
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("store_id", storeId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", since.toISOString())
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
}

/** 지출 추가 */
export async function insertExpense(input: ExpenseInsert): Promise<Expense> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .insert({ ...input, deleted_at: null })
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

/** 지출 수정 */
export async function updateExpense(
  id: string,
  input: ExpenseUpdate
): Promise<Expense> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .update(input)
    .eq("id", id)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

/** 지출 삭제 (휴지통으로 이동) */
export async function deleteExpense(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw error;
}

/** 삭제된 지출 복원 */
export async function restoreExpense(id: string): Promise<Expense> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .update({ deleted_at: null })
    .eq("id", id)
    .not("deleted_at", "is", null)
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

/** Realtime 구독 설정 (매장별 필터) */
export function subscribeExpenses(
  storeId: StoreId,
  onChange: () => void
) {
  const supabase = getSupabase();

  const channel = supabase
    .channel(`expenses-changes-${storeId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "expenses",
        filter: `store_id=eq.${storeId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
