import type {
  AppSettings,
  ChatMessage,
  ChatSession,
  UtteranceRecord,
  VoiceProfile,
  WorkerLog,
} from "../types";
import { db } from "../db/database";

export type BackupPayload = {
  version: number;
  exportedAt: string;
  settings: AppSettings[];
  voices: VoiceProfile[];
  utterances: UtteranceRecord[];
  chats: ChatMessage[];
  workerLogs: WorkerLog[];
  chatSessions: ChatSession[];
};

export async function exportDatabase(): Promise<BackupPayload> {
  const [settings, voices, utterances, chats, workerLogs, chatSessions] =
    await Promise.all([
      db.settings.toArray(),
      db.voices.toArray(),
      db.utterances.toArray(),
      db.chats.toArray(),
      db.workerLogs.toArray(),
      db.chatSessions.toArray(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    voices,
    utterances,
    chats,
    workerLogs,
    chatSessions,
  };
}

export async function importDatabase(payload: BackupPayload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid backup payload.");
  }

  const transact: any = db.transaction.bind(db);

  await transact(
    "rw",
    db.settings,
    db.voices,
    db.utterances,
    db.chats,
    db.workerLogs,
    db.chatSessions,
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.voices.clear(),
        db.utterances.clear(),
        db.chats.clear(),
        db.workerLogs.clear(),
        db.chatSessions.clear(),
      ]);

      if (payload.settings?.length) {
        await db.settings.bulkPut(payload.settings);
      }
      if (payload.voices?.length) {
        await db.voices.bulkPut(payload.voices);
      }
      if (payload.utterances?.length) {
        await db.utterances.bulkPut(payload.utterances);
      }
      if (payload.chats?.length) {
        await db.chats.bulkPut(payload.chats);
      }
      if (payload.workerLogs?.length) {
        await db.workerLogs.bulkPut(payload.workerLogs);
      }
      if (payload.chatSessions?.length) {
        await db.chatSessions.bulkPut(payload.chatSessions);
      }
    }
  );
}
