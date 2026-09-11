import { useSyncExternalStore } from "react";

export type Toast = { id: number; message: string };

const EMPTY: Toast[] = [];
let toasts: Toast[] = EMPTY;
let nextId = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function toast(message: string) {
  const id = ++nextId;
  toasts = [...toasts, { id, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => toasts,
    () => EMPTY,
  );
}
