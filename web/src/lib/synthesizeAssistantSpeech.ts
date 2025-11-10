import type { AppSettings, VoiceProfile } from "../types";
import { synthesizeWithAzure } from "./azureSpeech";
import { generateToneWav } from "./audio";
import { sanitizeSpeechText } from "./textSanitizer";

export async function synthesizeAssistantSpeech(
  text: string,
  settings: AppSettings | undefined,
  voice?: VoiceProfile
) {
  const cleanText = sanitizeSpeechText(text);
  if (settings?.endpoint && settings?.speechKey) {
    return synthesizeWithAzure(cleanText, settings, voice);
  }
  return generateToneWav(cleanText);
}
