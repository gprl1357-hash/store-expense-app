/**
 * 2026년 1~5월 테스트 데이터 시드
 * 실행: node scripts/seed-jan-may-2026.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const content = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
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
const USERS = ["홍혜기", "홍성미", "손선애"];
const MAX_AMOUNT = 3_000_000;

const MEMOS = [
  "정기 식자재",
  "전기·수도",
  "알바비",
  "소모품",
  "청소용품",
  "포장재",
  "주간 구매",
  "월말 정산",
  null,
];

const DAYS_IN_MONTH = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31 };

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount() {
  const presets = [
    8_000, 25_000, 55_000, 120_000, 280_000, 450_000, 680_000, 920_000,
    1_100_000, 1_600_000, 2_100_000, 2_600_000, 2_900_000, 3_000_000,
  ];
  return presets[randomInt(0, presets.length - 1)];
}

function generateForMonth(month, countPerMonth = 40) {
  const maxDay = DAYS_IN_MONTH[month];
  const records = [];
  for (let i = 0; i < countPerMonth; i++) {
    const day = randomInt(1, maxDay);
    records.push({
      date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      category: CATEGORIES[randomInt(0, 3)],
      amount: randomAmount(),
      memo: MEMOS[randomInt(0, MEMOS.length - 1)],
      created_by: USERS[randomInt(0, 2)],
    });
  }
  return records;
}

const allRecords = [1, 2, 3, 4, 5].flatMap((m) => generateForMonth(m, 42));

console.log(`→ ${allRecords.length}건 삽입 중 (2026년 1~5월, 건당 최대 ${MAX_AMOUNT.toLocaleString()}원)...`);

// Supabase insert limit — batch in chunks of 50
const BATCH = 50;
let inserted = 0;
for (let i = 0; i < allRecords.length; i += BATCH) {
  const batch = allRecords.slice(i, i + BATCH);
  const { data, error } = await supabase.from("expenses").insert(batch).select("id");
  if (error) {
    console.error("❌ 실패:", error.message);
    process.exit(1);
  }
  inserted += data.length;
  process.stdout.write(`  ${inserted}/${allRecords.length}...\r`);
}

const total = allRecords.reduce((s, r) => s + r.amount, 0);
const byMonth = {};
for (const r of allRecords) {
  const m = r.date.slice(0, 7);
  byMonth[m] = (byMonth[m] ?? 0) + r.amount;
}

console.log(`\n✓ ${inserted}건 삽입 완료 (합계 ${total.toLocaleString()}원)`);
console.log("  월별 합계:");
for (const m of Object.keys(byMonth).sort()) {
  console.log(`    ${m}: ${byMonth[m].toLocaleString()}원`);
}
