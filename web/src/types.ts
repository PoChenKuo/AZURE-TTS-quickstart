export type AppSettings = {
  id: number;
  speechKey?: string;
  endpoint?: string;
  region?: string;
  geminiKey?: string;
  geminiModel?: string;
  cleanupIntervalMinutes: number;
  defaultVoiceId?: number;
  encryptionEnabled: boolean;
  lastVerifiedUtc?: string;
  conversationFontScale?: number;
};

export type VoiceProfile = {
  id?: number;
  name: string;
  locale: string;
  style?: string;
  rate?: number;
  pitch?: number;
  tags?: string[];
  isDefault?: boolean;
  lastUsedUtc?: string;
  azureVoiceId?: string;
};

export type UtteranceRecord = {
  id?: number;
  textHash: string;
  text: string;
  voiceId?: number;
  audioBlob: ArrayBuffer;
  durationMs?: number;
  size: number;
  createdUtc: string;
  expiresUtc: string;
  source: "gemini" | "manual";
  geminiRequestId?: string;
};

export type ChatMessage = {
  id?: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdUtc: string;
  geminiMeta?: {
    model?: string;
    tokens?: number;
    latencyMs?: number;
    requestId?: string;
  };
  linkedUtteranceId?: number;
};

export type WorkerLog = {
  id?: number;
  worker: "cleanup" | "system";
  level: "info" | "warn" | "error";
  message: string;
  createdUtc: string;
};

export type ChatSession = {
  id?: number;
  title: string;
  createdUtc: string;
  updatedUtc: string;
  sha256: string;
  geminiCache?: string;
  goalPersona?: string;
  customConstraints?: string;
  achievementLog?: string;
};
