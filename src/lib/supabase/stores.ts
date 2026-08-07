import { getSupabase } from "./client";
import type { StoreId } from "../constants";

export type StoreRow = {
  id: string;
  name: string;
  monthly_budget: number;
  updated_at: string;
};

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

export async function fetchStore(storeId: StoreId): Promise<StoreRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .eq("id", storeId)
    .maybeSingle();

  if (error) throw error;
  return data ? parseStore(data) : null;
}

export async function updateStoreBudget(
  storeId: StoreId,
  monthlyBudget: number
): Promise<StoreRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("stores")
    .update({
      monthly_budget: monthlyBudget,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storeId)
    .select()
    .single();

  if (error) throw error;
  return parseStore(data);
}
