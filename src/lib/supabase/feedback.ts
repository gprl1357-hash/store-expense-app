import type { Feedback, FeedbackInsert } from "./types";
import { handleJson } from "./http";

export async function submitFeedback(input: FeedbackInsert): Promise<Feedback> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJson<Feedback>(res);
}
