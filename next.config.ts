import type { NextConfig } from "next";
import path from "path";
import { loadEnvConfig } from "@next/env";

// .env.local 은 next.config 평가 시점에 자동 로드되지 않으므로 명시적으로 로드
loadEnvConfig(path.join(__dirname));

/**
 * allowedDevOrigins 는 **호스트명만** (포트 제외) 등록해야 합니다.
 * Origin: http://192.168.45.84:3000 → 비교 대상은 "192.168.45.84"
 */
function parseDevOriginHost(entry: string): string {
  const trimmed = entry.trim();
  if (!trimmed) return "";
  if (trimmed.includes("://")) {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return trimmed;
    }
  }
  // 192.168.45.84:3000 → 192.168.45.84
  if (/^\[?[\da-f:.]+\]?(:\d+)?$/i.test(trimmed) && trimmed.includes(":")) {
    const lastColon = trimmed.lastIndexOf(":");
    const hostPart = trimmed.slice(0, lastColon);
    if (/^\d+$/.test(trimmed.slice(lastColon + 1))) {
      return hostPart.replace(/^\[|\]$/g, "");
    }
  }
  return trimmed;
}

const envOrigins =
  process.env.ALLOWED_DEV_ORIGINS?.split(",")
    .map(parseDevOriginHost)
    .filter(Boolean) ?? [];

const allowedDevOrigins = [
  ...new Set([
    "192.168.45.84", // 기본 Wi-Fi IP (변경 시 .env.local 또는 여기 수정)
    ...envOrigins,
  ]),
];

// Vercel Preview 환경변수가 대시보드의 이름 중복 제한 때문에
// NEXT_PUBLIC_SUPABASE_URL 대신 NEXT_PREVIEW_SUPABASE_URL 로 등록되어 있음.
// VERCEL_ENV(로컬에서는 undefined)로 분기하되, Preview/Development에서는
// NEXT_PREVIEW_* 가 비어 있어도 절대 운영 이름(NEXT_PUBLIC_*)으로 폴백하지
// 않는다 — 대시보드 설정이 잘못돼도 Preview가 조용히 운영 DB를 쓰는 사고를
// 막기 위함. 주의: Next.js의 env 오버라이드는 값이 undefined면 "오버라이드
// 안 함"으로 처리해 원래 process.env 값(=운영 값일 수 있음)이 그대로
// 새어나간다 — 그래서 undefined 대신 빈 문자열을 넣어 확실히 오버라이드하고,
// admin.ts/client.ts의 "비어있으면 에러" 체크로 드러나게 한다.
// TODO: Vercel 대시보드에서 NEXT_PUBLIC_SUPABASE_URL/ANON_KEY를 "Add Different
// Value for Production"으로 한 번 더 정리하면 이 분기 자체를 제거할 수 있다.
const vercelEnv = process.env.VERCEL_ENV;
const isVercelNonProduction = vercelEnv === "preview" || vercelEnv === "development";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: isVercelNonProduction
      ? process.env.NEXT_PREVIEW_SUPABASE_URL ?? ""
      : process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: isVercelNonProduction
      ? process.env.NEXT_PREVIEW_SUPABASE_ANON_KEY ?? ""
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  allowedDevOrigins,
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|icon-|.*\\.png$|.*\\.ico$).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
