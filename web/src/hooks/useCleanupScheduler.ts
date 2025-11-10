import { useEffect } from "react";
import { useSettingsRecord } from "../db/hooks";
import { runCleanup } from "../lib/cleanup";
import { useUIStore } from "../state/uiStore";
import { pushToast } from "../state/toastStore";
import { minutesToMs } from "../lib/helpers";

export function useCleanupScheduler() {
  const settings = useSettingsRecord();
  const setLastCleanupRun = useUIStore((state) => state.setLastCleanupRun);

  useEffect(() => {
    if (!settings) {
      return;
    }
    const intervalMs = minutesToMs(settings.cleanupIntervalMinutes || 5);
    let isMounted = true;

    async function run(label: "auto" | "manual" = "auto") {
      try {
        const result = await runCleanup();
        if (!isMounted) {
          return;
        }
        setLastCleanupRun(new Date().toISOString());
        if (label === "manual") {
          pushToast(
            result.removed
              ? `Cleanup removed ${result.removed} audio files.`
              : "Cleanup ran: nothing to delete.",
            "success"
          );
        }
      }
      catch (error) {
        console.error(error);
        if (label === "manual") {
          pushToast("Cleanup failed, see console for details.", "error");
        }
      }
    }

    run();
    const timer = window.setInterval(() => run(), intervalMs);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [settings?.cleanupIntervalMinutes, setLastCleanupRun]);
}

export async function runCleanupNow() {
  const result = await runCleanup();
  useUIStore.getState().setLastCleanupRun(new Date().toISOString());
  pushToast(
    result.removed
      ? `Cleanup removed ${result.removed} audio files.`
      : "Cleanup ran: nothing to delete.",
    "success"
  );
}
