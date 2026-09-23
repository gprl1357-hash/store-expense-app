"use client";

import { Megaphone } from "lucide-react";

type FeedbackButtonProps = {
  onClick: () => void;
};

export function FeedbackButton({ onClick }: FeedbackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg active:bg-gray-800"
      aria-label="건의하기"
    >
      <Megaphone className="h-7 w-7" />
    </button>
  );
}
