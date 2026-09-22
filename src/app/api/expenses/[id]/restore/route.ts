import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import { restoreExpenseAdmin } from "@/lib/supabase/expenses-admin";
import type { StoreId } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const storeId = body?.store_id;

  if (!storeId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  try {
    const data = await restoreExpenseAdmin(id, storeId as StoreId);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "복원에 실패했습니다." }, { status: 500 });
  }
}
