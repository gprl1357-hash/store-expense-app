"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Megaphone, X } from "lucide-react";
import type { StoreId, User } from "@/lib/constants";
import { resizeImageFile } from "@/lib/supabase/storage";
import { uploadFeedbackMedia } from "@/lib/supabase/feedback-storage";
import { submitFeedback } from "@/lib/supabase/feedback";

const MAX_PHOTOS = 5;

type FeedbackModalProps = {
  storeId: StoreId;
  users: readonly User[];
  onClose: () => void;
  onSubmitted: (message: string) => void;
};

type PendingPhoto = { file: File; preview: string };

export function FeedbackModal({
  storeId,
  users,
  onClose,
  onSubmitted,
}: FeedbackModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [createdBy, setCreatedBy] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("사진 크기는 5MB 이하여야 합니다.");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
      return;
    }
    setError("");
    setPhotos((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!createdBy) {
      setError("작성자를 선택해 주세요.");
      return;
    }
    if (!message.trim()) {
      setError("내용을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const mediaUrls = await Promise.all(
        photos.map(async (photo) => {
          const resized = await resizeImageFile(photo.file);
          return uploadFeedbackMedia(resized);
        })
      );

      await submitFeedback({
        store_id: storeId,
        created_by: createdBy,
        message: message.trim(),
        media_urls: mediaUrls,
      });

      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      onSubmitted("건의사항이 접수되었습니다 ✓");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">건의하기</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-3 block text-xl font-bold text-gray-800">
              작성자
            </label>
            <div
              className={`grid gap-3 ${users.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}
            >
              {users.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => setCreatedBy(user)}
                  className={`min-h-[4rem] rounded-2xl px-1 text-lg font-bold transition-all ${
                    createdBy === user
                      ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                      : "bg-white text-gray-800 ring-2 ring-gray-200"
                  }`}
                >
                  {user}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="feedback-message" className="mb-2 block text-xl font-bold text-gray-800">
              내용
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="불편한 점이나 개선했으면 하는 점을 자유롭게 적어주세요"
              rows={5}
              className="w-full rounded-2xl border-0 bg-gray-50 px-5 py-4 text-xl text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xl font-bold text-gray-800">
              사진 <span className="font-normal text-gray-400">(선택, 최대 {MAX_PHOTOS}장)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            {photos.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-2">
                {photos.map((photo, i) => (
                  <div
                    key={photo.preview}
                    className="relative overflow-hidden rounded-xl ring-2 ring-gray-200"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.preview}
                      alt={`첨부 사진 ${i + 1}`}
                      className="h-24 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white"
                      aria-label="사진 제거"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-bold text-gray-700 ring-2 ring-gray-200 active:bg-gray-50"
              >
                <Camera className="h-5 w-5" />
                사진 추가
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-lg font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "접수하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
