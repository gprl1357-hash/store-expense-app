import type { StoreId } from "../constants";
import { handleJson } from "./http";

export type StoreRow = {
  id: string;
  name: string;
  monthly_budget: number;
  updated_at: string;
};

export async function fetchStore(storeId: StoreId): Promise<StoreRow | null> {
  const res = await fetch(`/api/stores/${storeId}`);
  if (res.status === 401) return null;
  return handleJson<StoreRow | null>(res);
}

export async function updateStoreBudget(
  storeId: StoreId,
  monthlyBudget: number
): Promise<StoreRow> {
  const res = await fetch(`/api/stores/${storeId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monthly_budget: monthlyBudget }),
  });
  return handleJson<StoreRow>(res);
}
