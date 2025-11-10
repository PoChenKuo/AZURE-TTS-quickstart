import { useLiveQuery } from "dexie-react-hooks";
import type {
  AppSettings,
  ChatMessage,
  ChatSession,
  UtteranceRecord,
  VoiceProfile,
  WorkerLog,
} from "../types";
import { db } from "./database";
import { defaultSettings } from "./defaults";

export function useSettingsRecord(): AppSettings | undefined {
  return useLiveQuery<AppSettings | undefined>(
    async () => {
      const record = await db.settings.get(1);
      if (!record) {
        await db.settings.put(defaultSettings);
        return defaultSettings;
      }
      return record;
    },
    []
  );
}

export function useVoices(): VoiceProfile[] | undefined {
  return useLiveQuery<VoiceProfile[]>(
    () => db.voices.orderBy("name").toArray(),
    []
  );
}

export function useUtterances(limit = 25): UtteranceRecord[] | undefined {
  return useLiveQuery<UtteranceRecord[]>(
    () => db.utterances.orderBy("createdUtc").reverse().limit(limit).toArray(),
    [limit]
  );
}

export function useWorkerLogs(limit = 15): WorkerLog[] | undefined {
  return useLiveQuery<WorkerLog[]>(
    () => db.workerLogs.orderBy("createdUtc").reverse().limit(limit).toArray(),
    [limit]
  );
}

export function useChatMessages(
  sessionId?: number
): ChatMessage[] | undefined {
  return useLiveQuery<ChatMessage[]>(
    () =>
      sessionId == null
        ? []
        : db.chats.where("sessionId").equals(sessionId).sortBy("createdUtc"),
    [sessionId]
  );
}

export function useChatSessions(): ChatSession[] | undefined {
  return useLiveQuery<ChatSession[]>(() =>
    db.chatSessions.orderBy("updatedUtc").reverse().toArray()
  );
}
