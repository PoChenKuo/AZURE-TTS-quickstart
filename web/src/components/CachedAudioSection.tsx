import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUtterances } from "../db/hooks";
import { deleteUtterance } from "../db/actions";
import { AudioPreview } from "./AudioPreview";
import { formatBytes } from "../lib/helpers";
import { pushToast } from "../state/toastStore";
import { runCleanupNow } from "../hooks/useCleanupScheduler";

export function CachedAudioSection() {
  const utterances = useUtterances(40) ?? [];
  const [isCleaning, setIsCleaning] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { t } = useTranslation();

  const totalAudioSize = useMemo(() => {
    return utterances.reduce((accumulator, item) => accumulator + (item.size || 0), 0);
  }, [utterances]);

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
        <div>
          <h2>{t("voice.cachedAudio")}</h2>
          <p className="text-muted">
            {t("voice.messages.cachedSummary", {
              count: utterances.length,
              size: formatBytes(totalAudioSize),
            })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={handleCleanup}
            disabled={isCleaning}
          >
            {isCleaning ? t("voice.messages.cleaning") : t("voice.messages.runCleanup")}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => setIsCollapsed((previous) => !previous)}
          >
            {isCollapsed ? "Show" : "Hide"}
          </button>
        </div>
      </header>

      {!isCollapsed && (
        <div className="grid" style={{ gap: "1rem" }}>

          {utterances.map((utterance) => (
            <article
              key={utterance.id}
              className="card"
              style={{ padding: "1rem" }}
            >
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
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {utterance.text.slice(0, 60)}
                    {utterance.text.length > 60 ? "..." : ""}
                  </p>
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
      )}
    </section>
  );
}

