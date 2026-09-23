import { createSupabaseAdmin } from "./admin";
import type { Feedback, FeedbackInsert } from "./types";
import { parseFeedback } from "./types";

/** 서버 전용 — API Route에서만 사용 (세션 검증 이후 호출) */
export async function insertFeedbackAdmin(
  input: FeedbackInsert
): Promise<Feedback> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("feedback")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return parseFeedback(data);
}
