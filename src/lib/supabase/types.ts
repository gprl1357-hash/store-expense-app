import type { Category, StoreId, User } from "../constants";

export type Expense = {
  id: string;
  store_id: StoreId;
  date: string;
  category: Category;
  amount: number;
  memo: string | null;
  created_by: User;
  created_at: string;
  deleted_at: string | null;
  photo_url: string | null;
};

export type ExpenseInsert = {
  store_id: StoreId;
  date?: string;
  category: Category;
  amount: number;
  memo?: string | null;
  created_by: User;
  photo_url?: string | null;
};

export type ExpenseUpdate = Partial<
  Pick<
    Expense,
    "date" | "category" | "amount" | "memo" | "created_by" | "photo_url"
  >
>;

type ExpenseRow = {
  id: string;
  store_id?: string | null;
  date: string;
  category: string;
  amount: number;
  memo: string | null;
  created_by: string;
  created_at: string;
  deleted_at?: string | null;
  photo_url?: string | null;
};

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: ExpenseRow;
        Insert: {
          id?: string;
          store_id: string;
          date?: string;
          category: string;
          amount: number;
          memo?: string | null;
          created_by: string;
          created_at?: string;
          deleted_at?: string | null;
          photo_url?: string | null;
        };
        Update: {
          id?: string;
          store_id?: string;
          date?: string;
          category?: string;
          amount?: number;
          memo?: string | null;
          created_by?: string;
          created_at?: string;
          deleted_at?: string | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      stores: {
        Row: {
          id: string;
          name: string;
          monthly_budget: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          monthly_budget?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          monthly_budget?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** Supabase에서 받은 numeric 타입을 number로 변환 */
export function parseExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    store_id: (row.store_id ?? "gwangmyeong-gidc") as StoreId,
    date: row.date,
    category: row.category as Category,
    amount: Number(row.amount),
    memo: row.memo,
    created_by: row.created_by as User,
    created_at: row.created_at,
    deleted_at: row.deleted_at ?? null,
    photo_url: row.photo_url ?? null,
  };
}
