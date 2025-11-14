import Dexie from "dexie";
import type { Table } from "dexie";
import type {
  AppSettings,
  ChatMessage,
  ChatSession,
  UtteranceRecord,
  VoiceProfile,
  WorkerLog,
} from "../types";
import { defaultSettings, defaultVoiceProfiles } from "./defaults";
import { sha256Hex } from "../lib/helpers";
import { DEFAULT_GEMINI_MODEL } from "../lib/gemini";

export class AppDatabase extends Dexie {
  settings!: Table<AppSettings, number>;
  voices!: Table<VoiceProfile, number>;
  utterances!: Table<UtteranceRecord, number>;
  chats!: Table<ChatMessage, number>;
  workerLogs!: Table<WorkerLog, number>;
  chatSessions!: Table<ChatSession, number>;

  constructor() {
    super("indexed-speech-studio");
    this.version(1).stores({
      settings: "id",
      voices: "++id, name, locale, isDefault",
      utterances: "++id, expiresUtc, createdUtc",
      chats: "++id, sessionId, createdUtc",
      workerLogs: "++id, createdUtc",
    });
    this.version(2).stores({
      settings: "id",
      voices: "++id, name, locale, isDefault",
      utterances: "++id, expiresUtc, createdUtc",
      chats: "++id, sessionId, createdUtc",
      workerLogs: "++id, createdUtc",
      chatSessions: "++id, updatedUtc",
    });
    this.version(3)
      .stores({
        settings: "id",
        voices: "++id, name, locale, isDefault",
        utterances: "++id, expiresUtc, createdUtc",
        chats: "++id, sessionId, createdUtc",
        workerLogs: "++id, createdUtc",
        chatSessions: "++id, updatedUtc",
      })
      .upgrade(async (tx) => {
        const table = tx.table("chatSessions");
        const sessions = await table.toArray();
        for (const session of sessions) {
          const updates: Partial<ChatSession> = {};
          if (!session.sha256) {
            updates.sha256 = await sha256Hex(
              `${session.createdUtc ?? ""}-${session.id ?? ""}-${session.title ?? ""}-${Math.random()}`
            );
          }
          if (Object.keys(updates).length) {
            await table.update(session.id!, updates);
          }
        }
      });
    this.version(4)
      .stores({
        settings: "id",
        voices: "++id, name, locale, isDefault",
        utterances: "++id, expiresUtc, createdUtc",
        chats: "++id, sessionId, createdUtc",
        workerLogs: "++id, createdUtc",
        chatSessions: "++id, updatedUtc",
      })
      .upgrade(async (tx) => {
        const table = tx.table("settings");
        const record = await table.get(1);
        if (record && !record.geminiModel) {
          await table.update(1, { geminiModel: DEFAULT_GEMINI_MODEL });
        }
      });
    this.version(5)
      .stores({
        settings: "id",
        voices: "++id, name, locale, isDefault",
        utterances: "++id, expiresUtc, createdUtc",
        chats: "++id, sessionId, createdUtc",
        workerLogs: "++id, createdUtc",
        chatSessions: "++id, updatedUtc",
      })
      .upgrade(async (tx) => {
        const table = tx.table("chatSessions");
        await table.toCollection().modify((session: ChatSession) => {
          if (typeof session.goalPersona === "undefined") {
            session.goalPersona = "";
          }
          if (typeof session.customConstraints === "undefined") {
            session.customConstraints = "";
          }
        });
      });
    this.version(6)
      .stores({
        settings: "id",
        voices: "++id, name, locale, isDefault",
        utterances: "++id, expiresUtc, createdUtc",
        chats: "++id, sessionId, createdUtc",
        workerLogs: "++id, createdUtc",
        chatSessions: "++id, updatedUtc",
      })
      .upgrade(async (tx) => {
        const table = tx.table("chatSessions");
        await table.toCollection().modify((session: ChatSession) => {
          if (typeof session.achievementLog === "undefined") {
            session.achievementLog = "";
          }
        });
      });
    this.version(7)
      .stores({
        settings: "id",
        voices: "++id, name, locale, isDefault",
        utterances: "++id, expiresUtc, createdUtc",
        chats: "++id, sessionId, createdUtc",
        workerLogs: "++id, createdUtc",
        chatSessions: "++id, updatedUtc",
      })
      .upgrade(async (tx) => {
        const table = tx.table("settings");
        const record = await table.get(1);
        if (record && typeof record.conversationFontScale === "undefined") {
          await table.update(1, { conversationFontScale: 1 });
        }
      });
  }
}

export const db = new AppDatabase();

async function ensureDefaults() {
  const settings = await db.settings.get(1);
  if (!settings) {
    await db.transaction('rw', db.settings, async () => {
      await db.settings.put(defaultSettings);
    }).catch(error => {
      // 處理可能的資料庫錯誤
      console.error("初始化設定時發生錯誤:", error);
    });
  }
  // const settings = await db.settings.get(1);
  // if (!settings) {
  //   await db.settings.put(defaultSettings);
  // }

  const voiceCount = await db.voices.count();
  if (voiceCount === 0) {
    await db.voices.bulkAdd(defaultVoiceProfiles);
    const allVoices = await db.voices.toArray();
    const defaultVoice = allVoices.find((voice) => voice.isDefault) ?? allVoices[0];
    if (defaultVoice?.id) {
      await db.settings.update(1, { defaultVoiceId: defaultVoice.id });
    }
  }

  const sessionCount = await db.chatSessions.count();
  if (sessionCount === 0) {
    const now = new Date().toISOString();
    await db.chatSessions.add({
      title: "New chat",
      createdUtc: now,
      updatedUtc: now,
      sha256: await sha256Hex(`${now}-${Math.random()}`),
    });
  }
}

void ensureDefaults().catch((error) => {
  console.error("Failed to seed default data", error);
});
