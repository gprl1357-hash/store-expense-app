import type { Feedback, FeedbackInsert } from "./types";

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `요청에 실패했습니다. (${res.status})`);
  }
  return res.json();
}

export async function submitFeedback(input: FeedbackInsert): Promise<Feedback> {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJson<Feedback>(res);
}
