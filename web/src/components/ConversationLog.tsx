import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { ChatMessage, UtteranceRecord } from "../types";
import { ConversationMessage } from "./ConversationMessage";
import "./ConversationLog.less";

type ConversationLogProps = {
  messages: ChatMessage[];
  utteranceById: Map<number, UtteranceRecord>;
  className?: string;
  contentClassName?: string;
  onRegenerateAudio?: (message: ChatMessage) => void;
  sharedAudioRef?: RefObject<HTMLAudioElement | null>;
  onDeleteAudio?: (message: ChatMessage) => void | Promise<void>;
  deletingAudioIds?: Set<number>;
  regeneratingAudioIds?: Set<number>;
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
  regeneratingAudioIds,
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
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);

  const registerAssistantNode = useCallback(
    (id: number, node: HTMLElement | null) => {
      if (node) {
        assistantMessageRefs.current.set(id, node);
      } else {
        assistantMessageRefs.current.delete(id);
      }
    },
    []
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

  const wrapperClass = clsx("converation-wrap relative flex h-full min-h-0", className);
  const scrollAreaClass = clsx(
    "flex h-full w-full flex-col gap-4 overflow-y-auto",
    contentClassName
  );
  const arrowButtonClass =
    "pointer-events-auto rounded-full border border-white/30 bg-slate-900/80 p-2 text-lg leading-none text-white shadow-lg shadow-black/40 transition hover:border-cyan-300/70 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-40";
  const arrowRailBaseClass =
    "pointer-events-none fixed top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 lg:absolute";
  const leftArrowRailClass = clsx(arrowRailBaseClass, "left-2");
  const rightArrowRailClass = clsx(arrowRailBaseClass, "right-2");

  const handleCopyMessage = useCallback(
    async (message: ChatMessage) => {
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
    },
    []
  );

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
      targetNode.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveAssistantIndex(targetIndex);
    }
  };

  const getScrollHost = useCallback(() => {
    const host = scrollContainerRef.current;
    if (host && host.scrollHeight > host.clientHeight + 1) {
      return host;
    }
    return null;
  }, [scrollContainerRef]);

  const handleScrollToTop = () => {
    const host = getScrollHost();
    if (host) {
      host.scrollTo({ top: 0, behavior: "smooth" });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (hasAssistantResponses) {
      setActiveAssistantIndex(0);
    }
  };

  const handleScrollToBottom = () => {
    const host = getScrollHost();
    if (host) {
      host.scrollTo({ top: host.scrollHeight, behavior: "smooth" });
    } else if (typeof window !== "undefined" && typeof document !== "undefined") {
      const target =
        document.scrollingElement ?? document.documentElement ?? document.body;
      const bottom =
        target?.scrollHeight ??
        Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.scrollTo({ top: bottom, behavior: "smooth" });
    }
    if (hasAssistantResponses) {
      setActiveAssistantIndex(assistantMessageCount - 1);
    }
  };

  const updateActiveAssistantIndexFromScroll = useCallback(() => {
    if (!hasAssistantResponses || typeof window === "undefined") {
      return;
    }

    const host = getScrollHost();
    const viewportRect = host?.getBoundingClientRect();
    const viewportTop = viewportRect?.top ?? 0;
    const viewportBottom = viewportRect?.bottom ?? window.innerHeight;
    const viewportHeight = Math.max(1, viewportBottom - viewportTop);
    const anchorY = viewportTop + Math.min(viewportHeight * 0.25, 200);

    let nextIndex = -1;
    let firstBelowAnchor = -1;

    for (let index = 0; index < assistantMessageCount; index += 1) {
      const message = assistantMessages[index];
      const node = assistantMessageRefs.current.get(message.id);
      if (!node) {
        continue;
      }
      const rect = node.getBoundingClientRect();
      const spansAnchor = rect.top <= anchorY && rect.bottom >= anchorY;
      if (spansAnchor) {
        nextIndex = index;
        break;
      }
      if (firstBelowAnchor === -1 && rect.top > anchorY) {
        firstBelowAnchor = index;
      }
    }

    if (nextIndex === -1) {
      if (firstBelowAnchor !== -1) {
        nextIndex = firstBelowAnchor;
      } else {
        nextIndex = assistantMessageCount - 1;
      }
    }

    setActiveAssistantIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex
    );
  }, [
    assistantMessageCount,
    assistantMessages,
    getScrollHost,
    hasAssistantResponses,
  ]);

  useEffect(() => {
    if (!hasAssistantResponses || typeof window === "undefined") {
      return;
    }

    let animationFrame = 0;
    const handleScroll = () => {
      if (animationFrame) {
        return;
      }
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0;
        updateActiveAssistantIndexFromScroll();
      });
    };

    const host = getScrollHost();
    host?.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    updateActiveAssistantIndexFromScroll();

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      host?.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [getScrollHost, hasAssistantResponses, updateActiveAssistantIndexFromScroll]);

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

          return (
            <ConversationMessage
              key={message.id}
              message={message}
              utterance={utterance}
              audioRef={audioRef}
              onRegenerateAudio={onRegenerateAudio}
              onDeleteAudio={onDeleteAudio}
              deletingAudioIds={deletingAudioIds}
              onDeleteMessage={onDeleteMessage}
              deletingMessageIds={deletingMessageIds}
              playbackRate={playbackRate}
              fontScale={fontScale}
              onRetryResponse={onRetryResponse}
              retryingMessageIds={retryingMessageIds}
              isRetryDisabled={isRetryDisabled}
              copiedMessageId={copiedMessageId}
              onCopyMessage={handleCopyMessage}
              registerAssistantNode={registerAssistantNode}
              regeneratingAudioIds={regeneratingAudioIds}
            />
          );
        })}
        {!sharedAudioRef && <audio ref={audioRef} className="hidden" />}
      </div>
      <div className={leftArrowRailClass}>
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
      <div className={rightArrowRailClass}>
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
