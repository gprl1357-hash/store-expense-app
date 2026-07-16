import { getSupabase } from "./client";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";
import { parseExpense } from "./types";
import { currentMonthRange } from "../constants";

/** 기간별 활성 지출 목록 조회 */
export async function fetchExpensesInRange(
  start: string,
  end: string
): Promise<Expense[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .is("deleted_at", null)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
}

/** 이번 달 활성 지출 목록 조회 */
export async function fetchMonthlyExpenses(): Promise<Expense[]> {
  const { start, end } = currentMonthRange();
  return fetchExpensesInRange(start, end);
}

/** 휴지통(삭제된) 지출 목록 — 최근 90일 이내 */
export async function fetchDeletedExpenses(): Promise<Expense[]> {
  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
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

/** Realtime 구독 설정 */
export function subscribeExpenses(onChange: () => void) {
  const supabase = getSupabase();

  const channel = supabase
    .channel("expenses-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses" },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
