"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Plus, X } from "lucide-react";
import {
  AMOUNT_SHORTCUTS,
  CATEGORIES,
  USERS,
  addDaysToDateString,
  formatDate,
  todayString,
  type Category,
  type User,
} from "@/lib/constants";
import type { ExpenseInsert } from "@/lib/supabase/types";

type ExpenseFormProps = {
  onSubmit: (input: ExpenseInsert, photo?: File | null) => Promise<void>;
};

export function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState(0);
  const [amountInput, setAmountInput] = useState("");
  const [createdBy, setCreatedBy] = useState<User | null>(null);
  const [memo, setMemo] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [date, setDate] = useState(todayString);

  const today = todayString();
  const isToday = date === today;

  function handleAmountChange(raw: string) {
    const digits = raw.replace(/\D/g, "");
    const num = digits ? Number(digits) : 0;
    setAmount(num);
    setAmountInput(digits ? num.toLocaleString("ko-KR") : "");
  }

  function addAmount(value: number) {
    const next = amount + value;
    setAmount(next);
    setAmountInput(next.toLocaleString("ko-KR"));
  }

  function resetAmount() {
    setAmount(0);
    setAmountInput("");
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("사진 크기는 5MB 이하여야 합니다.");
      return;
    }
    setError("");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function clearPhoto() {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("카테고리를 선택해 주세요.");
      return;
    }
    if (amount <= 0) {
      setError("금액을 입력해 주세요.");
      return;
    }
    if (!createdBy) {
      setError("작성자를 선택해 주세요.");
      return;
    }
    if (!date) {
      setError("날짜를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(
        {
          date,
          category,
          amount,
          memo: memo.trim() || null,
          created_by: createdBy,
        },
        photo
      );
      setCategory(null);
      resetAmount();
      setMemo("");
      setDate(todayString());
      clearPhoto();
    } catch {
      setError("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 날짜 */}
      <div>
        <label htmlFor="expense-date" className="mb-2 block text-xl font-bold text-gray-800">
          날짜
        </label>
        <input
          id="expense-date"
          type="date"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-[4.5rem] w-full rounded-2xl border-0 bg-white px-5 text-xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDate(today)}
            className={`min-h-14 rounded-2xl text-lg font-bold ring-2 ${
              isToday
                ? "bg-blue-600 text-white ring-blue-700"
                : "bg-white text-gray-800 ring-gray-200"
            }`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => setDate(addDaysToDateString(today, -1))}
            className={`min-h-14 rounded-2xl text-lg font-bold ring-2 ${
              date === addDaysToDateString(today, -1)
                ? "bg-blue-600 text-white ring-blue-700"
                : "bg-white text-gray-800 ring-gray-200"
            }`}
          >
            어제
          </button>
        </div>
        <p className="mt-2 text-lg text-gray-600">
          {isToday ? "오늘" : "선택한 날짜"} · {formatDate(date)}
        </p>
      </div>

      {/* 작성자 선택 */}
      <div>
        <label className="mb-3 block text-xl font-bold text-gray-800">
          작성자
        </label>
        <div className="grid grid-cols-3 gap-3">
          {USERS.map((user) => (
            <button
              key={user}
              type="button"
              onClick={() => setCreatedBy(user)}
              className={`min-h-[4.5rem] rounded-2xl px-1 text-lg font-bold transition-all ${
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

      {/* 카테고리 카드 */}
      <div>
        <label className="mb-3 block text-xl font-bold text-gray-800">
          카테고리
        </label>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl text-xl font-bold transition-all ${
                category === cat.value
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                  : "bg-white text-gray-900 ring-2 ring-gray-200"
              }`}
            >
              <span className="text-4xl">{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 금액 입력 */}
      <div>
        <label className="mb-2 block text-xl font-bold text-gray-800">
          금액
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={amountInput}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          className="min-h-[4.5rem] w-full rounded-2xl border-0 bg-white px-5 text-4xl font-bold text-gray-900 ring-2 ring-gray-200 focus:ring-blue-500"
        />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {AMOUNT_SHORTCUTS.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => addAmount(shortcut.value)}
              className="min-h-[4.5rem] rounded-xl bg-blue-50 text-xl font-bold text-blue-800 ring-2 ring-blue-200 active:bg-blue-100"
            >
              {shortcut.label}
            </button>
          ))}
          <button
            type="button"
            onClick={resetAmount}
            className="min-h-[4.5rem] rounded-xl bg-gray-100 text-xl font-bold text-gray-700 ring-2 ring-gray-200 active:bg-gray-200"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 메모 */}
      <div>
        <label className="mb-2 block text-xl font-bold text-gray-800">
          메모 <span className="font-normal text-gray-400">(선택)</span>
        </label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="간단한 메모"
          className="min-h-[4.5rem] w-full rounded-2xl border-0 bg-white px-5 text-xl ring-2 ring-gray-200 focus:ring-blue-500"
        />
      </div>

      {/* 사진 첨부 */}
      <div>
        <label className="mb-2 block text-xl font-bold text-gray-800">
          사진 <span className="font-normal text-gray-400">(선택)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          className="hidden"
        />
        {photoPreview ? (
          <div className="relative overflow-hidden rounded-2xl ring-2 ring-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="첨부 사진 미리보기"
              className="max-h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={clearPhoto}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="사진 제거"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[4.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-white text-xl font-bold text-gray-700 ring-2 ring-gray-200 active:bg-gray-50"
          >
            <Camera className="h-6 w-6" />
            사진 촬영 또는 선택
          </button>
        )}
        <p className="mt-2 text-sm text-gray-400">
          영수증·증빙 사진 (조회 탭에서만 확인 가능)
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-lg font-medium text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[4.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg active:bg-blue-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Plus className="h-6 w-6" />
            지출 등록
          </>
        )}
      </button>
    </form>
  );
}
