import { getSlackBotToken } from "./config";

type SlackApiResponse = { ok: boolean; error?: string };

async function slackFormApi<T extends SlackApiResponse>(
  method: string,
  fields: Record<string, string | number>
): Promise<T> {
  const token = getSlackBotToken();
  if (!token) throw new Error("SLACK_BOT_TOKEN 이 설정되지 않았습니다.");

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(fields)) {
    body.set(key, String(value));
  }

  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    },
    body,
  });

  const data = (await res.json()) as T;
  if (!data.ok) {
    throw new Error(data.error ?? `Slack API ${method} 실패`);
  }
  return data;
}

async function slackJsonApi<T extends SlackApiResponse>(
  method: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = getSlackBotToken();
  if (!token) throw new Error("SLACK_BOT_TOKEN 이 설정되지 않았습니다.");

  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as T;
  if (!data.ok) {
    throw new Error(data.error ?? `Slack API ${method} 실패`);
  }
  return data;
}

/** Slack 채널에 텍스트 메시지 전송 */
export async function postSlackMessage(
  channelId: string,
  text: string
): Promise<void> {
  await slackJsonApi("chat.postMessage", { channel: channelId, text });
}

/** Slack 채널에 JSON 파일 업로드 (복원용 백업) */
export async function uploadSlackFile(
  channelId: string,
  filename: string,
  content: string,
  initialComment?: string
): Promise<void> {
  const bytes = Buffer.from(content, "utf-8");

  const urlData = await slackFormApi<
    SlackApiResponse & { upload_url?: string; file_id?: string }
  >("files.getUploadURLExternal", {
    filename,
    length: bytes.length,
  });

  const uploadUrl = urlData.upload_url;
  const fileId = urlData.file_id;
  if (!uploadUrl || !fileId) {
    throw new Error("Slack 파일 업로드 URL 발급 실패");
  }

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: bytes,
  });
  if (!uploadRes.ok) {
    throw new Error(`Slack 파일 업로드 실패 (${uploadRes.status})`);
  }

  await slackJsonApi("files.completeUploadExternal", {
    files: [{ id: fileId, title: filename }],
    channel_id: channelId,
    initial_comment: initialComment,
  });
}
