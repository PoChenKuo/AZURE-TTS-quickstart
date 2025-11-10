import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, ChatSession, VoiceProfile, AppSettings } from "../types";
import { pushToast } from "../state/toastStore";
import {
  addChatMessage,
  linkChatToUtterance,
  saveSessionGeminiCache,
  storeUtterance,
} from "../db/actions";
import { synthesizeAssistantSpeech } from "../lib/synthesizeAssistantSpeech";
import { hashText, minutesToMs } from "../lib/helpers";
import { callGemini, type GeminiCallOptions } from "../lib/gemini";
import {
  type SessionGeminiCacheState,
  serializeSessionGeminiCacheState,
} from "../lib/geminiCache";
import {
  CACHE_TTL_SECONDS,
  fingerprintHistory,
  partitionHistoryForCache,
} from "../lib/conversationHistory";

type SendPayload = {
  text: string;
  sessionId: number;
};

type UseConversationMutationArgs = {
  settings?: AppSettings;
  messages: ChatMessage[];
  sessionCacheState?: SessionGeminiCacheState;
  activeSession?: ChatSession;
  defaultVoice?: VoiceProfile;
  onSuccess?: () => void;
};

type CacheContext = {
  cachedHistory: ChatMessage[];
  recentHistory: ChatMessage[];
  fingerprint?: string;
  shouldReuse: boolean;
  options?: GeminiCallOptions;
};

// Handles sending a prompt, reusing/refreshing Gemini caches, and persisting audio + metadata.
export function useConversationMutation({
  settings,
  messages,
  sessionCacheState,
  activeSession,
  defaultVoice,
  onSuccess,
}: UseConversationMutationArgs) {
  return useMutation({
    mutationFn: async ({ text, sessionId }: SendPayload) => {
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error("Message is empty.");
      }
      if (!settings?.geminiKey) {
        throw new Error("Add a Gemini key in Settings first.");
      }

      const preparedSettings = normalizeSettings(settings);
      const userEntry = await recordUserMessage(sessionId, trimmed);
      const cacheContext = buildCacheContext(
        messages,
        sessionCacheState,
        activeSession,
        sessionId
      );
      const { reply, meta } = await getAssistantReply({
        prompt: trimmed,
        settings: preparedSettings,
        userEntry,
        sessionId,
        cacheContext,
        sessionCacheState,
      });
      const assistantId = await addChatMessage({
        sessionId,
        role: "assistant",
        content: reply,
        createdUtc: new Date().toISOString(),
        geminiMeta: meta,
      });
      await persistAssistantAudio({
        reply,
        preparedSettings,
        defaultVoice,
        assistantId,
        requestId: meta?.requestId,
      });
    },
    onSuccess,
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to send message.";
      pushToast(message, "error");
    },
  });
}

function normalizeSettings(settings: AppSettings) {
  return {
    ...settings,
    speechKey: settings.speechKey ?? undefined,
    endpoint: settings.endpoint ?? undefined,
  };
}

async function recordUserMessage(sessionId: number, text: string) {
  const entry: ChatMessage = {
    sessionId,
    role: "user",
    content: text,
    createdUtc: new Date().toISOString(),
  };
  await addChatMessage(entry);
  return entry;
}

function buildCacheContext(
  messages: ChatMessage[],
  sessionCacheState: SessionGeminiCacheState | undefined,
  activeSession: ChatSession | undefined,
  sessionId: number
): CacheContext {
  const { cachedHistory, recentHistory } = partitionHistoryForCache(messages);
  const fingerprint = cachedHistory.length
    ? fingerprintHistory(cachedHistory)
    : undefined;
  const shouldReuse =
    Boolean(fingerprint) &&
    Boolean(sessionCacheState && sessionCacheState.hash === fingerprint);

  const options: GeminiCallOptions | undefined =
    fingerprint && cachedHistory.length
      ? {
          cachedHistory,
          cachedContentName: shouldReuse ? sessionCacheState?.name : undefined,
          cacheDisplayName: activeSession?.sha256
            ? `chat-${activeSession.sha256.slice(0, 8)}`
            : `chat-${sessionId}`,
          cacheTtlSeconds: CACHE_TTL_SECONDS,
        }
      : undefined;

  return {
    cachedHistory,
    recentHistory,
    fingerprint,
    shouldReuse,
    options,
  };
}

async function getAssistantReply({
  prompt,
  settings,
  userEntry,
  sessionId,
  cacheContext,
  sessionCacheState,
}: {
  prompt: string;
  settings: AppSettings;
  userEntry: ChatMessage;
  sessionId: number;
  cacheContext: CacheContext;
  sessionCacheState?: SessionGeminiCacheState;
}) {
  const liveHistory = [...cacheContext.recentHistory, userEntry];
  try {
    const result = await callGemini(
      prompt,
      settings,
      liveHistory,
      cacheContext.options
    );
    await persistCacheState({
      sessionId,
      cacheContext,
      sessionCacheState,
      nextCacheName: result.cachedContentName,
    });
    return {
      reply: result.text,
      meta: {
        model: result.model,
        tokens: result.tokens,
        requestId: result.requestId ?? undefined,
      },
    };
  }
  catch (error) {
    console.error(error);
    if (
      cacheContext.fingerprint &&
      cacheContext.shouldReuse &&
      sessionCacheState
    ) {
      await saveSessionGeminiCache(sessionId);
    }
    return {
      reply: "Gemini request failed. Check your API key and network.",
      meta: undefined,
    };
  }
}

async function persistCacheState({
  sessionId,
  cacheContext,
  sessionCacheState,
  nextCacheName,
}: {
  sessionId: number;
  cacheContext: CacheContext;
  sessionCacheState?: SessionGeminiCacheState;
  nextCacheName?: string | null;
}) {
  const { fingerprint, shouldReuse } = cacheContext;
  if (!fingerprint) {
    return;
  }

  if (nextCacheName) {
    const shouldPersist =
      !sessionCacheState ||
      sessionCacheState.hash !== fingerprint ||
      sessionCacheState.name !== nextCacheName;
    if (shouldPersist) {
      await saveSessionGeminiCache(
        sessionId,
        serializeSessionGeminiCacheState({
          name: nextCacheName,
          hash: fingerprint,
        })
      );
    }
    return;
  }

  if (shouldReuse && sessionCacheState) {
    await saveSessionGeminiCache(sessionId);
  }
}

async function persistAssistantAudio({
  reply,
  preparedSettings,
  defaultVoice,
  assistantId,
  requestId,
}: {
  reply: string;
  preparedSettings: AppSettings;
  defaultVoice?: VoiceProfile;
  assistantId: number;
  requestId?: string | null;
}) {
  try {
    const buffer = await synthesizeAssistantSpeech(
      reply,
      preparedSettings,
      defaultVoice
    );
    const expiresUtc = new Date(
      Date.now() + minutesToMs((preparedSettings.cleanupIntervalMinutes ?? 5) * 3)
    ).toISOString();
    const utteranceId = await storeUtterance({
      textHash: hashText(reply),
      text: reply,
      voiceId: defaultVoice?.id,
      audioBlob: buffer,
      size: buffer.byteLength,
      createdUtc: new Date().toISOString(),
      expiresUtc,
      source: "gemini",
      geminiRequestId: requestId ?? undefined,
    });
    await linkChatToUtterance(assistantId, utteranceId);
  }
  catch (error) {
    console.error(error);
    pushToast("Stored the response but audio generation failed.", "error");
  }
}
