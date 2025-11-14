import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useWorkerLogs } from "../db/hooks";

export function WorkerLogSection() {
  const workerLogs = useWorkerLogs(12) ?? [];
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { t } = useTranslation();

  return (
    <section className="card grid" style={{ gap: "0.8rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <h2>{t("voice.workerLog")}</h2>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setIsCollapsed((previous) => !previous)}
        >
          {isCollapsed ? "Show" : "Hide"}
        </button>
      </header>

      {!isCollapsed && (
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
      )}
    </section>
  );
}

