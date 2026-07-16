"use server";

import {
  getSlackNotifyChannelId,
  isSlackEnabled,
} from "@/lib/slack/config";
import { postSlackMessage } from "@/lib/slack/client";
import { formatExpenseNotifyMessage } from "@/lib/slack/messages";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { parseExpense } from "@/lib/supabase/types";

/** 지출 등록 후 Slack 알림 (DB에 존재하는 건만 전송) */
export async function notifyExpenseRegistered(expenseId: string): Promise<void> {
  if (!isSlackEnabled()) return;

  const channelId = getSlackNotifyChannelId();
  if (!channelId) {
    console.warn("[slack] SLACK_NOTIFY_CHANNEL_ID 가 설정되지 않았습니다.");
    return;
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .single();

    if (error || !data) {
      console.warn("[slack] 알림 대상 지출을 찾을 수 없습니다:", expenseId);
      return;
    }

    const expense = parseExpense(data);
    await postSlackMessage(channelId, formatExpenseNotifyMessage(expense));
  } catch (err) {
    console.error("[slack] 지출 등록 알림 실패:", err);
  }
}
