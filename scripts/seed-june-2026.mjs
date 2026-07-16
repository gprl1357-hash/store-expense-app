/**
 * 2026년 6월 테스트 데이터 시드
 * 실행: node scripts/seed-june-2026.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "../.env.local");
  const content = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CATEGORIES = ["식자재", "공과금", "인건비", "기타"];
const USERS = ["사용자A", "사용자B", "사용자C"]; // DB 마이그레이션 전; SQL 실행 후 홍혜기/홍성미/손선애로 변환됨
const MEMOS = [
  "테스트 지출",
  "6월 정기비용",
  "식자재 구매",
  "전기세",
  "알바비",
  "소모품",
  "배달비",
  "청소용품",
  null,
];

const MAX_AMOUNT = 3_000_000;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount() {
  const presets = [
    5_000, 12_000, 35_000, 48_000, 85_000, 120_000, 250_000, 480_000,
    750_000, 980_000, 1_200_000, 1_850_000, 2_400_000, 2_950_000, 3_000_000,
  ];
  return presets[randomInt(0, presets.length - 1)];
}

function generateRecords(count = 45) {
  const records = [];
  for (let i = 0; i < count; i++) {
    const day = randomInt(1, 30);
    const date = `2026-06-${String(day).padStart(2, "0")}`;
    records.push({
      date,
      category: CATEGORIES[randomInt(0, 3)],
      amount: randomAmount(),
      memo: MEMOS[randomInt(0, MEMOS.length - 1)],
      created_by: USERS[randomInt(0, 2)],
    });
  }
  return records;
}

const records = generateRecords(48);
console.log(`→ ${records.length}건 삽입 중 (2026년 6월, 건당 최대 ${MAX_AMOUNT.toLocaleString()}원)...`);

const { data, error } = await supabase.from("expenses").insert(records).select("id");

if (error) {
  console.error("❌ 실패:", error.message);
  process.exit(1);
}

const total = records.reduce((s, r) => s + r.amount, 0);
console.log(`✓ ${data.length}건 삽입 완료`);
console.log(`  합계: ${total.toLocaleString()}원`);
console.log(`  현황 탭 → 2026년 6월에서 확인하세요.`);
