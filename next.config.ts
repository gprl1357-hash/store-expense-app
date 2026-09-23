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
// 대시보드에서 NEXT_PUBLIC_SUPABASE_URL 자체가 실수로 "Production and Preview"
// 공통 값(운영 URL)으로 남아있는 경우까지 대비해, Vercel이 자동 주입하는
// VERCEL_ENV로 명시적으로 분기한다 — Preview/Development는 무조건 dev 값을
// 우선 사용하고, 운영 빌드(VERCEL_ENV==='production')만 표준 이름을 그대로 쓴다.
const isVercelProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: isVercelProduction
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PREVIEW_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: isVercelProduction
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.NEXT_PREVIEW_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
