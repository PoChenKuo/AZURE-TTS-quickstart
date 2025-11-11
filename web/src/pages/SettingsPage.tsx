import { GEMINI_MODEL_OPTIONS } from "../lib/gemini";
import {
  SettingsProvider,
  useSettingsContext,
} from "../context/SettingsContext";

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

  return (
    <>
      <section className="card grid">
        <header>
          <h2>Settings</h2>
          <p className="text-muted">
            Keys stay inside IndexedDB. Use the testers to make sure everything works before heading
            back to the conversation view.
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
            <label className="label">Gemini Model</label>
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

      <section className="card grid" style={{ gap: "0.75rem" }}>
        <header>
          <h2>Data Backup</h2>
          <p className="text-muted">
            Export a JSON snapshot of all IndexedDB tables or restore from a previous backup.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportBackup}
            disabled={isExporting}
          >
            {isExporting ? "Exporting…" : "Export backup"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleImportBackupClick}
            disabled={isImporting}
          >
            {isImporting ? "Importing…" : "Import backup"}
          </button>
        </div>
        <p className="text-muted text-sm">
          Importing will overwrite your existing chats, voices, and cached audio. Make sure you
          trust the backup file.
        </p>
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
