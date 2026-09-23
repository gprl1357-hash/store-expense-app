/**
 * Vercel Preview/Development 배포인지 판별 — dev 전용 값이 비어 있을 때
 * 운영 값으로 조용히 폴백하지 않도록, next.config.ts와 admin.ts가 공통으로
 * 이 기준 하나만 참조하도록 한다 (기준이 두 곳에 따로 있으면 한쪽만 바뀌는
 * 사고가 날 수 있음).
 */
export function isVercelNonProduction(vercelEnv: string | undefined): boolean {
  return vercelEnv === "preview" || vercelEnv === "development";
}
