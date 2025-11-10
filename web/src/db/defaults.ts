import type { AppSettings, VoiceProfile } from "../types";

export const defaultSettings: AppSettings = {
  id: 1,
  cleanupIntervalMinutes: 5,
  encryptionEnabled: false,
};

export const defaultVoiceProfiles: VoiceProfile[] = [
  {
    name: "Jenny Neural",
    locale: "en-US",
    style: "general",
    rate: 1,
    pitch: 0,
    tags: ["default"],
    isDefault: true,
    azureVoiceId: "en-US-JennyNeural",
  },
  {
    name: "Xiaoxiao (zh-CN)",
    locale: "zh-CN",
    style: "general",
    rate: 1,
    pitch: 0,
    tags: ["mandarin"],
    azureVoiceId: "zh-CN-XiaoxiaoNeural",
  },
];
