import clsx from "clsx";
import { AudioPreview } from "./AudioPreview";
import type { ChatMessage, UtteranceRecord } from "../types";

type ConversationLogProps = {
  messages: ChatMessage[];
  utteranceById: Map<number, UtteranceRecord>;
  className?: string;
};

// Displays the chronological transcript plus any cached audio previews.
export function ConversationLog({
  messages,
  utteranceById,
  className,
}: ConversationLogProps) {
  if (!messages.length) {
    return (
      <div className={clsx("flex flex-col gap-4", className)}>
        <p className="text-sm text-slate-400">No messages yet. Say hello to Gemini!</p>
      </div>
    );
  }

  const containerClass = clsx("flex flex-col gap-4", className);

  return (
    <div className={containerClass}>
      {messages.map((message) => (
        <article
          key={message.id}
          className={clsx(
            "rounded-2xl border bg-slate-900/85 p-4 shadow-lg shadow-black/20",
            message.role === "user"
              ? "border-emerald-300/40"
              : "border-sky-300/40"
          )}
        >
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/60 px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-slate-200">
              {message.role.toUpperCase()}
            </span>
            <span>{new Date(message.createdUtc).toLocaleTimeString()}</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-slate-100">{message.content}</p>
          {message.geminiMeta?.tokens && (
            <p className="mt-2 text-xs text-slate-400">
              {message.geminiMeta.tokens} tokens | {message.geminiMeta.model}
            </p>
          )}
          {message.linkedUtteranceId &&
            utteranceById.get(message.linkedUtteranceId) && (
              <div className="mt-3">
                <AudioPreview
                  buffer={utteranceById.get(message.linkedUtteranceId)!.audioBlob}
                />
              </div>
            )}
        </article>
      ))}
    </div>
  );
}
