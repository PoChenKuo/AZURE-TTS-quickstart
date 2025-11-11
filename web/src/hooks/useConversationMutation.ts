import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, ChatSession, VoiceProfile, AppSettings } from "../types";
import { pushToast } from "../state/toastStore";
import { addChatMessage, saveSessionGeminiCache } from "../db/actions";
import {
  callGemini,
  type GeminiCallOptions,
  DEFAULT_GEMINI_MODEL,
} from "../lib/gemini";
import { buildSystemPrompt } from "../lib/systemPrompt";
import {
  type SessionGeminiCacheState,
  serializeSessionGeminiCacheState,
} from "../lib/geminiCache";
import {
  CACHE_TTL_SECONDS,
  fingerprintHistory,
  partitionHistoryForCache,
} from "../lib/conversationHistory";
import { synthesizeAndStoreAssistantAudio } from "../lib/assistantAudio";

type SendPayload = {
  text: string;
  sessionId: number;
  existingUserEntry?: ChatMessage;
  historyOverride?: ChatMessage[];
};

type UseConversationMutationArgs = {
  settings?: AppSettings;
  messages: ChatMessage[];
  sessionCacheState?: SessionGeminiCacheState;
  activeSession?: ChatSession;
  defaultVoice?: VoiceProfile;
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
}: UseConversationMutationArgs) {
  return useMutation({
    mutationFn: async ({
      text,
      sessionId,
      existingUserEntry,
      historyOverride,
    }: SendPayload) => {
      const promptSource = existingUserEntry?.content ?? text;
      const trimmed = promptSource.trim();
      if (!trimmed) {
        throw new Error("Message is empty.");
      }
      if (!settings?.geminiKey) {
        throw new Error("Add a Gemini key in Settings first.");
      }

      const sessionTarget = existingUserEntry?.sessionId ?? sessionId;
      if (!sessionTarget) {
        throw new Error("No active session for this conversation.");
      }

      const preparedSettings = normalizeSettings(settings);
      const userEntry =
        existingUserEntry ?? (await recordUserMessage(sessionTarget, trimmed));
      const sourceHistory = historyOverride ?? messages;
      const cacheContext = buildCacheContext(
        sourceHistory,
        sessionCacheState,
        activeSession,
        sessionTarget
      );
      const { reply, meta } = await getAssistantReply({
        prompt: trimmed,
        settings: preparedSettings,
        userEntry,
        sessionId: sessionTarget,
        cacheContext,
        sessionCacheState,
        activeSession,
      });
      const assistantId = await addChatMessage({
        sessionId: sessionTarget,
        role: "assistant",
        content: reply,
        createdUtc: new Date().toISOString(),
        geminiMeta: meta,
      });
      try {
        await synthesizeAndStoreAssistantAudio({
          text: reply,
          settings: preparedSettings,
          defaultVoice,
          assistantId,
          requestId: meta?.requestId,
        });
      }
      catch (error) {
        console.error(error);
        pushToast("Stored the response but audio generation failed.", "error");
      }
    },
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
    geminiModel: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
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
  activeSession,
}: {
  prompt: string;
  settings: AppSettings;
  userEntry: ChatMessage;
  sessionId: number;
  cacheContext: CacheContext;
  sessionCacheState?: SessionGeminiCacheState;
  activeSession?: ChatSession;
}) {
  const systemPrompt = buildSystemPrompt(
    activeSession?.goalPersona,
    activeSession?.customConstraints
  );
  const systemMessage = systemPrompt
    ? [
        {
          sessionId,
          role: "system" as const,
          content: systemPrompt,
          createdUtc: new Date().toISOString(),
        } satisfies ChatMessage,
      ]
    : [];
  const liveHistory = [...systemMessage, ...cacheContext.recentHistory, userEntry];
  try {
    const result = await callGemini(
      prompt,
      settings,
      liveHistory,
      cacheContext.options,
      settings.geminiModel
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
