import type { Category, User } from "../constants";

export type Expense = {
  id: string;
  date: string;
  category: Category;
  amount: number;
  memo: string | null;
  created_by: User;
  created_at: string;
};

export type ExpenseInsert = {
  date?: string;
  category: Category;
  amount: number;
  memo?: string | null;
  created_by: User;
};

export type ExpenseUpdate = Partial<
  Pick<Expense, "date" | "category" | "amount" | "memo" | "created_by">
>;

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          amount: number;
          memo: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date?: string;
          category: string;
          amount: number;
          memo?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          category?: string;
          amount?: number;
          memo?: string | null;
          created_by?: string;
          created_at?: string;
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
export function parseExpense(row: Database["public"]["Tables"]["expenses"]["Row"]): Expense {
  return {
    id: row.id,
    date: row.date,
    category: row.category as Category,
    amount: Number(row.amount),
    memo: row.memo,
    created_by: row.created_by as User,
    created_at: row.created_at,
  };
}
