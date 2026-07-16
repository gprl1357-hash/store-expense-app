import {
  getSlackNotifyChannelId,
  isSlackEnabled,
} from "./config";
import { postSlackMessage } from "./client";
import { formatExpenseNotifyMessage } from "./messages";
import { createSupabaseAdmin } from "../supabase/admin";
import type { Expense } from "../supabase/types";
import { parseExpense } from "../supabase/types";

function parseExpensePayload(raw: unknown): Expense | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || !row.id) return null;
  if (typeof row.date !== "string") return null;
  if (typeof row.category !== "string") return null;
  if (typeof row.amount !== "number" && typeof row.amount !== "string") return null;
  if (typeof row.created_by !== "string") return null;

  return parseExpense({
    id: row.id,
    date: row.date,
    category: row.category,
    amount: Number(row.amount),
    memo: typeof row.memo === "string" ? row.memo : null,
    created_by: row.created_by,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    deleted_at: row.deleted_at ? String(row.deleted_at) : null,
    photo_url: typeof row.photo_url === "string" ? row.photo_url : null,
  });
}

/** 클라이언트가 등록 직후 보낸 지출 데이터로 Slack 알림 (DB 재조회 없음) */
export async function notifyExpenseData(expense: Expense): Promise<boolean> {
  if (!isSlackEnabled()) return false;

  const channelId = getSlackNotifyChannelId();
  if (!channelId) {
    console.warn("[slack] SLACK_NOTIFY_CHANNEL_ID 가 설정되지 않았습니다.");
    return false;
  }

  await postSlackMessage(channelId, formatExpenseNotifyMessage(expense));
  return true;
}

/** 지출 ID로 Slack 등록 알림 (DB 조회, 재시도 포함) */
export async function notifyExpenseById(expenseId: string): Promise<boolean> {
  if (!isSlackEnabled()) return false;

  const channelId = getSlackNotifyChannelId();
  if (!channelId) {
    console.warn("[slack] SLACK_NOTIFY_CHANNEL_ID 가 설정되지 않았습니다.");
    return false;
  }

  const supabase = createSupabaseAdmin();

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .single();

    if (!error && data) {
      const expense = parseExpense(data);
      await postSlackMessage(channelId, formatExpenseNotifyMessage(expense));
      return true;
    }

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  console.warn("[slack] 알림 대상 지출을 찾을 수 없습니다:", expenseId);
  return false;
}

export { parseExpensePayload };
