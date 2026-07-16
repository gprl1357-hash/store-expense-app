/** Slack 연동 활성 여부 (토큰 없거나 SLACK_ENABLED=false 이면 비활성) */
export function isSlackEnabled(): boolean {
  if (process.env.SLACK_ENABLED === "false") return false;
  return Boolean(process.env.SLACK_BOT_TOKEN);
}

export function getSlackBotToken(): string | null {
  return process.env.SLACK_BOT_TOKEN ?? null;
}

/** 지출 등록 알림 채널 */
export function getSlackNotifyChannelId(): string | null {
  return (
    process.env.SLACK_NOTIFY_CHANNEL_ID ??
    process.env.SLACK_BACKUP_CHANNEL_ID ??
    null
  );
}

/** 일일 백업 알림 채널 */
export function getSlackBackupChannelId(): string | null {
  return (
    process.env.SLACK_BACKUP_CHANNEL_ID ??
    process.env.SLACK_NOTIFY_CHANNEL_ID ??
    null
  );
}
