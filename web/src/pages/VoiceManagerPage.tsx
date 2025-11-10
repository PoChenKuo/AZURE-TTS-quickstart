import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useVoices, useUtterances, useWorkerLogs } from "../db/hooks";
import {
  deleteUtterance,
  deleteVoice,
  setDefaultVoice,
  upsertVoice,
} from "../db/actions";
import { AudioPreview } from "../components/AudioPreview";
import { formatBytes } from "../lib/helpers";
import { pushToast } from "../state/toastStore";
import { runCleanupNow } from "../hooks/useCleanupScheduler";
import type { VoiceProfile } from "../types";

type VoiceFormState = {
  name: string;
  locale: string;
  azureVoiceId: string;
  style: string;
  tags: string;
};

const EMPTY_VOICE_FORM: VoiceFormState = {
  name: "",
  locale: "en-US",
  azureVoiceId: "",
  style: "general",
  tags: "",
};

function VoiceManagerPage() {
  const voices = useVoices() ?? [];
  const utterances = useUtterances(40) ?? [];
  const workerLogs = useWorkerLogs(12) ?? [];
  const [voiceForm, setVoiceForm] = useState<VoiceFormState>(EMPTY_VOICE_FORM);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const totalAudioSize = useMemo(() => {
    return utterances.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [utterances]);

  function updateVoiceForm(field: keyof VoiceFormState, value: string) {
    setVoiceForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddVoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!voiceForm.name.trim()) {
      pushToast("Voice name is required.", "error");
      return;
    }
    setIsSavingVoice(true);
    const payload: VoiceProfile = {
      name: voiceForm.name.trim(),
      locale: voiceForm.locale.trim(),
      azureVoiceId: voiceForm.azureVoiceId.trim() || undefined,
      style: voiceForm.style.trim() || undefined,
      tags: voiceForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    try {
      await upsertVoice(payload);
      setVoiceForm(EMPTY_VOICE_FORM);
      pushToast("Voice saved.", "success");
    }
    catch (error) {
      console.error(error);
      pushToast("Failed to save voice.", "error");
    }
    finally {
      setIsSavingVoice(false);
    }
  }

  async function handleDeleteVoice(voice: VoiceProfile) {
    if (!voice.id) {
      return;
    }
    if (voice.isDefault) {
      pushToast("Set another default voice first.", "error");
      return;
    }
    await deleteVoice(voice.id);
    pushToast(`Voice "${voice.name}" deleted.`, "info");
  }

  async function handleCleanup() {
    setIsCleaning(true);
    try {
      await runCleanupNow();
    }
    finally {
      setIsCleaning(false);
    }
  }

  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <section className="card grid" style={{ gap: "1rem" }}>
        <header>
          <h2>Voice Library</h2>
          <p className="text-muted">
            Manage the voices available to the conversation view. Import/export support is coming soon.
          </p>
        </header>

        <div className="table-wrapper">
          <table className="table table-mobile-stack">
            <thead>
              <tr>
                <th>Name</th>
                <th>Locale</th>
                <th>Style</th>
                <th>Voice ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {voices.map((voice) => (
                <tr key={voice.id}>
                  <td data-label="Name">
                    {voice.name}
                    {voice.isDefault && (
                      <span className="pill" style={{ marginLeft: "0.4rem" }}>
                        Default
                      </span>
                    )}
                  </td>
                  <td data-label="Locale">{voice.locale}</td>
                  <td data-label="Style">{voice.style ?? "general"}</td>
                  <td data-label="Voice ID" className="text-muted">
                    {voice.azureVoiceId ?? "n/a"}
                  </td>
                  <td data-label="Actions">
                    <div className="table-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        disabled={voice.isDefault}
                        onClick={async () => {
                          if (!voice.id) {
                            return;
                          }
                          await setDefaultVoice(voice.id);
                          pushToast(`"${voice.name}" is now the default voice.`, "success");
                        }}
                      >
                        Set default
                      </button>
                      <button
                        className="btn btn-text"
                        type="button"
                        onClick={() => handleDeleteVoice(voice)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!voices.length && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No voices yet. Use the form below to add your first entry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddVoice} className="grid" style={{ gap: "0.8rem" }}>
          <h3>Add / Edit Voice</h3>
          <input
            className="input"
            placeholder="Voice name"
            value={voiceForm.name}
            onChange={(e) => updateVoiceForm("name", e.target.value)}
          />
          <input
            className="input"
            placeholder="Locale (e.g., en-US)"
            value={voiceForm.locale}
            onChange={(e) => updateVoiceForm("locale", e.target.value)}
          />
          <input
            className="input"
            placeholder="Azure voice ID (optional)"
            value={voiceForm.azureVoiceId}
            onChange={(e) => updateVoiceForm("azureVoiceId", e.target.value)}
          />
          <input
            className="input"
            placeholder="Style (casual, news, general...)"
            value={voiceForm.style}
            onChange={(e) => updateVoiceForm("style", e.target.value)}
          />
          <input
            className="input"
            placeholder="Tags (comma separated)"
            value={voiceForm.tags}
            onChange={(e) => updateVoiceForm("tags", e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={isSavingVoice}>
            {isSavingVoice ? "Saving..." : "Save Voice"}
          </button>
        </form>
      </section>

      <section className="card grid" style={{ gap: "1rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2>Cached Audio</h2>
            <p className="text-muted">
              {utterances.length} clips | {formatBytes(totalAudioSize)}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={handleCleanup} disabled={isCleaning}>
            {isCleaning ? "Cleaning..." : "Run cleanup now"}
          </button>
        </header>

        <div className="grid" style={{ gap: "1rem" }}>
          {utterances.map((utterance) => (
            <article key={utterance.id} className="card" style={{ padding: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{utterance.text.slice(0, 60)}{utterance.text.length > 60 ? "..." : ""}</p>
                  <p className="text-muted" style={{ margin: 0 }}>
                    Expires {new Date(utterance.expiresUtc).toLocaleString()}
                  </p>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {formatBytes(utterance.size)}
                  </p>
                </div>
                <button
                  className="btn btn-text"
                  type="button"
                  onClick={async () => {
                    if (!utterance.id) {
                      return;
                    }
                    await deleteUtterance(utterance.id);
                    pushToast("Deleted audio clip.", "info");
                  }}
                >
                  Delete
                </button>
              </div>
              <AudioPreview buffer={utterance.audioBlob} />
            </article>
          ))}
          {!utterances.length && (
            <p className="text-muted">No cached audio blobs yet--send a Gemini prompt to generate one.</p>
          )}
        </div>
      </section>

      <section className="card grid" style={{ gap: "0.8rem" }}>
        <h2>Worker Log</h2>
        <ul className="list-reset" style={{ display: "grid", gap: "0.5rem" }}>
          {workerLogs.map((log) => (
            <li key={log.id} className="text-muted">
              <strong>{log.level.toUpperCase()}</strong> | {log.message} |{" "}
              <span>{new Date(log.createdUtc).toLocaleTimeString()}</span>
            </li>
          ))}
          {!workerLogs.length && (
            <li className="text-muted">No messages yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default VoiceManagerPage;

