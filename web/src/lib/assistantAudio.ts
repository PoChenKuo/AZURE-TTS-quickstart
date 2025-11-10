import type { AppSettings, VoiceProfile } from "../types";
import { synthesizeAssistantSpeech } from "./synthesizeAssistantSpeech";
import { minutesToMs, hashText } from "./helpers";
import { storeUtterance, linkChatToUtterance } from "../db/actions";
import { getWavDurationMs } from "./audio";

type AssistantAudioArgs = {
  text: string;
  settings: AppSettings;
  defaultVoice?: VoiceProfile;
  assistantId: number;
  requestId?: string | null;
};

export async function synthesizeAndStoreAssistantAudio({
  text,
  settings,
  defaultVoice,
  assistantId,
  requestId,
}: AssistantAudioArgs) {
  const buffer = await synthesizeAssistantSpeech(text, settings, defaultVoice);
  const durationMs = getWavDurationMs(buffer);
  const expiresUtc = new Date(
    Date.now() + minutesToMs((settings.cleanupIntervalMinutes ?? 5) * 3)
  ).toISOString();

  const utteranceId = await storeUtterance({
    textHash: hashText(text),
    text,
    voiceId: defaultVoice?.id,
    audioBlob: buffer,
    durationMs,
    size: buffer.byteLength,
    createdUtc: new Date().toISOString(),
    expiresUtc,
    source: "gemini",
    geminiRequestId: requestId ?? undefined,
  });
  await linkChatToUtterance(assistantId, utteranceId);
  return utteranceId;
}
