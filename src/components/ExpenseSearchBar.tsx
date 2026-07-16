"use client";

import { Search, X } from "lucide-react";

type ExpenseSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
};

export function ExpenseSearchBar({
  value,
  onChange,
  resultCount,
}: ExpenseSearchBarProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <label className="mb-2 block text-xl font-bold text-gray-900">검색</label>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="메모, 금액, 이름으로 검색"
          className="min-h-16 w-full rounded-2xl border-0 bg-gray-50 py-3 pl-14 pr-16 text-xl ring-2 ring-gray-200 focus:ring-blue-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-gray-200"
            aria-label="검색어 지우기"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        )}
      </div>
      {value && resultCount !== undefined && (
        <p className="mt-2 text-lg text-gray-700">
          검색 결과 <span className="font-bold text-blue-600">{resultCount}건</span>
        </p>
      )}
    </div>
  );
}
