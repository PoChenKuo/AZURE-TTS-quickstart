import { useEffect } from "react";
import { useRef } from "react";
import type { RefObject } from "react";
import type { ChatMessage, UtteranceRecord } from "../types";
import { createAudioUrl } from "../lib/audio";

export function useAutoPlayAssistantAudio(
  messages: ChatMessage[],
  utteranceById: Map<number, UtteranceRecord>,
  autoPlay: boolean,
  audioRef?: RefObject<HTMLAudioElement | null>,
  activeSessionId?: number | null
) {
  type SessionKey = number | "global";
  const lastSessionKeyRef = useRef<SessionKey | null>(null);
  const lastPlayedMapRef = useRef<Map<SessionKey, number | undefined>>(new Map());

  useEffect(() => {
    const sessionKey: SessionKey = activeSessionId ?? "global";
    if (!autoPlay || !messages.length) {
      const placeholder = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");
      if (placeholder?.id) {
        lastPlayedMapRef.current.set(sessionKey, placeholder.id);
      }
      lastSessionKeyRef.current = sessionKey;
      return;
    }

    const latestAssistant = [...messages]
      .reverse()
      .find((msg) => msg.role === "assistant");

    if (!latestAssistant?.linkedUtteranceId) {
      return;
    }

    const utterance = utteranceById.get(latestAssistant.linkedUtteranceId);
    if (!utterance) {
      return;
    }

    const lastSessionKey = lastSessionKeyRef.current;
    lastSessionKeyRef.current = sessionKey;
    const lastPlayedId = lastPlayedMapRef.current.get(sessionKey);
    if (lastSessionKey !== sessionKey) {
      if (latestAssistant.id != null) {
        lastPlayedMapRef.current.set(sessionKey, latestAssistant.id);
      }
      return;
    }
    if (latestAssistant.id == null) {
      return;
    }
    if (lastPlayedId === latestAssistant.id) {
      return;
    }
    lastPlayedMapRef.current.set(sessionKey, latestAssistant.id);

    const url = createAudioUrl(utterance.audioBlob);
    const element = audioRef?.current ?? undefined;
    if (element) {
      element.src = url;
      element.currentTime = 0;
      element
        .play()
        .catch(() => {
          /* ignore autoplay restrictions */
        });
      return () => {
        element.pause();
        element.removeAttribute("src");
        URL.revokeObjectURL(url);
      };
    }

    const fallbackAudio = new Audio(url);
    fallbackAudio.play().catch(() => {
      /* ignore autoplay restrictions */
    });
    return () => {
      fallbackAudio.pause();
      URL.revokeObjectURL(url);
    };
  }, [messages, utteranceById, autoPlay, audioRef]);
}
