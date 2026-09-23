import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifyStoreSession } from "./session";

/** API Route에서 매장 세션을 검증. 실패 시 401 응답을 반환, 성공 시 null 반환 */
export async function requireStoreSession(
  request: NextRequest,
  storeId: string
): Promise<NextResponse | null> {
  const token = request.cookies.get(sessionCookieName(storeId))?.value;
  const ok = await verifyStoreSession(storeId, token);

  if (!ok) {
    return NextResponse.json(
      { error: "로그인이 필요합니다.", storeId },
      { status: 401 }
    );
  }
  return null;
}
