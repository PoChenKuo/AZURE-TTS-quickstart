import type { ChatMessage } from "../types";
import { hashText } from "./helpers";

export const HISTORY_LIMIT = 12;
export const RECENT_HISTORY_WINDOW = 4;
export const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

// Keeps the heavy context small enough for caching while leaving the most recent turns inline.
export function partitionHistoryForCache(messages: ChatMessage[]): {
  cachedHistory: ChatMessage[];
  recentHistory: ChatMessage[];
} {
  const limited = messages.slice(-HISTORY_LIMIT);
  const splitIndex = Math.max(0, limited.length - RECENT_HISTORY_WINDOW);
  return {
    cachedHistory: limited.slice(0, splitIndex),
    recentHistory: limited.slice(splitIndex),
  };
}

// Deterministic hash used to decide whether an existing cached context still applies.
export function fingerprintHistory(messages: ChatMessage[]): string | undefined {
  if (!messages.length) {
    return undefined;
  }
  const serialized = JSON.stringify(
    messages.map((msg) => ({ role: msg.role, content: msg.content }))
  );
  return hashText(serialized);
}
