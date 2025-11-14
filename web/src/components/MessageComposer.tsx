import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import "./MessageComposer.less";
import { AudioControlPanel } from "./AudioControlPanel";

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  maxLength?: number;
};

// Shared textarea + send button used by the conversation page (and future surfaces if needed).
export function MessageComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  maxLength = 4000,
}: MessageComposerProps) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="message-composer">
      <textarea
        className="input"
        rows={2}
        placeholder={t("composer.placeholder")}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <div
        className="flex justify-between items-center gap-2"
      >
        <div className="flex items-center gap-4 text-muted text-sm">
          <span>
            {value.length}/{maxLength}
          </span>

        </div>
        <div className="message-composer-audio">
          <AudioControlPanel />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("composer.sending") : t("composer.send")}
        </button>
      </div>

    </form>
  );
}
