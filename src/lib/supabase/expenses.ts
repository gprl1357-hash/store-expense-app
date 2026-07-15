import { getSupabase } from "./client";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";
import { parseExpense } from "./types";
import { currentMonthRange } from "../constants";

/** 이번 달 지출 목록 조회 */
export async function fetchMonthlyExpenses(): Promise<Expense[]> {
  const supabase = getSupabase();
  const { start, end } = currentMonthRange();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
}

/** 지출 추가 */
export async function insertExpense(input: ExpenseInsert): Promise<Expense> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .insert(input)
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
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

/** 지출 삭제 */
export async function deleteExpense(id: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
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
