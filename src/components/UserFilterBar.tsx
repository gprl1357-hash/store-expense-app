"use client";

import type { User, UserFilter } from "@/lib/constants";

type UserFilterBarProps = {
  users: readonly User[];
  selected: UserFilter;
  onChange: (filter: UserFilter) => void;
};

export function UserFilterBar({
  users,
  selected,
  onChange,
}: UserFilterBarProps) {
  const filters: UserFilter[] = ["전체", ...users];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {filters.map((filter) => {
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
