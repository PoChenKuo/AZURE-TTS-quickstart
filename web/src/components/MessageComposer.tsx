import type { FormEvent } from "react";

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
  return (
    <form onSubmit={onSubmit} className="grid" style={{ gap: "0.75rem" }}>
      <textarea
        className="input"
        rows={4}
        placeholder="Ask Gemini anything..."
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <span className="text-muted">
          {value.length}/{maxLength}
        </span>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
