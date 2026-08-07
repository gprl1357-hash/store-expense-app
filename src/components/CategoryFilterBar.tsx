"use client";

import { CATEGORIES, type CategoryFilter } from "@/lib/constants";

type CategoryFilterBarProps = {
  selected: CategoryFilter;
  onChange: (filter: CategoryFilter) => void;
};

const FILTERS: { value: CategoryFilter; label: string; emoji?: string }[] = [
  { value: "전체", label: "전체" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.label, emoji: c.emoji })),
];

export function CategoryFilterBar({ selected, onChange }: CategoryFilterBarProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <p className="mb-3 text-xl font-bold text-gray-900">카테고리별 보기</p>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {FILTERS.map((f) => {
          const isActive = selected === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange(f.value)}
              className={`flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                  : "bg-gray-50 text-gray-800 ring-2 ring-gray-200"
              }`}
            >
              {f.emoji && <span className="text-xl sm:text-2xl">{f.emoji}</span>}
              <span className="text-base font-bold sm:text-lg">{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
