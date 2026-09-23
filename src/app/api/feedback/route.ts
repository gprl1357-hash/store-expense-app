import { NextRequest, NextResponse } from "next/server";
import { requireStoreSession } from "@/lib/auth/require-session";
import { insertFeedbackAdmin } from "@/lib/supabase/feedback-admin";
import { isSlackEnabled, getSlackNotifyChannelId } from "@/lib/slack/config";
import { postSlackMessage } from "@/lib/slack/client";
import { formatFeedbackNotifyMessage } from "@/lib/slack/messages";
import type { FeedbackInsert } from "@/lib/supabase/types";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_MEDIA_COUNT = 5;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | (FeedbackInsert & { store_id?: string })
    | null;

  const storeId = body?.store_id;
  const createdBy = body?.created_by;
  const message = body?.message?.trim();
  const mediaUrls = Array.isArray(body?.media_urls) ? body!.media_urls : [];

  if (
    !storeId ||
    typeof createdBy !== "string" ||
    !createdBy ||
    !message ||
    message.length > MAX_MESSAGE_LENGTH ||
    mediaUrls.length > MAX_MEDIA_COUNT ||
    !mediaUrls.every((url) => typeof url === "string")
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const denied = await requireStoreSession(request, storeId);
  if (denied) return denied;

  try {
    const feedback = await insertFeedbackAdmin({
      store_id: body!.store_id!,
      created_by: createdBy,
      message,
      media_urls: mediaUrls,
    });

    if (isSlackEnabled()) {
      const channelId = getSlackNotifyChannelId();
      if (channelId) {
        try {
          await postSlackMessage(channelId, formatFeedbackNotifyMessage(feedback));
        } catch (err) {
          console.error("[feedback] Slack 알림 실패:", err);
        }
      }
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "제보 등록에 실패했습니다." }, { status: 500 });
  }
}
