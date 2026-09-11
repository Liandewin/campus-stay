"use client";

import { CircleCheck } from "lucide-react";
import { useToasts } from "@/lib/toast";

export function Toaster() {
  const toasts = useToasts();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
        >
          <CircleCheck className="size-4 shrink-0 text-emerald-400" />
          {t.message}
        </div>
      ))}
    </div>
  );
}
