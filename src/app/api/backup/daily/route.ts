import { NextRequest, NextResponse } from "next/server";
import {
  buildExpenseBackup,
  kstDateString,
  serializeBackup,
} from "@/lib/backup/export";
import {
  getSlackBackupChannelId,
  isSlackEnabled,
} from "@/lib/slack/config";
import { uploadSlackFile } from "@/lib/slack/client";
import { formatDailyBackupMessage } from "@/lib/slack/messages";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseExpense } from "@/lib/supabase/types";

const BACKUP_BUCKET = "expense-backups";

function verifyCronAuth(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV === "development";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function fetchAllExpenses() {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(parseExpense);
}

async function saveBackupToStorage(dateLabel: string, json: string) {
  const path = `daily/${dateLabel}/expenses.json`;
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.storage
    .from(BACKUP_BUCKET)
    .upload(path, json, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    console.warn("[backup] Storage 저장 실패 (Slack 파일은 계속 전송):", error.message);
    return null;
  }
  return path;
}

/** 일일 백업 — Vercel Cron 또는 수동 호출 (Authorization: Bearer CRON_SECRET) */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const expenses = await fetchAllExpenses();
    const backup = buildExpenseBackup(expenses);
    const json = serializeBackup(backup);
    const dateLabel = kstDateString();

    const storagePath =
      (await saveBackupToStorage(dateLabel, json)) ??
      `(Storage 미설정 — ${BACKUP_BUCKET} 버킷 확인)`;

    const slackEnabled = isSlackEnabled();
    const channelId = getSlackBackupChannelId();

    if (slackEnabled && channelId) {
      const filename = `expenses-backup-${dateLabel}.json`;
      const message = formatDailyBackupMessage({
        dateLabel,
        ...backup.stats,
        storagePath,
      });

      await uploadSlackFile(channelId, filename, json, message);
    } else if (slackEnabled) {
      console.warn("[backup] SLACK_BACKUP_CHANNEL_ID 가 설정되지 않았습니다.");
    }

    return NextResponse.json({
      ok: true,
      date: dateLabel,
      storagePath,
      stats: backup.stats,
      slackNotified: slackEnabled && Boolean(channelId),
    });
  } catch (err) {
    console.error("[backup] 일일 백업 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Backup failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
