"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

/** 새 공지가 생기면 이 값을 바꾸면 모든 사용자에게 다시 표시됨 (72시간 유예도 초기화됨) */
const ANNOUNCEMENT_ID = "2026-09-24-login-change";
const STORAGE_KEY = "store-expense-announcement-suppress";
const SUPPRESS_MS = 72 * 60 * 60 * 1000; // 72시간

type Suppression = { id: string; until: number };

function isSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as Suppression;
    return data.id === ANNOUNCEMENT_ID && data.until > Date.now();
  } catch {
    return false;
  }
}

export function AnnouncementModal() {
  const [visible, setVisible] = useState(false);
  const [dontShow72h, setDontShow72h] = useState(false);

  useEffect(() => {
    setVisible(!isSuppressed());
  }, []);

  function handleClose() {
    setVisible(false);
    if (dontShow72h) {
      try {
        const data: Suppression = { id: ANNOUNCEMENT_ID, until: Date.now() + SUPPRESS_MS };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Megaphone className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-600">9월 24일 업데이트 내용</p>
            <p className="text-xl font-bold text-gray-900">로그인 방식 변경</p>
          </div>
        </div>

        <p className="rounded-2xl bg-gray-50 p-4 text-lg leading-relaxed text-gray-800">
          매장에 로그인하려면 휴대폰 번호 뒷자리를 입력해주세요. 각 매장
          대표의 휴대폰 번호 뒷자리 4자리와 안내받은 초기 비밀번호를
          입력하면 새 비밀번호를 설정할 수 있습니다. 초기 비밀번호를
          모르신다면 관리자에게 문의해 주세요.
        </p>

        <label className="mt-4 flex items-center gap-3 text-lg text-gray-600">
          <input
            type="checkbox"
            checked={dontShow72h}
            onChange={(e) => setDontShow72h(e.target.checked)}
            className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          72시간 동안 열지 않음
        </label>

        <button
          type="button"
          onClick={handleClose}
          className="mt-4 flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white active:bg-blue-700"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
}
