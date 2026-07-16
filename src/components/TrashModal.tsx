"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Trash2, X } from "lucide-react";
import { CATEGORIES, formatAmount, formatDate } from "@/lib/constants";
import type { Expense } from "@/lib/supabase/types";

type TrashModalProps = {
  onClose: () => void;
  onRestore: (id: string) => Promise<void>;
  fetchDeleted: () => Promise<Expense[]>;
};

function getCategoryEmoji(category: string): string {
  return CATEGORIES.find((c) => c.value === category)?.emoji ?? "📦";
}

function formatDeletedAt(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TrashModal({ onClose, onRestore, fetchDeleted }: TrashModalProps) {
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    fetchDeleted()
      .then(setItems)
      .finally(() => setLoading(false));
  }, [fetchDeleted]);

  async function handleRestore(expense: Expense) {
    setRestoringId(expense.id);
    try {
      await onRestore(expense.id);
      setItems((prev) => prev.filter((e) => e.id !== expense.id));
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-2xl font-bold">삭제된 내역</h2>
            <p className="mt-1 text-base text-gray-500">복원하면 다시 목록에 나타납니다</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <Trash2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-xl text-gray-400">삭제된 내역이 없습니다</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((expense) => (
                <li
                  key={expense.id}
                  className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="text-3xl">{getCategoryEmoji(expense.category)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-gray-800">
                        {expense.category} · {formatAmount(expense.amount)}
                      </p>
                      <p className="text-base text-gray-600">
                        {formatDate(expense.date)} · {expense.created_by}
                      </p>
                      {expense.memo && (
                        <p className="truncate text-base text-gray-500">{expense.memo}</p>
                      )}
                      <p className="mt-1 text-sm text-red-400">
                        삭제: {expense.deleted_at ? formatDeletedAt(expense.deleted_at) : "-"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore(expense)}
                    disabled={restoringId === expense.id}
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 text-lg font-bold text-white active:bg-green-700 disabled:opacity-60"
                  >
                    {restoringId === expense.id ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-6 w-6" />
                        복원하기
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
