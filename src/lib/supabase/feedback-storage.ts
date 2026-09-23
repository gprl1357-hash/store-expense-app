import { getSupabase } from "./client";
import { extensionFromFile } from "./storage";

const BUCKET = "feedback-media";
const MAX_SIZE = 5 * 1024 * 1024;

/** 개선요청 첨부 사진 업로드 (동영상은 2단계에서 추가 예정) */
export async function uploadFeedbackMedia(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("사진 크기는 5MB 이하여야 합니다.");
  }

  const supabase = getSupabase();
  const ext = extensionFromFile(file);
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
