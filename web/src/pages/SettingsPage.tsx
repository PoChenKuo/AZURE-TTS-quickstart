import { GEMINI_MODEL_OPTIONS } from "../lib/gemini";
import {
  SettingsProvider,
  useSettingsContext,
} from "../context/SettingsContext";
import { useTranslation } from "react-i18next";

const FONT_SCALE_OPTIONS = [
  { value: 0.9, labelKey: "settings.fontScaleOptions.compact" },
  { value: 1, labelKey: "settings.fontScaleOptions.comfortable" },
  { value: 1.15, labelKey: "settings.fontScaleOptions.relaxed" },
  { value: 1.3, labelKey: "settings.fontScaleOptions.large" },
];

// Presentation-only shell; actual settings logic lives in SettingsContext.
function SettingsPage() {
  return (
    <SettingsProvider>
      <SettingsSurface />
    </SettingsProvider>
  );
}

function SettingsSurface() {
  const {
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
  } = useSettingsContext();
  const { t } = useTranslation();

  return (
    <>
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
              onChange={(e) => handleChange("speechKey", e.target.value)}
            />
          </div>

          <div className="grid" style={{ gap: "0.4rem" }}>
            <label className="label">{t("settings.azureEndpoint")}</label>
            <input
              className="input"
              type="text"
              placeholder={t("settings.azureEndpointPlaceholder")}
              value={form.endpoint}
              onChange={(e) => handleChange("endpoint", e.target.value)}
            />
          </div>

          <div className="grid" style={{ gap: "0.4rem" }}>
            <label className="label">{t("settings.azureRegion")}</label>
            <input
              className="input"
              type="text"
              placeholder={t("settings.azureRegionPlaceholder")}
              value={form.region}
              onChange={(e) => handleChange("region", e.target.value)}
            />
          </div>

          <div className="grid" style={{ gap: "0.4rem" }}>
            <label className="label">{t("settings.geminiKey")}</label>
            <input
              className="input"
              type="password"
              placeholder={t("settings.geminiKeyPlaceholder")}
              value={form.geminiKey}
              onChange={(e) => handleChange("geminiKey", e.target.value)}
            />
          </div>

          <div className="grid" style={{ gap: "0.4rem" }}>
            <label className="label">{t("settings.geminiModel")}</label>
            <select
              className="input"
              value={form.geminiModel}
              onChange={(e) => handleChange("geminiModel", e.target.value)}
            >
              {GEMINI_MODEL_OPTIONS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-muted text-sm">{selectedGeminiModel.description}</p>
          </div>

          <div className="grid" style={{ gap: "0.4rem" }}>
            <label className="label">{t("settings.cleanupInterval")}</label>
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
            <label className="label">{t("settings.defaultVoice")}</label>
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
              onChange={(e) =>
                handleChange("conversationFontScale", Number(e.target.value))
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
              onChange={(e) => handleChange("encryptionEnabled", e.target.checked)}
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
              {isTestingAzure ? t("settings.testingAzure") : t("settings.testAzure")}
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

      <section className="card grid" style={{ gap: "0.75rem" }}>
        <header>
          <h2>{t("settings.backup.title")}</h2>
          <p className="text-muted">{t("settings.backup.description")}</p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportBackup}
            disabled={isExporting}
          >
            {isExporting
              ? t("settings.backup.exporting")
              : t("settings.backup.export")}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleImportBackupClick}
            disabled={isImporting}
          >
            {isImporting
              ? t("settings.backup.importing")
              : t("settings.backup.import")}
          </button>
        </div>
        <p className="text-muted text-sm">{t("settings.backup.warning")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleImportFile}
        />
      </section>
    </>
  );
}

export default SettingsPage;
