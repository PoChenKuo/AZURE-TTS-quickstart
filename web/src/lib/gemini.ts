import type { AppSettings, ChatMessage } from "../types";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";
const DEFAULT_CACHE_TTL_SECONDS = 60 * 60; // 1 hour

export type GeminiResult = {
  text: string;
  model?: string;
  tokens?: number;
  requestId?: string | null;
  cachedContentName?: string;
};

export type GeminiCallOptions = {
  cachedHistory?: ChatMessage[];
  cachedContentName?: string;
  cacheDisplayName?: string;
  cacheTtlSeconds?: number;
};

export async function callGemini(
  prompt: string,
  settings: AppSettings,
  history: ChatMessage[] = [],
  options?: GeminiCallOptions
): Promise<GeminiResult> {
  if (!settings.geminiKey) {
    throw new Error("Missing Gemini API key in Settings.");
  }
  const ai = new GoogleGenAI({
    apiKey: settings.geminiKey,
  });

  const cachedHistory = options?.cachedHistory ?? [];
  const cacheTtlSeconds =
    options?.cacheTtlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;
  const requestContents = [
    ...toContentList(history)
  ];

  const createCache = async () => {
    // Cache only the reusable prefix once, letting future calls reference it by name.
    const response = await ai.caches.create({
      model: MODEL_NAME,
      config: {
        contents: toContentList(cachedHistory),
        displayName: options?.cacheDisplayName ?? "conversation-cache",
        ttl: `${cacheTtlSeconds}s`,
      },
    });
    return response?.name;
  };

  const sendRequest = async (cacheName?: string) => {
    console.log(cacheName);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: requestContents,
      config: cacheName ? { cachedContent: cacheName } : undefined,
    });
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }
    return {
      text,
      model: response?.modelVersion,
      tokens: response?.usageMetadata?.totalTokenCount,
      requestId: response.responseId,
      cachedContentName: cacheName,
    };
  };

  let cachedContentName = options?.cachedContentName;
  if (!cachedContentName && cachedHistory.length) {
    cachedContentName = await createCache().catch((error) => {
      console.warn("Failed to create Gemini cache", error);
      return undefined;
    });
  }

  try {
    return await sendRequest(cachedContentName);
  }
  catch (error) {
    if (cachedHistory.length && isInvalidCacheError(error)) {
      // Gemini evicted/expired the cache: rebuild it once, then retry transparently.
      const freshCache = await createCache().catch((cacheError) => {
        console.warn("Failed to refresh Gemini cache", cacheError);
        return undefined;
      });
      return await sendRequest(freshCache);
    }
    throw error;
  }
}

function toContentList(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: normalizeRole(msg.role),
    parts: [{ text: msg.content }],
  }));
}

function normalizeRole(role: string) {
  if (role === "assistant") {
    return "model";
  }
  if (role === "system") {
    return "user";
  }
  return role;
}

type MaybeApiError = {
  status?: number;
  message?: string;
  name?: string;
};

function isInvalidCacheError(error: unknown) {
  const maybe = error as MaybeApiError;
  if (!maybe || typeof maybe !== "object") {
    return false;
  }
  if (maybe.name !== "ApiError" && maybe.name !== "Error") {
    return false;
  }
  const status = typeof maybe.status === "number" ? maybe.status : undefined;
  if (status === 404) {
    return true;
  }
  if (status === 400 && maybe.message && /cache/i.test(maybe.message)) {
    return true;
  }
  return false;
}
