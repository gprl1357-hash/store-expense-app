import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import {
  deleteExpenseAdmin,
  updateExpenseAdmin,
} from "@/lib/supabase/expenses-admin";
import type { ExpenseUpdate } from "@/lib/supabase/types";
import type { StoreId } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as
    | (ExpenseUpdate & { store_id?: string })
    | null;
  const storeId = body?.store_id;

  if (!storeId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  const { store_id: _storeId, ...update } = body;
  void _storeId;

  try {
    const data = await updateExpenseAdmin(id, storeId as StoreId, update);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  try {
    await deleteExpenseAdmin(id, storeId as StoreId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
}
