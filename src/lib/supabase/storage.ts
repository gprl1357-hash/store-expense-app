import { getSupabase } from "./client";

const BUCKET = "expense-photos";
const MAX_SIZE = 5 * 1024 * 1024;

function extensionFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/heic" || file.type === "image/heif") return "heic";
  return "jpg";
}

/** 클라이언트에서 이미지 리사이즈 (업로드 용량 절감) */
export async function resizeImageFile(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxWidth) {
        resolve(file);
        return;
      }
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러올 수 없습니다."));
    };
    img.src = url;
  });
}

export async function uploadExpensePhoto(expenseId: string, file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("사진 크기는 5MB 이하여야 합니다.");
  }

  const supabase = getSupabase();
  const ext = extensionFromFile(file);
  const path = `${expenseId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/jpeg",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteExpensePhoto(photoUrl: string): Promise<void> {
  const path = extractStoragePath(photoUrl);
  if (!path) return;

  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Photo delete failed:", error);
}

function extractStoragePath(photoUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = photoUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(photoUrl.slice(idx + marker.length));
}
