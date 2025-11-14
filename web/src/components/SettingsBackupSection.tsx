import { useTranslation } from "react-i18next";
import { useSettingsContext } from "../context/SettingsContext";

export function SettingsBackupSection() {
  const {
    handleExportBackup,
    handleImportBackupClick,
    handleImportFile,
    isExporting,
    isImporting,
    fileInputRef,
  } = useSettingsContext();
  const { t } = useTranslation();

  return (
    <section className="card grid" style={{ gap: "0.75rem", marginTop: "1.5rem" }}>
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
  );
}

