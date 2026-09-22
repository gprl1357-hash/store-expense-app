import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import { fetchDeletedExpensesAdmin } from "@/lib/supabase/expenses-admin";
import type { StoreId } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  try {
    const data = await fetchDeletedExpensesAdmin(storeId as StoreId);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}
