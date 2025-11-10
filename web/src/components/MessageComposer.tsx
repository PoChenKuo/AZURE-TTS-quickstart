import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  maxLength?: number;
  playbackRate?: number;
  onPlaybackRateChange?: (value: number) => void;
};

// Shared textarea + send button used by the conversation page (and future surfaces if needed).
export function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  maxLength = 4000,
  playbackRate = 1,
  onPlaybackRateChange,
}: MessageComposerProps) {
  const { t } = useTranslation();
  const playbackOptions = Array.from({ length: 11 }, (_, index) =>
    (0.5 + index * 0.25).toFixed(2)
  );

  return (
    <form onSubmit={onSubmit} className="grid" style={{ gap: "0.75rem" }}>
      <textarea
        className="input"
        rows={4}
        placeholder={t("composer.placeholder")}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="flex items-center gap-4 text-muted text-sm">
          <span>
            {value.length}/{maxLength}
          </span>
          {onPlaybackRateChange && (
            <label className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-400">
              <span>{t("composer.speed")}</span>
              <select
                className="playback-select rounded-full border border-white/20 px-2 py-1 text-xs focus:outline-none"
                value={playbackRate.toFixed(2)}
                onChange={(e) => onPlaybackRateChange(Number(e.target.value))}
              >
                {playbackOptions.map((option) => (
                  <option key={option} value={option}>
                    {parseFloat(option).toFixed(2)}x
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("composer.sending") : t("composer.send")}
        </button>
      </div>
    </form>
  );
}
