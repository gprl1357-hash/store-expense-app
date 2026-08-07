"use client";

import { STORES, type StoreId } from "@/lib/constants";

type StoreSwitcherProps = {
  selected: StoreId;
  onChange: (id: StoreId) => void;
};

export function StoreSwitcher({ selected, onChange }: StoreSwitcherProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STORES.map((store) => {
        const isActive = selected === store.id;
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onChange(store.id)}
            className={`min-h-16 rounded-2xl px-3 text-lg font-bold transition-colors ${
              isActive
                ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-700"
                : "bg-white text-gray-800 ring-2 ring-gray-200"
            }`}
          >
            {store.shortName}
          </button>
        );
      })}
    </div>
  );
}
