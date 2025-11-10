export type SessionGeminiCacheState = {
  name: string;
  hash: string;
};

export function parseSessionGeminiCacheState(
  rawValue: string | undefined
): SessionGeminiCacheState | undefined {
  if (!rawValue) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(rawValue) as Partial<SessionGeminiCacheState>;
    if (typeof parsed?.name === "string" && typeof parsed?.hash === "string") {
      return { name: parsed.name, hash: parsed.hash };
    }
  }
  catch {
    return undefined;
  }
  return undefined;
}

export function serializeSessionGeminiCacheState(
  state: SessionGeminiCacheState
): string {
  return JSON.stringify(state);
}
