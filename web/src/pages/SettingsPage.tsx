import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSettingsRecord, useVoices } from "../db/hooks";
import { saveSettings, setDefaultVoice } from "../db/actions";
import type { AppSettings } from "../types";
import { pushToast } from "../state/toastStore";
import { callGemini } from "../lib/gemini";
import { synthesizeWithAzure } from "../lib/azureSpeech";
import { createAudioUrl, generateToneWav } from "../lib/audio";

type FormState = {
  speechKey: string;
  endpoint: string;
  region: string;
  geminiKey: string;
  cleanupIntervalMinutes: number;
  encryptionEnabled: boolean;
  defaultVoiceId?: number;
};

const EMPTY_STATE: FormState = {
  speechKey: "",
  endpoint: "",
  region: "",
  geminiKey: "",
  cleanupIntervalMinutes: 5,
  encryptionEnabled: false,
  defaultVoiceId: undefined,
};

function SettingsPage() {
  const settings = useSettingsRecord();
  const voices = useVoices() ?? [];
  const [form, setForm] = useState<FormState>(EMPTY_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingAzure, setIsTestingAzure] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        speechKey: settings.speechKey ?? "",
        endpoint: settings.endpoint ?? "",
        region: settings.region ?? "",
        geminiKey: settings.geminiKey ?? "",
        cleanupIntervalMinutes: settings.cleanupIntervalMinutes ?? 5,
        encryptionEnabled: settings.encryptionEnabled ?? false,
        defaultVoiceId: settings.defaultVoiceId,
      });
    }
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

  const effectiveSettings: AppSettings = {
    id: 1,
    speechKey: form.speechKey.trim() || undefined,
    endpoint: form.endpoint.trim() || undefined,
    region: form.region.trim() || undefined,
    geminiKey: form.geminiKey.trim() || undefined,
    cleanupIntervalMinutes: form.cleanupIntervalMinutes || 5,
    encryptionEnabled: form.encryptionEnabled,
    defaultVoiceId: form.defaultVoiceId,
    lastVerifiedUtc: settings?.lastVerifiedUtc,
  };

  const handleChange = (
    field: keyof FormState,
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
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to save settings.", "error");
    }
    finally {
      setIsSaving(false);
    }
  }

  async function handleTestAzure() {
    setIsTestingAzure(true);
    try {
      let buffer: ArrayBuffer;
      if (effectiveSettings.endpoint && effectiveSettings.speechKey) {
        buffer = await synthesizeWithAzure("Testing Azure speech output.", effectiveSettings, defaultVoice);
      }
      else {
        buffer = generateToneWav("fallback");
      }
      const url = createAudioUrl(buffer);
      const audio = new Audio(url);
      await audio.play();
      window.setTimeout(() => URL.revokeObjectURL(url), 8_000);
      pushToast("Azure voice test played.", "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Azure test failed. See console for details.", "error");
    }
    finally {
      setIsTestingAzure(false);
    }
  }

  async function handleTestGemini() {
    setIsTestingGemini(true);
    try {
      const result = await callGemini("Say hello from Gemini.", effectiveSettings);
      pushToast(`Gemini replied: ${result.text.slice(0, 60)}...`, "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Gemini test failed.", "error");
    }
    finally {
      setIsTestingGemini(false);
    }
  }

  return (
    <section className="card grid">
      <header>
        <h2>Settings</h2>
        <p className="text-muted">
          Keys stay inside IndexedDB. Use the testers to make sure everything works before heading back to the conversation view.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="grid" style={{ gap: "1.1rem" }}>
        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Azure Speech Key</label>
          <input
            className="input"
            type="password"
            placeholder="Paste your Azure Speech key"
            value={form.speechKey}
            onChange={(e) => handleChange("speechKey", e.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Azure Endpoint URL</label>
          <input
            className="input"
            type="text"
            placeholder="https://<region>.tts.speech.microsoft.com/cognitiveservices/v1"
            value={form.endpoint}
            onChange={(e) => handleChange("endpoint", e.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Azure Region (optional)</label>
          <input
            className="input"
            type="text"
            placeholder="eastus"
            value={form.region}
            onChange={(e) => handleChange("region", e.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Gemini API Key</label>
          <input
            className="input"
            type="password"
            placeholder="Paste your Gemini key"
            value={form.geminiKey}
            onChange={(e) => handleChange("geminiKey", e.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Cleanup Interval (minutes)</label>
          <input
            className="input"
            type="number"
            min={1}
            max={120}
            value={form.cleanupIntervalMinutes}
            onChange={(e) =>
              handleChange("cleanupIntervalMinutes", Number(e.target.value))
            }
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">Default Voice</label>
          <select
            className="input"
            value={form.defaultVoiceId ?? ""}
            onChange={(e) =>
              handleChange(
                "defaultVoiceId",
                e.target.value ? Number(e.target.value) : undefined
              )
            }
          >
            <option value="">Auto-select</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.locale})
              </option>
            ))}
          </select>
          {!voices.length && (
            <p className="text-muted">
              Add a voice in the Voice & Data manager to unlock this selector.
            </p>
          )}
        </div>

        <label className="label" style={{ gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={form.encryptionEnabled}
            onChange={(e) => handleChange("encryptionEnabled", e.target.checked)}
          />
          Enable passphrase encryption (coming soon)
        </label>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleTestAzure}
            disabled={isTestingAzure}
          >
            {isTestingAzure ? "Testing..." : "Test Azure Voice"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleTestGemini}
            disabled={isTestingGemini}
          >
            {isTestingGemini ? "Testing..." : "Test Gemini Ping"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default SettingsPage;
