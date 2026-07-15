"use client";

import { List, PlusCircle } from "lucide-react";

export type Tab = "input" | "list";

type TabNavProps = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-2">
        <button
          type="button"
          onClick={() => onChange("input")}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 ${
            active === "input" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <PlusCircle className="h-7 w-7" />
          <span className="text-base font-bold">지출 입력</span>
        </button>
        <button
          type="button"
          onClick={() => onChange("list")}
          className={`flex min-h-16 flex-col items-center justify-center gap-1 ${
            active === "list" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <List className="h-7 w-7" />
          <span className="text-base font-bold">지출 내역</span>
        </button>
      </div>
    </nav>
  );
}
