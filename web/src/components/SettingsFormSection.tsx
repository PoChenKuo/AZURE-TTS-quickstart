import { useTranslation } from "react-i18next";
import { GEMINI_MODEL_OPTIONS } from "../lib/gemini";
import { useSettingsContext } from "../context/SettingsContext";

const FONT_SCALE_OPTIONS = [
  { value: 0.9, labelKey: "settings.fontScaleOptions.compact" },
  { value: 1, labelKey: "settings.fontScaleOptions.comfortable" },
  { value: 1.15, labelKey: "settings.fontScaleOptions.relaxed" },
  { value: 1.3, labelKey: "settings.fontScaleOptions.large" },
  { value: 1.5, labelKey: "settings.fontScaleOptions.extraLarge" },
  { value: 1.7, labelKey: "settings.fontScaleOptions.huge" },
  { value: 1.9, labelKey: "settings.fontScaleOptions.superHuge" },
  { value: 2.2, labelKey: "settings.fontScaleOptions.extraHuge" },
];

export function SettingsFormSection() {
  const {
    form,
    voices,
    handleChange,
    handleSubmit,
    handleTestAzure,
    handleTestGemini,
    selectedGeminiModel,
    isSaving,
    isTestingAzure,
    isTestingGemini,
  } = useSettingsContext();
  const { t } = useTranslation();

  return (
    <section className="card grid">
      <header>
        <h2>{t("settings.title")}</h2>
        <p className="text-muted">{t("settings.description")}</p>
      </header>

      <form onSubmit={handleSubmit} className="grid" style={{ gap: "1.1rem" }}>
        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.azureSpeechKey")}</label>
          <input
            className="input"
            type="password"
            placeholder={t("settings.azureSpeechKeyPlaceholder")}
            value={form.speechKey}
            onChange={(event) => handleChange("speechKey", event.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.azureEndpoint")}</label>
          <input
            className="input"
            type="text"
            placeholder={t("settings.azureEndpointPlaceholder")}
            value={form.endpoint}
            onChange={(event) => handleChange("endpoint", event.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.azureRegion")}</label>
          <input
            className="input"
            type="text"
            placeholder={t("settings.azureRegionPlaceholder")}
            value={form.region}
            onChange={(event) => handleChange("region", event.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.geminiKey")}</label>
          <input
            className="input"
            type="password"
            placeholder={t("settings.geminiKeyPlaceholder")}
            value={form.geminiKey}
            onChange={(event) => handleChange("geminiKey", event.target.value)}
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.geminiModel")}</label>
          <select
            className="input"
            value={form.geminiModel}
            onChange={(event) => handleChange("geminiModel", event.target.value)}
          >
            {GEMINI_MODEL_OPTIONS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
          <p className="text-muted text-sm">
            {selectedGeminiModel.description}
          </p>
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.cleanupInterval")}</label>
          <input
            className="input"
            type="number"
            min={1}
            max={1440}
            value={form.cleanupIntervalMinutes}
            onChange={(event) =>
              handleChange(
                "cleanupIntervalMinutes",
                Number(event.target.value)
              )
            }
          />
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.defaultVoice")}</label>
          <select
            className="input"
            value={form.defaultVoiceId ?? ""}
            onChange={(event) =>
              handleChange(
                "defaultVoiceId",
                event.target.value ? Number(event.target.value) : undefined
              )
            }
          >
            <option value="">{t("common.default")}</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.locale})
              </option>
            ))}
          </select>
          {!voices.length && (
            <p className="text-muted">{t("settings.voiceHelper")}</p>
          )}
        </div>

        <div className="grid" style={{ gap: "0.4rem" }}>
          <label className="label">{t("settings.conversationFont")}</label>
          <select
            className="input"
            value={form.conversationFontScale.toString()}
            onChange={(event) =>
              handleChange("conversationFontScale", Number(event.target.value))
            }
          >
            {FONT_SCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <p className="text-muted text-sm">
            {t("settings.conversationFontDescription")}
          </p>
        </div>

        <label className="label" style={{ gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={form.encryptionEnabled}
            onChange={(event) =>
              handleChange("encryptionEnabled", event.target.checked)
            }
          />
          {t("settings.encryption")}
        </label>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? t("settings.saving") : t("settings.save")}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleTestAzure}
            disabled={isTestingAzure}
          >
            {isTestingAzure
              ? t("settings.testingAzure")
              : t("settings.testAzure")}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleTestGemini}
            disabled={isTestingGemini}
          >
            {isTestingGemini
              ? t("settings.testingGemini")
              : t("settings.testGemini")}
          </button>
        </div>
      </form>
    </section>
  );
}

