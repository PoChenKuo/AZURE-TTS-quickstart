import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
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
  contentClassName?: string;
  onRegenerateAudio?: (message: ChatMessage) => void;
  sharedAudioRef?: RefObject<HTMLAudioElement | null>;
  onDeleteAudio?: (message: ChatMessage) => void | Promise<void>;
  deletingAudioIds?: Set<number>;
  onDeleteMessage?: (message: ChatMessage) => void | Promise<void>;
  deletingMessageIds?: Set<number>;
  playbackRate?: number;
  fontScale?: number;
  onRetryResponse?: (message: ChatMessage) => void | Promise<void>;
  retryingMessageIds?: Set<number>;
  isRetryDisabled?: boolean;
};

// Displays the chronological transcript plus any cached audio previews.
export function ConversationLog({
  messages,
  utteranceById,
  className,
  contentClassName,
  onRegenerateAudio,
  sharedAudioRef,
  onDeleteAudio,
  deletingAudioIds,
  onDeleteMessage,
  deletingMessageIds,
  playbackRate = 1,
  fontScale = 1,
  onRetryResponse,
  retryingMessageIds,
  isRetryDisabled = false,
}: ConversationLogProps) {
  const fallbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef =
    (sharedAudioRef as RefObject<HTMLAudioElement | null> | undefined) ??
    fallbackAudioRef;
  const { t } = useTranslation();
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const assistantMessageRefs = useRef<Map<number, HTMLElement>>(new Map());
  const assistantMessages = useMemo(
    () =>
      messages.filter(
        (message): message is ChatMessage & { id: number } =>
          message.role === "assistant" && typeof message.id === "number"
      ),
    [messages]
  );
  const assistantMessageCount = assistantMessages.length;
  const [activeAssistantIndex, setActiveAssistantIndex] = useState(() =>
    assistantMessageCount ? assistantMessageCount - 1 : -1
  );

  useEffect(() => {
    setActiveAssistantIndex((currentIndex) => {
      if (!assistantMessageCount) {
        return -1;
      }
      if (currentIndex === -1) {
        return assistantMessageCount - 1;
      }
      return Math.min(currentIndex, assistantMessageCount - 1);
    });
  }, [assistantMessageCount]);

  const hasMessages = messages.length > 0;
  const hasAssistantResponses = assistantMessageCount > 0;
  const hasPrevResponse = activeAssistantIndex > 0;
  const hasNextResponse =
    activeAssistantIndex >= 0 && activeAssistantIndex < assistantMessageCount - 1;

  const wrapperClass = clsx("relative flex h-full min-h-0", className);
  const scrollAreaClass = clsx(
    "flex h-full w-full flex-col gap-4 overflow-y-auto",
    contentClassName
  );
  const arrowButtonClass =
    "pointer-events-auto rounded-full border border-white/30 bg-slate-900/80 p-2 text-lg leading-none text-white shadow-lg shadow-black/40 transition hover:border-cyan-300/70 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-40";

  const scrollToAssistantIndex = (targetIndex: number) => {
    if (
      targetIndex < 0 ||
      targetIndex >= assistantMessageCount ||
      !hasAssistantResponses
    ) {
      return;
    }
    const targetMessage = assistantMessages[targetIndex];
    if (!targetMessage?.id) {
      return;
    }
    const targetNode = assistantMessageRefs.current.get(targetMessage.id);
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
      setActiveAssistantIndex(targetIndex);
    }
  };

  const handleScrollToTop = () => {
    const host = scrollContainerRef.current;
    if (!host) {
      return;
    }
    host.scrollTo({ top: 0, behavior: "smooth" });
    if (hasAssistantResponses) {
      setActiveAssistantIndex(0);
    }
  };

  const handleScrollToBottom = () => {
    const host = scrollContainerRef.current;
    if (!host) {
      return;
    }
    host.scrollTo({ top: host.scrollHeight, behavior: "smooth" });
    if (hasAssistantResponses) {
      setActiveAssistantIndex(assistantMessageCount - 1);
    }
  };

  return (
    <div className={wrapperClass}>
      <div ref={scrollContainerRef} className={scrollAreaClass}>
        {!hasMessages && (
          <p className="text-sm text-slate-400">{t("conversation.empty")}</p>
        )}
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
        const isRetrying =
          Boolean(message.id != null && retryingMessageIds?.has(message.id));
        const canRetry =
          message.role === "user" && Boolean(message.id && onRetryResponse);

        return (
          <article
            key={message.id}
            ref={(node) => {
              if (
                message.role === "assistant" &&
                typeof message.id === "number"
              ) {
                if (node) {
                  assistantMessageRefs.current.set(message.id, node);
                } else {
                  assistantMessageRefs.current.delete(message.id);
                }
              }
            }}
            className={clsx(
              "rounded-2xl border bg-slate-900/85 p-4 shadow-lg shadow-black/20 relative",
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
                    disabled={deletingMessage}
                  >
                    {deletingMessage ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>
            <div
              className="markdown-body text-slate-100"
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
            <button
              type="button"
              className="log-copy-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message.content);
                  if (message.id != null) {
                    setCopiedMessageId(message.id);
                    window.setTimeout(() => {
                      setCopiedMessageId((current) =>
                        current === message.id ? null : current
                      );
                    }, 2000);
                  }
                } catch (error) {
                  console.error("Failed to copy message", error);
                }
              }}
            >
              {copiedMessageId === message.id
                ? t("log.copied")
                : t("log.copy")}
            </button>
          </article>
        );
      })}
        {!sharedAudioRef && <audio ref={audioRef} className="hidden" />}
      </div>
      <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={t("log.previousResponse")}
          title={t("log.previousResponse")}
          onClick={() => scrollToAssistantIndex(activeAssistantIndex - 1)}
          disabled={!hasPrevResponse}
        >
          &uarr;
        </button>
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={t("log.scrollTop")}
          title={t("log.scrollTop")}
          onClick={handleScrollToTop}
          disabled={!hasMessages}
        >
          &uArr;
        </button>
      </div>
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={t("log.nextResponse")}
          title={t("log.nextResponse")}
          onClick={() => scrollToAssistantIndex(activeAssistantIndex + 1)}
          disabled={!hasNextResponse}
        >
          &darr;
        </button>
        <button
          type="button"
          className={arrowButtonClass}
          aria-label={t("log.scrollBottom")}
          title={t("log.scrollBottom")}
          onClick={handleScrollToBottom}
          disabled={!hasMessages}
        >
          &dArr;
        </button>
      </div>
    </div>
  );
}
