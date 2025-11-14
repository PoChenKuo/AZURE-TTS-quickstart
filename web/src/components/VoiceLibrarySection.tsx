import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useVoices } from "../db/hooks";
import { deleteVoice, setDefaultVoice, upsertVoice } from "../db/actions";
import { pushToast } from "../state/toastStore";
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

export function VoiceLibrarySection() {
  const voices = useVoices() ?? [];
  const [voiceForm, setVoiceForm] = useState<VoiceFormState>(EMPTY_VOICE_FORM);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { t } = useTranslation();

  function updateVoiceForm(field: keyof VoiceFormState, value: string) {
    setVoiceForm((previous) => ({ ...previous, [field]: value }));
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

  return (
    <section className="card grid" style={{ gap: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ flex: '1 0 0' }}>
          <h2>{t("voice.voiceLibrary")}</h2>
          <p className="text-muted">{t("voice.voiceLibraryDesc")}</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsCollapsed((previous) => !previous)}
        >
          {isCollapsed ? "Show" : "Hide"}
        </button>
      </header>

      {!isCollapsed && (
        <>
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
                        <span
                          className="pill"
                          style={{ marginLeft: "0.4rem" }}
                        >
                          {t("voice.table.defaultBadge")}
                        </span>
                      )}
                    </td>
                    <td data-label={t("voice.table.locale")}>
                      {voice.locale}
                    </td>
                    <td data-label={t("voice.table.style")}>
                      {voice.style ?? t("voice.messages.defaultStyle")}
                    </td>
                    <td
                      data-label={t("voice.table.voiceId")}
                      className="text-muted"
                    >
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
                              t("voice.messages.defaultSet", {
                                name: voice.name,
                              }),
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

          <form
            onSubmit={handleAddVoice}
            className="grid"
            style={{ gap: "0.8rem" }}
          >
            <h3>{t("voice.form.title")}</h3>
            <input
              className="input"
              placeholder={t("voice.form.namePlaceholder")}
              value={voiceForm.name}
              onChange={(event) =>
                updateVoiceForm("name", event.target.value)
              }
            />
            <input
              className="input"
              placeholder={t("voice.form.localePlaceholder")}
              value={voiceForm.locale}
              onChange={(event) =>
                updateVoiceForm("locale", event.target.value)
              }
            />
            <input
              className="input"
              placeholder={t("voice.form.azureIdPlaceholder")}
              value={voiceForm.azureVoiceId}
              onChange={(event) =>
                updateVoiceForm("azureVoiceId", event.target.value)
              }
            />
            <input
              className="input"
              placeholder={t("voice.form.stylePlaceholder")}
              value={voiceForm.style}
              onChange={(event) =>
                updateVoiceForm("style", event.target.value)
              }
            />
            <input
              className="input"
              placeholder={t("voice.form.tagsPlaceholder")}
              value={voiceForm.tags}
              onChange={(event) =>
                updateVoiceForm("tags", event.target.value)
              }
            />
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isSavingVoice}
            >
              {isSavingVoice ? t("voice.form.saving") : t("voice.form.save")}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

