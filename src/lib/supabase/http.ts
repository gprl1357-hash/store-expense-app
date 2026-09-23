/** 클라이언트 → API Route 요청 공통 응답 처리 (expenses/feedback/stores 공용) */
export async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `요청에 실패했습니다. (${res.status})`);
  }
  return res.json();
}
