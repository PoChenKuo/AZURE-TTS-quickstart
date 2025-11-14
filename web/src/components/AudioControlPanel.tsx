import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { useConversationContext } from "../context/ConversationContext";
import "./AudioControlPanel.less";

const PLAYBACK_OPTIONS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5];

export function AudioControlPanel() {
  const {
    audioPanelState,
    playbackRate,
    setPlaybackRate,
    autoPlayAudioRef,
    isAudioPanelCollapsed,
    setAudioPanelCollapsed,
  } = useConversationContext();
  const { t } = useTranslation();
  const { hasSource, isPlaying, currentTime, duration } = audioPanelState;

  const hasActivity =
    hasSource && (isPlaying || (Number.isFinite(currentTime) && currentTime > 0.1));

  if (!hasActivity) {
    return null;
  }
  if (isAudioPanelCollapsed) {
    return (
      <button
        type="button"
        className="audio-panel-toggle z-40"
        onClick={() => setAudioPanelCollapsed(false)}
      >
        {t("audioPanel.show")}
      </button>
    );
  }

  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : undefined;

  const handleToggle = () => {
    const element = autoPlayAudioRef.current;
    if (!element) {
      return;
    }
    if (isPlaying) {
      element.pause();
      return;
    }
    element
      .play()
      .then(() => undefined)
      .catch(() => {
        /* ignore autoplay restrictions */
      });
  };

  const handleSeek = (value: number) => {
    if (!safeDuration) {
      return;
    }
    const element = autoPlayAudioRef.current;
    if (!element) {
      return;
    }
    const clamped = Math.min(Math.max(value, 0), safeDuration);
    element.currentTime = clamped;
  };

  const handleRateChange = (value: number) => {
    setPlaybackRate(value);
  };

  return (
    <div
      className="audio-control-panel z-40"
      role="group"
      aria-label={t("audioPanel.nowPlaying")}
    >
      <button
        type="button"
        className={clsx(
          "audio-control-button",
          isPlaying ? "audio-control-button--active" : undefined
        )}
        onClick={handleToggle}
        aria-label={isPlaying ? t("audioPanel.pause") : t("audioPanel.play")}
      >
        {isPlaying ? "||" : "▶"}
      </button>
      <button
        type="button"
        className="audio-control-panel__collapse"
        onClick={() => setAudioPanelCollapsed(true)}
        aria-label={t("audioPanel.hide")}
      >
        HIDE
      </button>
      <div className="audio-control-panel__progress">
        {/* <div className="audio-control-panel__label">
          {t("audioPanel.nowPlaying")}
        </div> */}
        <input
          type="range"
          className="audio-progress-slider"
          min={0}
          max={safeDuration ?? 1}
          step="0.1"
          value={
            safeDuration ? Math.min(currentTime, safeDuration) : 0
          }
          onChange={(event) => handleSeek(Number(event.target.value))}
          disabled={!safeDuration}
        />
        <div className="audio-control-panel__time">
          <span>{formatTimestamp(currentTime)}</span>
          <span>{safeDuration ? formatTimestamp(safeDuration) : "0:00"}</span>
        </div>
      </div>
      <label className="audio-control-panel__rate">
        <span>{t("audioPanel.rate")}</span>
        <select
          className="audio-control-panel__rate-select"
          value={playbackRate}
          onChange={(event) => handleRateChange(Number(event.target.value))}
        >
          {PLAYBACK_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.toFixed(2)}x
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function formatTimestamp(value: number | undefined) {
  if (!Number.isFinite(value) || value === undefined) {
    return "0:00";
  }
  const totalSeconds = Math.max(0, Math.floor(value));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
