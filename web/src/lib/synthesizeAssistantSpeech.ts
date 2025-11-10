import type { AppSettings, VoiceProfile } from "../types";
import { synthesizeWithAzure } from "./azureSpeech";
import { generateToneWav } from "./audio";

export async function synthesizeAssistantSpeech(
  text: string,
  settings: AppSettings | undefined,
  voice?: VoiceProfile
) {
  if (settings?.endpoint && settings?.speechKey) {
    return synthesizeWithAzure(text, settings, voice);
  }
  return generateToneWav(text);
}
