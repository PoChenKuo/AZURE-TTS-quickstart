import type { AppSettings, ChatMessage } from "../types";
import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL_OPTIONS = [
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Highest quality responses with tool + multimodal support.",
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Fast, low-latency text model with long context.",
  },
  {
    id: "gemini-2.5-flash-preview-09-2025",
    label: "Gemini 2.5 Flash Preview (Sep 2025)",
    description: "Latest preview of Flash 2.5 tuned for September 2025 release.",
  },
  {
    id: "gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
    description: "Cost-optimized Flash variant for light workloads.",
  },
  {
    id: "gemini-2.5-flash-lite-preview-09-2025",
    label: "Gemini 2.5 Flash Lite Preview (Sep 2025)",
    description: "Preview of the Lite variant tuned for September 2025 release.",
  },
  {
    id: "gemini-2.5-flash-preview-tts",
    label: "Gemini 2.5 Flash Preview TTS",
    description: "Flash preview with built-in text-to-speech capabilities.",
  },
  {
    id: "gemini-2.5-pro-preview-tts",
    label: "Gemini 2.5 Pro Preview TTS",
    description: "Pro preview with text-to-speech support.",
  },
  {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Earlier Flash generation; solid balance of speed and cost.",
  },
] as const;

export type GeminiModelId = (typeof GEMINI_MODEL_OPTIONS)[number]["id"];
export const DEFAULT_GEMINI_MODEL: GeminiModelId =
  GEMINI_MODEL_OPTIONS[0].id;
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
  options?: GeminiCallOptions,
  modelName: string = DEFAULT_GEMINI_MODEL
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
    ...toContentList(history),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const model = modelName || DEFAULT_GEMINI_MODEL;

  const createCache = async () => {
    // Cache only the reusable prefix once, letting future calls reference it by name.
    const response = await ai.caches.create({
      model,
      config: {
        contents: toContentList(cachedHistory),
        displayName: options?.cacheDisplayName ?? "conversation-cache",
        ttl: `${cacheTtlSeconds}s`,
      },
    });
    return response?.name;
  };

  const sendRequest = async (cacheName?: string) => {
    const response = await ai.models.generateContent({
      model,
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
