import { useEffect, useState } from "react";
import type { ChatSession } from "../types";
import { createChatSession } from "../db/actions";

// Keeps the current tab tied to a valid chat session, creating the first one on demand.
export function useChatSessionSelection(sessions?: ChatSession[]) {
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (!sessions) {
      return;
    }

    // First time through: ensure at least one session exists so the UI has something to select.
    if (!bootstrapped) {
      if (sessions.length === 0) {
        if (!initializing) {
          setInitializing(true);
          void createChatSession()
            .then((id) => {
              setActiveSessionId(id);
              setBootstrapped(true);
            })
            .finally(() => setInitializing(false));
        }
        return;
      }
      setBootstrapped(true);
    }

    if (sessions.length === 0) {
      setActiveSessionId(null);
      return;
    }

    // If the stored ID is missing/deleted, fall back to the freshest session.
    if (
      activeSessionId == null ||
      !sessions.some((session) => session.id === activeSessionId)
    ) {
      setActiveSessionId(sessions[0]?.id ?? null);
    }
  }, [sessions, activeSessionId, bootstrapped, initializing]);

  return { activeSessionId, setActiveSessionId };
}
