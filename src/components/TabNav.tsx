"use client";

import { LayoutGrid, PlusCircle } from "lucide-react";

export type Tab = "input" | "browse";

type TabNavProps = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: { value: Tab; label: string; Icon: typeof PlusCircle }[] = [
  { value: "input", label: "지출 입력", Icon: PlusCircle },
  { value: "browse", label: "내역 조회", Icon: LayoutGrid },
];

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-1 p-1">
        {TABS.map(({ value, label, Icon }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 ring-1 ring-gray-200"
              }`}
            >
              <Icon className="h-8 w-8" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-lg font-bold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
