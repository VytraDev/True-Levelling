import { create } from 'zustand';

const TOAST_DURATION_MS = 2000;
export const TOAST_UNDO_WINDOW_MS = 5000;

export type ToastItem = string | { message: string; onUndo: () => void };

interface ToastState {
  queue: ToastItem[];
  current: ToastItem | null;
  addToast: (message: string) => void;
  addToastWithUndo: (message: string, onUndo: () => void) => void;
  dismiss: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  queue: [],
  current: null,

  addToast(message: string) {
    set((state) => {
      const next = [...state.queue, message];
      if (state.current === null && next.length > 0) {
        const [first, ...rest] = next;
        return { queue: rest, current: first };
      }
      return { queue: next };
    });
  },

  addToastWithUndo(message: string, onUndo: () => void) {
    set((state) => {
      const item: ToastItem = { message, onUndo };
      const next = [...state.queue, item];
      if (state.current === null && next.length > 0) {
        const [first, ...rest] = next;
        return { queue: rest, current: first };
      }
      return { queue: next };
    });
  },

  dismiss() {
    set((state) => {
      if (state.queue.length > 0) {
        const [first, ...rest] = state.queue;
        const duration = typeof first === 'string' ? TOAST_DURATION_MS : TOAST_UNDO_WINDOW_MS;
        setTimeout(() => get().dismiss(), duration);
        return { queue: rest, current: first };
      }
      return { queue: [], current: null };
    });
  },
}));
