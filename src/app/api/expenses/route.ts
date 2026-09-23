import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import {
  fetchExpensesInRangeAdmin,
  insertExpenseAdmin,
} from "@/lib/supabase/expenses-admin";
import type { ExpenseInsert } from "@/lib/supabase/types";
import type { StoreId } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!storeId || !start || !end) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  try {
    const data = await fetchExpensesInRangeAdmin(
      storeId as StoreId,
      start,
      end
    );
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as ExpenseInsert | null;
  if (!body?.store_id) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, body.store_id);
  if (denied) return denied;

  try {
    const data = await insertExpenseAdmin(body);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "등록에 실패했습니다." }, { status: 500 });
  }
}
