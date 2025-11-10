import { create } from "zustand";

export type ToastIntent = "info" | "success" | "error";

export type Toast = {
  id: number;
  intent: ToastIntent;
  message: string;
};

type ToastStore = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id"> & { id?: number }) => number;
  dismiss: (id: number) => void;
};

let toastId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = toast.id ?? ++toastId;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },
  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
}));

export function pushToast(message: string, intent: ToastIntent = "info") {
  useToastStore.getState().push({ message, intent });
}
