import type { AppSettings, VoiceProfile } from "../types";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function synthesizeWithAzure(
  text: string,
  settings: AppSettings,
  voice?: VoiceProfile
) {
  if (!settings.endpoint || !settings.speechKey) {
    throw new Error("Missing Azure endpoint or key.");
  }

  const pullStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);
  let speechConfig = sdk.SpeechConfig.fromEndpoint(
    new URL(settings.endpoint),
    settings.speechKey
  );
  const resolvedVoice =
    voice?.azureVoiceId || voice?.name || "zh-TW-HsiaoChenNeural";
  speechConfig.speechSynthesisVoiceName = resolvedVoice;
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  const result: sdk.SpeechSynthesisResult = await new Promise(
    (resolve, reject) => {
      synthesizer.speakTextAsync(
        text,
        (success) => {
          synthesizer.close();
          resolve(success);
        },
        (error) => {
          synthesizer.close();
          reject(error);
        }
      );
    }
  );
  const buffer = result.audioData;
  return buffer;
}
