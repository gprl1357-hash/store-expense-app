import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import { fetchStoreAdmin, updateStoreBudgetAdmin } from "@/lib/supabase/stores-admin";
import type { StoreId } from "@/lib/constants";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  const denied = await requireStoreSession(request, id);
  if (denied) return denied;

  try {
    const data = await fetchStoreAdmin(id as StoreId);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const monthlyBudget = body?.monthly_budget;

  if (typeof monthlyBudget !== "number" || monthlyBudget <= 0) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, id);
  if (denied) return denied;

  try {
    const data = await updateStoreBudgetAdmin(id as StoreId, monthlyBudget);
    return NextResponse.json(data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
