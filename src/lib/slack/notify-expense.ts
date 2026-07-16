import {
  getSlackNotifyChannelId,
  isSlackEnabled,
} from "./config";
import { postSlackMessage } from "./client";
import { formatExpenseNotifyMessage } from "./messages";
import { createSupabaseAdmin } from "../supabase/admin";
import { parseExpense } from "../supabase/types";

/** 지출 ID로 Slack 등록 알림 전송 (DB에 존재하는 건만) */
export async function notifyExpenseById(expenseId: string): Promise<boolean> {
  if (!isSlackEnabled()) return false;

  const channelId = getSlackNotifyChannelId();
  if (!channelId) {
    console.warn("[slack] SLACK_NOTIFY_CHANNEL_ID 가 설정되지 않았습니다.");
    return false;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .single();

  if (error || !data) {
    console.warn("[slack] 알림 대상 지출을 찾을 수 없습니다:", expenseId);
    return false;
  }

  const expense = parseExpense(data);
  await postSlackMessage(channelId, formatExpenseNotifyMessage(expense));
  return true;
}
