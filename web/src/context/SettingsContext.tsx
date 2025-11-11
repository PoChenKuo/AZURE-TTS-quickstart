import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useSettingsRecord, useVoices } from "../db/hooks";
import { saveSettings, setDefaultVoice } from "../db/actions";
import type { AppSettings, VoiceProfile } from "../types";
import { pushToast } from "../state/toastStore";
import {
  callGemini,
  GEMINI_MODEL_OPTIONS,
  DEFAULT_GEMINI_MODEL,
} from "../lib/gemini";
import { synthesizeWithAzure } from "../lib/azureSpeech";
import { createAudioUrl, generateToneWav } from "../lib/audio";
import { exportDatabase, importDatabase } from "../lib/dataBackup";
import { uploadBackupToDrive } from "../lib/googleDrive";

export type SettingsFormState = {
  speechKey: string;
  endpoint: string;
  region: string;
  geminiKey: string;
  geminiModel: string;
  cleanupIntervalMinutes: number;
  encryptionEnabled: boolean;
  defaultVoiceId?: number;
  conversationFontScale: number;
};

const EMPTY_STATE: SettingsFormState = {
  speechKey: "",
  endpoint: "",
  region: "",
  geminiKey: "",
  geminiModel: DEFAULT_GEMINI_MODEL,
  cleanupIntervalMinutes: 5,
  encryptionEnabled: false,
  defaultVoiceId: undefined,
  conversationFontScale: 1,
};

type SettingsContextValue = {
  form: SettingsFormState;
  voices: VoiceProfile[];
  handleChange: (
    field: keyof SettingsFormState,
    value: string | number | boolean | undefined
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleTestAzure: () => Promise<void>;
  handleTestGemini: () => Promise<void>;
  handleExportBackup: () => Promise<void>;
  handleImportBackupClick: () => void;
  handleImportFile: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  selectedGeminiModel: (typeof GEMINI_MODEL_OPTIONS)[number];
  isSaving: boolean;
  isTestingAzure: boolean;
  isTestingGemini: boolean;
  isExporting: boolean;
  isImporting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettingsRecord();
  const voices = useVoices() ?? [];
  const [form, setForm] = useState<SettingsFormState>(EMPTY_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAzure, setIsTestingAzure] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!settings) {
      return;
    }
    setForm({
      speechKey: settings.speechKey ?? "",
      endpoint: settings.endpoint ?? "",
      region: settings.region ?? "",
      geminiKey: settings.geminiKey ?? "",
      geminiModel: settings.geminiModel ?? DEFAULT_GEMINI_MODEL,
      cleanupIntervalMinutes: settings.cleanupIntervalMinutes ?? 5,
      encryptionEnabled: settings.encryptionEnabled ?? false,
      defaultVoiceId: settings.defaultVoiceId,
      conversationFontScale: settings.conversationFontScale ?? 1,
    });
  }, [settings]);

  const defaultVoice = useMemo(() => {
    if (!voices.length) {
      return undefined;
    }
    if (form.defaultVoiceId) {
      return voices.find((voice) => voice.id === form.defaultVoiceId) ?? voices[0];
    }
    return voices.find((voice) => voice.isDefault) ?? voices[0];
  }, [voices, form.defaultVoiceId]);

  const selectedGeminiModel = useMemo(() => {
    return (
      GEMINI_MODEL_OPTIONS.find((model) => model.id === form.geminiModel) ??
      GEMINI_MODEL_OPTIONS[0]
    );
  }, [form.geminiModel]);

  const effectiveSettings: AppSettings = {
    id: 1,
    speechKey: form.speechKey.trim() || undefined,
    endpoint: form.endpoint.trim() || undefined,
    region: form.region.trim() || undefined,
    geminiKey: form.geminiKey.trim() || undefined,
    geminiModel: form.geminiModel || DEFAULT_GEMINI_MODEL,
    cleanupIntervalMinutes: form.cleanupIntervalMinutes || 5,
    encryptionEnabled: form.encryptionEnabled,
    defaultVoiceId: form.defaultVoiceId,
    lastVerifiedUtc: settings?.lastVerifiedUtc,
    conversationFontScale: form.conversationFontScale || 1,
  };

  const handleChange = (
    field: keyof SettingsFormState,
    value: string | number | boolean | undefined
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      await saveSettings(effectiveSettings);
      if (effectiveSettings.defaultVoiceId) {
        await setDefaultVoice(effectiveSettings.defaultVoiceId);
      }
      pushToast("Settings saved.", "success");
    } catch (error) {
      console.error(error);
      pushToast("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestAzure() {
    setIsTestingAzure(true);
    try {
      let buffer: ArrayBuffer;
      if (effectiveSettings.endpoint && effectiveSettings.speechKey) {
        buffer = await synthesizeWithAzure(
          "Testing Azure speech output.",
          effectiveSettings,
          defaultVoice
        );
      } else {
        buffer = generateToneWav("fallback");
      }
      const url = createAudioUrl(buffer);
      const audio = new Audio(url);
      await audio.play();
      window.setTimeout(() => URL.revokeObjectURL(url), 8_000);
      pushToast("Azure voice test played.", "success");
    } catch (error) {
      console.error(error);
      pushToast("Azure test failed. See console for details.", "error");
    } finally {
      setIsTestingAzure(false);
    }
  }

  async function handleTestGemini() {
    setIsTestingGemini(true);
    try {
      const result = await callGemini(
        "Say hello from Gemini.",
        effectiveSettings,
        [],
        undefined,
        form.geminiModel || DEFAULT_GEMINI_MODEL
      );
      pushToast(`Gemini replied: ${result.text.slice(0, 60)}...`, "success");
    } catch (error) {
      console.error(error);
      pushToast("Gemini test failed.", "error");
    } finally {
      setIsTestingGemini(false);
    }
  }

  async function handleExportBackup() {
    setIsExporting(true);
    const filename = `IndexedSpeech-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")}.json`;
    try {
      const snapshot = await exportDatabase();
      const uploaded = await tryUploadToDrive(filename, snapshot);
      if (!uploaded) {
        downloadSnapshot(snapshot, filename);
        pushToast("Exported backup locally.", "success");
      }
    } catch (error) {
      console.error(error);
      pushToast("Failed to export backup.", "error");
    } finally {
      setIsExporting(false);
    }
  }

  function handleImportBackupClick() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (!window.confirm("Importing will overwrite existing data. Continue?")) {
      return;
    }
    setIsImporting(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importDatabase(payload);
      pushToast("Imported backup.", "success");
    } catch (error) {
      console.error(error);
      pushToast("Failed to import backup.", "error");
    } finally {
      setIsImporting(false);
    }
  }

  function downloadSnapshot(snapshot: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function tryUploadToDrive(filename: string, snapshot: unknown) {
    try {
      await uploadBackupToDrive(filename, snapshot);
      pushToast("Uploaded backup to Google Drive.", "success");
      return true;
    } catch (error) {
      console.warn("Drive upload failed; falling back to download.", error);
      pushToast("Drive upload failed. Downloading instead.", "info");
      return false;
    }
  }

  const value: SettingsContextValue = {
    form,
    voices,
    handleChange,
    handleSubmit,
    handleTestAzure,
    handleTestGemini,
    handleExportBackup,
    handleImportBackupClick,
    handleImportFile,
    selectedGeminiModel,
    isSaving,
    isTestingAzure,
    isTestingGemini,
    isExporting,
    isImporting,
    fileInputRef,
  };

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}
