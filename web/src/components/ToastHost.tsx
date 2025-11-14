import { useEffect } from "react";
import { useToastStore } from "../state/toastStore";
import "./ToastHost.less";

const TOAST_DURATION = 4500;

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismiss(toast.id), TOAST_DURATION)
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [toasts, dismiss]);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.intent}`}>
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss toast"
            onClick={() => dismiss(toast.id)}
            className="toast-dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
