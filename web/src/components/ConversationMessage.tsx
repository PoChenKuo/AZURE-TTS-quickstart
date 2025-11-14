import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import type { RefObject } from "react";
import { AudioPreview } from "./AudioPreview";
import type { ChatMessage, UtteranceRecord } from "../types";
import "./ConversationMessage.less";

type ConversationMessageProps = {
  message: ChatMessage;
  utterance?: UtteranceRecord;
  audioRef: RefObject<HTMLAudioElement | null>;
  onRegenerateAudio?: (message: ChatMessage) => void;
  onDeleteAudio?: (message: ChatMessage) => void | Promise<void>;
  deletingAudioIds?: Set<number>;
  onDeleteMessage?: (message: ChatMessage) => void | Promise<void>;
  deletingMessageIds?: Set<number>;
  playbackRate: number;
  fontScale: number;
  onRetryResponse?: (message: ChatMessage) => void | Promise<void>;
  retryingMessageIds?: Set<number>;
  isRetryDisabled: boolean;
  copiedMessageId: number | null;
  onCopyMessage?: (message: ChatMessage) => void | Promise<void>;
  registerAssistantNode?: (id: number, node: HTMLElement | null) => void;
  regeneratingAudioIds?: Set<number>;
};

export function ConversationMessage({
  message,
  utterance,
  audioRef,
  onRegenerateAudio,
  onDeleteAudio,
  deletingAudioIds,
  onDeleteMessage,
  deletingMessageIds,
  playbackRate,
  fontScale,
  onRetryResponse,
  retryingMessageIds,
  isRetryDisabled,
  copiedMessageId,
  onCopyMessage,
  registerAssistantNode,
  regeneratingAudioIds,
}: ConversationMessageProps) {
  const { t } = useTranslation();

  const durationMs = utterance?.durationMs;
  const durationKnown = typeof durationMs === "number";
  const hasAudio = Boolean(utterance && (!durationKnown || durationMs > 0));
  const needsRegeneration =
    message.role === "assistant" && (!utterance || !hasAudio);

  const isDeletingAudio =
    Boolean(message.id != null && deletingAudioIds?.has(message.id));
  const isDeletingMessage =
    Boolean(message.id != null && deletingMessageIds?.has(message.id));
  const isRetrying =
    Boolean(message.id != null && retryingMessageIds?.has(message.id));
  const canRetry =
    message.role === "user" && Boolean(message.id && onRetryResponse);
  const isRegeneratingAudio =
    Boolean(message.id != null && regeneratingAudioIds?.has(message.id));

  return (
    <article
      ref={(node) => {
        if (
          registerAssistantNode &&
          message.role === "assistant" &&
          typeof message.id === "number"
        ) {
          registerAssistantNode(message.id, node);
        }
      }}
      className={clsx(
        "rounded-2xl bg-slate-900/85 p-4 shadow-lg shadow-black/20 relative",
        message.role
      )}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/60 px-3 py-1 text-[0.65rem] font-semibold tracking-wide text-slate-200">
          {message.role.toUpperCase()}
        </span>
        <div className="flex items-center gap-3">
          <span>{new Date(message.createdUtc).toLocaleTimeString()}</span>
          {canRetry && (
            <button
              type="button"
              className="text-cyan-300 hover:text-cyan-200 disabled:opacity-60"
              disabled={isRetrying || isRetryDisabled}
              onClick={() => onRetryResponse?.(message)}
            >
              {isRetrying ? t("log.retrying") : t("log.retryResponse")}
            </button>
          )}
          {message.id && onDeleteMessage && (
            <button
              type="button"
              className="text-rose-300 hover:text-rose-200 disabled:opacity-60"
              onClick={() => onDeleteMessage(message)}
              disabled={isDeletingMessage}
            >
              {isDeletingMessage ? t("common.loading") : t("log.deleteMessage")}
            </button>
          )}
        </div>
      </div>
      <div
        className={clsx("markdown-body", "text-slate-100", message.role)}
        style={{ fontSize: `${fontScale}rem` }}
      >
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
          {t("log.tokens", {
            count: message.geminiMeta.tokens,
            model: message.geminiMeta.model,
          })}
        </p>
      )}
      {hasAudio && utterance && !isRegeneratingAudio && (
        <div className="mt-3">
          <AudioPreview
            buffer={utterance.audioBlob}
            durationMs={utterance.durationMs}
            sharedAudioRef={audioRef}
            onDelete={onDeleteAudio ? () => onDeleteAudio(message) : undefined}
            isDeleting={isDeletingAudio}
            playbackRate={playbackRate}
          />
        </div>
      )}
      {needsRegeneration && onRegenerateAudio && (
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span>
            {isRegeneratingAudio
              ? t("log.audioGenerating")
              : t("log.audioUnavailable")}
          </span>
          <button
            type="button"
            className="rounded-full border border-sky-400/60 px-3 py-1 text-[0.7rem] font-semibold text-sky-200 transition hover:bg-sky-400/20"
            onClick={() => onRegenerateAudio(message)}
            disabled={isRegeneratingAudio}
          >
            {isRegeneratingAudio ? t("common.loading") : t("log.regenerate")}
          </button>
        </div>
      )}
      <button
        type="button"
        className="log-copy-button"
        onClick={() => onCopyMessage?.(message)}
      >
        {copiedMessageId === message.id ? t("log.copied") : t("log.copy")}
      </button>
    </article>
  );
}
