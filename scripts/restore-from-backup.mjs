#!/usr/bin/env node
/**
 * 백업 JSON 파일에서 지출 데이터 복원
 *
 * 사용법:
 *   node scripts/restore-from-backup.mjs backups/expenses-backup-2026-07-16.json
 *   node scripts/restore-from-backup.mjs backups/expenses-backup-2026-07-16.json --dry-run
 *
 * 필요 env (.env.local 또는 환경변수):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (service role 권장)
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const filePath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!filePath) {
  console.error("사용법: node scripts/restore-from-backup.mjs <백업.json> [--dry-run]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const raw = readFileSync(resolve(filePath), "utf-8");
const backup = JSON.parse(raw);

if (!backup.expenses || !Array.isArray(backup.expenses)) {
  console.error("유효하지 않은 백업 파일입니다 (expenses 배열 없음).");
  process.exit(1);
}

console.log(`백업: ${backup.store ?? "unknown"}`);
console.log(`내보낸 시각: ${backup.exportedAt}`);
console.log(`건수: ${backup.expenses.length}`);
console.log(dryRun ? "\n[dry-run] DB 변경 없음\n" : "\n복원 시작...\n");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let ok = 0;
let fail = 0;

for (const row of backup.expenses) {
  const payload = {
    id: row.id,
    date: row.date,
    category: row.category,
    amount: row.amount,
    memo: row.memo ?? null,
    created_by: row.created_by,
    created_at: row.created_at,
    deleted_at: row.deleted_at ?? null,
    photo_url: row.photo_url ?? null,
  };

  if (dryRun) {
    console.log(`  [dry-run] ${row.id} ${row.date} ${row.category} ${row.amount}`);
    ok++;
    continue;
  }

  const { error } = await supabase.from("expenses").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    console.error(`  ✗ ${row.id}: ${error.message}`);
    fail++;
  } else {
    console.log(`  ✓ ${row.id} ${row.date} ${row.category}`);
    ok++;
  }
}

console.log(`\n완료: 성공 ${ok}, 실패 ${fail}`);
process.exit(fail > 0 ? 1 : 0);
