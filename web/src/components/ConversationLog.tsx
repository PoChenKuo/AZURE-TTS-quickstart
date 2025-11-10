import clsx from "clsx";
import { useRef } from "react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { AudioPreview } from "./AudioPreview";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, UtteranceRecord } from "../types";

type ConversationLogProps = {
  messages: ChatMessage[];
  utteranceById: Map<number, UtteranceRecord>;
  className?: string;
  onRegenerateAudio?: (message: ChatMessage) => void;
  sharedAudioRef?: RefObject<HTMLAudioElement | null>;
  onDeleteAudio?: (message: ChatMessage) => void | Promise<void>;
  deletingAudioIds?: Set<number>;
  onDeleteMessage?: (message: ChatMessage) => void | Promise<void>;
  deletingMessageIds?: Set<number>;
  playbackRate?: number;
};

// Displays the chronological transcript plus any cached audio previews.
export function ConversationLog({
  messages,
  utteranceById,
  className,
  onRegenerateAudio,
  sharedAudioRef,
  onDeleteAudio,
  deletingAudioIds,
  onDeleteMessage,
  deletingMessageIds,
  playbackRate = 1,
}: ConversationLogProps) {
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef =
    (sharedAudioRef as RefObject<HTMLAudioElement | null> | undefined) ??
    fallbackAudioRef;
  const { t } = useTranslation();

  if (!messages.length) {
    return (
      <div className={clsx("flex flex-col gap-4", className)}>
        <p className="text-sm text-slate-400">{t("conversation.empty")}</p>
      </div>
    );
  }

  const containerClass = clsx("flex flex-col gap-4", className);

  return (
    <div className={containerClass}>
      {messages.map((message) => {
        const utterance = message.linkedUtteranceId
          ? utteranceById.get(message.linkedUtteranceId)
          : undefined;
        const durationMs = utterance?.durationMs;
        const durationKnown = typeof durationMs === "number";
        const hasAudio = Boolean(utterance && (!durationKnown || durationMs > 0));
        const needsRegeneration =
          message.role === "assistant" && (!utterance || !hasAudio);

        const isDeleting =
          Boolean(message.id != null && deletingAudioIds?.has(message.id));
        const deletingMessage =
          Boolean(message.id != null && deletingMessageIds?.has(message.id));

        return (
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
              <div className="flex items-center gap-3">
                <span>{new Date(message.createdUtc).toLocaleTimeString()}</span>
                {message.id && onDeleteMessage && (
                  <button
                    type="button"
                    className="text-rose-300 hover:text-rose-200 disabled:opacity-60"
                    onClick={() => onDeleteMessage(message)}
                    disabled={deletingMessage}
                  >
                    {deletingMessage ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
            <div className="markdown-body text-slate-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="my-2 whitespace-pre-wrap break-words">{children}</p>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            {message.geminiMeta?.tokens && (
              <p className="mt-2 text-xs text-slate-400">
                {message.geminiMeta.tokens} tokens | {message.geminiMeta.model}
              </p>
            )}
            {hasAudio && utterance && (
              <div className="mt-3">
                <AudioPreview
                  buffer={utterance.audioBlob}
                  durationMs={utterance.durationMs}
                  sharedAudioRef={audioRef}
                  onDelete={
                    onDeleteAudio ? () => onDeleteAudio(message) : undefined
                  }
                  isDeleting={isDeleting}
                  playbackRate={playbackRate}
                />
              </div>
            )}
            {needsRegeneration && onRegenerateAudio && (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                <span>Audio unavailable.</span>
                <button
                  type="button"
                  className="rounded-full border border-sky-400/60 px-3 py-1 text-[0.7rem] font-semibold text-sky-200 transition hover:bg-sky-400/20"
                  onClick={() => onRegenerateAudio(message)}
                >
                  Re-generate audio
                </button>
              </div>
            )}
          </article>
        );
      })}
      {!sharedAudioRef && <audio ref={audioRef} className="hidden" />}
    </div>
  );
}
