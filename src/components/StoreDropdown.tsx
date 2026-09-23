"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Store as StoreIcon } from "lucide-react";
import { STORES, type StoreId } from "@/lib/constants";

type StoreDropdownProps = {
  selected: StoreId;
  authenticatedStoreIds: Set<string>;
  onSelect: (id: StoreId) => void;
  onAddStore: () => void;
};

export function StoreDropdown({
  selected,
  authenticatedStoreIds,
  onSelect,
  onAddStore,
}: StoreDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const authenticatedStores = STORES.filter((s) =>
    authenticatedStoreIds.has(s.id)
  );
  const current = authenticatedStores.find((s) => s.id === selected);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-16 w-full items-center justify-between gap-2 rounded-2xl bg-white px-5 text-lg font-bold text-gray-900 shadow-sm ring-2 ring-gray-200 active:bg-gray-50"
      >
        <span className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-blue-600" />
          {current?.shortName ?? "매장 선택"}
        </span>
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100">
          {authenticatedStores.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                onSelect(s.id);
                setOpen(false);
              }}
              className={`flex min-h-16 w-full items-center px-5 text-lg font-bold ${
                s.id === selected
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-800 active:bg-gray-50"
              }`}
            >
              {s.shortName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              onAddStore();
              setOpen(false);
            }}
            className="flex min-h-16 w-full items-center gap-2 border-t border-gray-100 px-5 text-lg font-bold text-blue-600 active:bg-blue-50"
          >
            <Plus className="h-5 w-5" />
            다른 매장 로그인
          </button>
        </div>
      )}
    </div>
  );
}
