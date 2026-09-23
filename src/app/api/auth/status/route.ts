import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName, verifyStoreSession } from "@/lib/auth/session";
import { STORE_IDS, type StoreId } from "@/lib/constants";

/** 현재 브라우저(쿠키)에서 간편 로그인 상태인 매장 목록 */
export async function GET(request: NextRequest) {
  const results = await Promise.all(
    STORE_IDS.map(async (storeId) => {
      const token = request.cookies.get(sessionCookieName(storeId))?.value;
      const ok = await verifyStoreSession(storeId, token);
      return ok ? storeId : null;
    })
  );

  return NextResponse.json({
    authenticatedStoreIds: results.filter((id): id is StoreId => id !== null),
  });
}
