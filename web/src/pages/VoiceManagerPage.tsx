import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const totalAudioSize = useMemo(() => {
    return utterances.reduce((acc, item) => acc + (item.size || 0), 0);
  }, [utterances]);

  function updateVoiceForm(field: keyof VoiceFormState, value: string) {
    setVoiceForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddVoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!voiceForm.name.trim()) {
      pushToast(t("voice.messages.nameRequired"), "error");
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
      pushToast(t("voice.messages.voiceSaved"), "success");
    }
    catch (error) {
      console.error(error);
      pushToast(t("voice.messages.voiceSaveFailed"), "error");
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
      pushToast(t("voice.messages.setDefaultFirst"), "error");
      return;
    }
    await deleteVoice(voice.id);
    pushToast(t("voice.messages.voiceDeleted", { name: voice.name }), "info");
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
          <h2>{t("voice.voiceLibrary")}</h2>
          <p className="text-muted">{t("voice.voiceLibraryDesc")}</p>
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
                  <td data-label={t("voice.table.name")}>
                    {voice.name}
                    {voice.isDefault && (
                      <span className="pill" style={{ marginLeft: "0.4rem" }}>
                        {t("voice.table.defaultBadge")}
                      </span>
                    )}
                  </td>
                  <td data-label={t("voice.table.locale")}>{voice.locale}</td>
                  <td data-label={t("voice.table.style")}>
                    {voice.style ?? t("voice.messages.defaultStyle")}
                  </td>
                  <td data-label={t("voice.table.voiceId")} className="text-muted">
                    {voice.azureVoiceId ?? t("voice.messages.notAvailable")}
                  </td>
                  <td data-label={t("voice.table.actions")}>
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
                          pushToast(
                            t("voice.messages.defaultSet", { name: voice.name }),
                            "success"
                          );
                        }}
                      >
                        {t("voice.actions.setDefault")}
                      </button>
                      <button
                        className="btn btn-text"
                        type="button"
                        onClick={() => handleDeleteVoice(voice)}
                      >
                        {t("voice.actions.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!voices.length && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    {t("voice.noVoices")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddVoice} className="grid" style={{ gap: "0.8rem" }}>
          <h3>{t("voice.form.title")}</h3>
          <input
            className="input"
            placeholder={t("voice.form.namePlaceholder")}
            value={voiceForm.name}
            onChange={(e) => updateVoiceForm("name", e.target.value)}
          />
          <input
            className="input"
            placeholder={t("voice.form.localePlaceholder")}
            value={voiceForm.locale}
            onChange={(e) => updateVoiceForm("locale", e.target.value)}
          />
          <input
            className="input"
            placeholder={t("voice.form.azureIdPlaceholder")}
            value={voiceForm.azureVoiceId}
            onChange={(e) => updateVoiceForm("azureVoiceId", e.target.value)}
          />
          <input
            className="input"
            placeholder={t("voice.form.stylePlaceholder")}
            value={voiceForm.style}
            onChange={(e) => updateVoiceForm("style", e.target.value)}
          />
          <input
            className="input"
            placeholder={t("voice.form.tagsPlaceholder")}
            value={voiceForm.tags}
            onChange={(e) => updateVoiceForm("tags", e.target.value)}
          />
          <button className="btn btn-primary" type="submit" disabled={isSavingVoice}>
            {isSavingVoice ? t("voice.form.saving") : t("voice.form.save")}
          </button>
        </form>
      </section>

      <section className="card grid" style={{ gap: "1rem" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2>{t("voice.cachedAudio")}</h2>
            <p className="text-muted">
              {t("voice.messages.cachedSummary", {
                count: utterances.length,
                size: formatBytes(totalAudioSize),
              })}
            </p>
          </div>
          <button className="btn btn-secondary" type="button" onClick={handleCleanup} disabled={isCleaning}>
            {isCleaning ? t("voice.messages.cleaning") : t("voice.messages.runCleanup")}
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
                    {t("voice.messages.expiresLabel", {
                      time: new Date(utterance.expiresUtc).toLocaleString(),
                    })}
                  </p>
                  <p className="text-muted" style={{ margin: 0 }}>
                    {t("voice.messages.sizeLabel", {
                      size: formatBytes(utterance.size),
                    })}
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
                    pushToast(t("voice.messages.audioDeleted"), "info");
                  }}
                >
                  {t("voice.actions.delete")}
                </button>
              </div>
              <AudioPreview buffer={utterance.audioBlob} />
            </article>
          ))}
          {!utterances.length && (
            <p className="text-muted">{t("voice.cachedAudioEmpty")}</p>
          )}
        </div>
      </section>

      <section className="card grid" style={{ gap: "0.8rem" }}>
        <h2>{t("voice.workerLog")}</h2>
        <ul className="list-reset" style={{ display: "grid", gap: "0.5rem" }}>
          {workerLogs.map((log) => (
            <li key={log.id} className="text-muted">
              <strong>{log.level.toUpperCase()}</strong> | {log.message} |{" "}
              <span>{new Date(log.createdUtc).toLocaleTimeString()}</span>
            </li>
          ))}
          {!workerLogs.length && (
            <li className="text-muted">{t("voice.noLogs")}</li>
          )}
        </ul>
      </section>
    </div>
  );
}

export default VoiceManagerPage;

