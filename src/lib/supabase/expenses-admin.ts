import { createSupabaseAdmin } from "./admin";
import type { Expense, ExpenseInsert, ExpenseUpdate } from "./types";
import { parseExpense } from "./types";
import type { StoreId } from "../constants";

/** 서버 전용 — API Route에서만 사용 (세션 검증 이후 호출) */

export async function fetchExpensesInRangeAdmin(
  storeId: StoreId,
  start: string,
  end: string
): Promise<Expense[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
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

export async function fetchDeletedExpensesAdmin(
  storeId: StoreId
): Promise<Expense[]> {
  const admin = createSupabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const { data, error } = await admin
    .from("expenses")
    .select("*")
    .eq("store_id", storeId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", since.toISOString())
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
}

export async function insertExpenseAdmin(
  input: ExpenseInsert
): Promise<Expense> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("expenses")
    .insert({ ...input, deleted_at: null })
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

export async function updateExpenseAdmin(
  id: string,
  storeId: StoreId,
  input: ExpenseUpdate
): Promise<Expense> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("expenses")
    .update(input)
    .eq("id", id)
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}

export async function deleteExpenseAdmin(
  id: string,
  storeId: StoreId
): Promise<void> {
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("expenses")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("store_id", storeId)
    .is("deleted_at", null);

  if (error) throw error;
}

export async function restoreExpenseAdmin(
  id: string,
  storeId: StoreId
): Promise<Expense> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("expenses")
    .update({ deleted_at: null })
    .eq("id", id)
    .eq("store_id", storeId)
    .not("deleted_at", "is", null)
    .select()
    .single();

  if (error) throw error;
  return parseExpense(data);
}
