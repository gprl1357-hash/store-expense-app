"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_STORE_ID,
  STORE_STORAGE_KEY,
  STORES,
  getStoreConfig,
  type StoreConfig,
  type StoreId,
  type User,
} from "./constants";
import { fetchStore, updateStoreBudget } from "./supabase/stores";

type StoreContextValue = {
  storeId: StoreId;
  store: StoreConfig;
  users: readonly User[];
  monthlyBudget: number;
  budgetLoading: boolean;
  setStoreId: (id: StoreId) => void;
  refreshBudget: () => Promise<void>;
  saveBudget: (amount: number) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readStoredStoreId(): StoreId {
  if (typeof window === "undefined") return DEFAULT_STORE_ID;
  try {
    const raw = localStorage.getItem(STORE_STORAGE_KEY);
    if (raw && STORES.some((s) => s.id === raw)) {
      return raw as StoreId;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_STORE_ID;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreIdState] = useState<StoreId>(DEFAULT_STORE_ID);
  const [hydrated, setHydrated] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState(
    getStoreConfig(DEFAULT_STORE_ID).defaultBudget
  );
  const [budgetLoading, setBudgetLoading] = useState(true);

  useEffect(() => {
    setStoreIdState(readStoredStoreId());
    setHydrated(true);
  }, []);

  const store = useMemo(() => getStoreConfig(storeId), [storeId]);

  const refreshBudget = useCallback(async () => {
    setBudgetLoading(true);
    try {
      const row = await fetchStore(storeId);
      setMonthlyBudget(row?.monthly_budget ?? store.defaultBudget);
    } catch (err) {
      console.error(err);
      setMonthlyBudget(store.defaultBudget);
    } finally {
      setBudgetLoading(false);
    }
  }, [storeId, store.defaultBudget]);

  useEffect(() => {
    if (!hydrated) return;
    refreshBudget();
  }, [hydrated, refreshBudget]);

  const setStoreId = useCallback((id: StoreId) => {
    setStoreIdState(id);
    try {
      localStorage.setItem(STORE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const saveBudget = useCallback(
    async (amount: number) => {
      const updated = await updateStoreBudget(storeId, amount);
      setMonthlyBudget(updated.monthly_budget);
    },
    [storeId]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      storeId,
      store,
      users: store.users,
      monthlyBudget,
      budgetLoading,
      setStoreId,
      refreshBudget,
      saveBudget,
    }),
    [
      storeId,
      store,
      monthlyBudget,
      budgetLoading,
      setStoreId,
      refreshBudget,
      saveBudget,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
