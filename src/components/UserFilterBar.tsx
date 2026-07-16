"use client";

import type { UserFilter } from "@/lib/constants";
import { USERS } from "@/lib/constants";

type UserFilterBarProps = {
  selected: UserFilter;
  onChange: (filter: UserFilter) => void;
};

const FILTERS: UserFilter[] = ["전체", ...USERS];

export function UserFilterBar({ selected, onChange }: UserFilterBarProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {FILTERS.map((filter) => {
        const isActive = selected === filter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onChange(filter)}
            className={`min-h-16 shrink-0 rounded-2xl px-5 text-lg font-bold transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                : "bg-white text-gray-800 ring-2 ring-gray-200"
            }`}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
