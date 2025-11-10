import type {
  AppSettings,
  ChatMessage,
  UtteranceRecord,
  VoiceProfile,
} from "../types";
import { db } from "./database";
import { pushToast } from "../state/toastStore";
import { sha256Hex } from "../lib/helpers";

export async function saveSettings(update: Partial<AppSettings>) {
  await db.settings.put({
    id: 1,
    cleanupIntervalMinutes: 5,
    encryptionEnabled: false,
    ...update,
  });
}

export async function upsertVoice(voice: VoiceProfile) {
  if (voice.id) {
    await db.voices.update(voice.id, voice);
  }
  else {
    await db.voices.add(voice);
  }
}

export async function deleteVoice(id: number) {
  const settings = await db.settings.get(1);
  await db.voices.delete(id);
  if (settings?.defaultVoiceId === id) {
    await db.settings.update(1, { defaultVoiceId: undefined });
    pushToast("Default voice removed, please pick another.", "info");
  }
}

export async function setDefaultVoice(id: number) {
  const voices = await db.voices.toArray();
  await Promise.all(
    voices.map((voice) =>
      db.voices.update(voice.id!, { isDefault: voice.id === id })
    )
  );
  await db.settings.update(1, { defaultVoiceId: id });
}

export async function addChatMessage(message: ChatMessage) {
  const id = await db.chats.add(message);
  await db.chatSessions.update(message.sessionId, {
    updatedUtc: message.createdUtc,
  });

  if (message.role === "user") {
    const session = await db.chatSessions.get(message.sessionId);
    if (session && (!session.title || session.title === "New chat")) {
      const snippet = buildTitleFromText(message.content);
      await db.chatSessions.update(session.id!, {
        title: snippet,
        updatedUtc: message.createdUtc,
      });
    }
  }

  return id;
}

export async function linkChatToUtterance(
  chatId: number,
  utteranceId: number
) {
  await db.chats.update(chatId, { linkedUtteranceId: utteranceId });
}

export async function storeUtterance(record: UtteranceRecord) {
  return db.utterances.add(record);
}

export async function deleteUtterance(id: number) {
  await db.utterances.delete(id);
}

export async function deleteChatAudio(chatId: number) {
  const message = await db.chats.get(chatId);
  if (!message?.linkedUtteranceId) {
    return false;
  }
  const utteranceId = message.linkedUtteranceId;
  await db.transaction("rw", db.chats, db.utterances, async () => {
    await db.chats.update(chatId, { linkedUtteranceId: undefined });
    await db.utterances.delete(utteranceId);
  });
  return true;
}

export async function deleteChatMessage(id: number) {
  const message = await db.chats.get(id);
  if (!message) {
    return false;
  }
  await db.transaction("rw", db.chats, db.utterances, db.chatSessions, async () => {
    await db.chats.delete(id);
    if (message.linkedUtteranceId) {
      await db.utterances.delete(message.linkedUtteranceId);
    }
    await db.chatSessions.update(message.sessionId, {
      updatedUtc: new Date().toISOString(),
    });
  });
  return true;
}

export async function logWorkerMessage(message: {
  worker?: "cleanup" | "system";
  level?: "info" | "warn" | "error";
  text: string;
}) {
  await db.workerLogs.add({
    worker: message.worker ?? "system",
    level: message.level ?? "info",
    message: message.text,
    createdUtc: new Date().toISOString(),
  });
}

export async function createChatSession(title = "New chat") {
  const now = new Date().toISOString();
  const sha256 = await sha256Hex(`${title}-${now}-${Math.random()}`);
  return db.chatSessions.add({
    title,
    createdUtc: now,
    updatedUtc: now,
    sha256,
  });
}

export async function renameChatSession(id: number, title: string) {
  await db.chatSessions.update(id, {
    title,
    updatedUtc: new Date().toISOString(),
  });
}

export async function updateChatSessionDetails(
  id: number,
  details: {
    goalPersona?: string;
    customConstraints?: string;
    achievementLog?: string;
  }
) {
  await db.chatSessions.update(id, {
    ...details,
    updatedUtc: new Date().toISOString(),
  });
}

export async function deleteChatSession(id: number) {
  const messages = await db.chats.where("sessionId").equals(id).toArray();
  const utteranceIds = messages
    .map((message) => message.linkedUtteranceId)
    .filter((value): value is number => Boolean(value));
  await db.transaction("rw", db.chatSessions, db.chats, db.utterances, async () => {
    await db.chatSessions.delete(id);
    await db.chats.where("sessionId").equals(id).delete();
    if (utteranceIds.length) {
      await Promise.all(utteranceIds.map((utteranceId) => db.utterances.delete(utteranceId)));
    }
  });
}

export async function saveSessionGeminiCache(
  sessionId: number,
  payload?: string | null
) {
  await db.chatSessions.update(sessionId, {
    geminiCache: payload ?? undefined,
  });
}

function buildTitleFromText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return "New chat";
  }
  const maxLength = 40;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}
