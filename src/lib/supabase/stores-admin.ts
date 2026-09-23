import { createSupabaseAdmin } from "./admin";
import type { StoreId } from "../constants";
import type { StoreRow } from "./stores";

export type { StoreRow };

function parseStore(row: {
  id: string;
  name: string;
  monthly_budget: number | string;
  updated_at: string;
}): StoreRow {
  return {
    id: row.id,
    name: row.name,
    monthly_budget: Number(row.monthly_budget),
    updated_at: row.updated_at,
  };
}

/** 서버 전용 — API Route에서만 사용 (세션 검증 이후 호출) */

export async function fetchStoreAdmin(storeId: StoreId): Promise<StoreRow | null> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("stores")
    .select("id, name, monthly_budget, updated_at")
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw error;
  return data ? parseStore(data) : null;
}

export async function updateStoreBudgetAdmin(
  storeId: StoreId,
  monthlyBudget: number
): Promise<StoreRow> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("stores")
    .update({
      monthly_budget: monthlyBudget,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select("id, name, monthly_budget, updated_at")
    .single();

  if (error) throw error;
  return parseStore(data);
}
