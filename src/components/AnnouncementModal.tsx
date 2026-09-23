"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

/** 새 공지가 생기면 이 값을 바꾸면 모든 사용자에게 다시 한 번 표시됨 */
const ANNOUNCEMENT_ID = "2026-09-24-login-change";
const STORAGE_KEY = "store-expense-announcement-seen";

export function AnnouncementModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== ANNOUNCEMENT_ID) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function handleClose() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID);
    } catch {
      /* ignore */
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
          대표의 휴대폰 번호 뒷자리 4자리를 입력하고 최초 비밀번호{" "}
          <span className="font-bold">&ldquo;0000&rdquo;</span>을 입력하면
          비밀번호를 설정할 수 있습니다.
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 flex min-h-16 w-full items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white active:bg-blue-700"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
}
