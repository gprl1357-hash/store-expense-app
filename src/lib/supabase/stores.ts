import type { StoreId } from "../constants";

export type StoreRow = {
  id: string;
  name: string;
  monthly_budget: number;
  updated_at: string;
};

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `요청에 실패했습니다. (${res.status})`);
  }
  return res.json();
}

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
