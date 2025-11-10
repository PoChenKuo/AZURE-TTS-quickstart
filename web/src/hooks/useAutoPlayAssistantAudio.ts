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
  const lastPlayedMapRef = useRef<Map<SessionKey, string>>(new Map());
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionKey: SessionKey = activeSessionId ?? "global";
    if (!autoPlay || !messages.length) {
      const placeholder = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");
      if (placeholder?.id) {
        const placeholderKey = buildPlaybackKey(
          placeholder.id,
          placeholder.linkedUtteranceId
        );
        lastPlayedMapRef.current.set(sessionKey, placeholderKey);
      }
      if (messages.length) {
        lastSessionKeyRef.current = sessionKey;
      }
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
    const playbackKey = buildPlaybackKey(
      latestAssistant.id,
      latestAssistant.linkedUtteranceId
    );
    const lastPlayedKey = lastPlayedMapRef.current.get(sessionKey);
    if (lastSessionKey !== sessionKey) {
      lastPlayedMapRef.current.set(sessionKey, playbackKey);
      return;
    }
    if (lastPlayedKey === playbackKey) {
      return;
    }
    lastPlayedMapRef.current.set(sessionKey, playbackKey);

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
      if (lastUrlRef.current) {
        // URL.revokeObjectURL(lastUrlRef.current);
      }
      lastUrlRef.current = url;
      return () => {
        // keep playing; cleanup handled when component unmounts or next playback starts
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
  }, [messages, utteranceById, autoPlay, audioRef, activeSessionId]);

  useEffect(() => {
    return () => {
      const element = audioRef?.current;
      element?.pause();
      if (lastUrlRef.current) {
        // URL.revokeObjectURL(lastUrlRef.current);
        lastUrlRef.current = null;
      }
    };
  }, [audioRef]);
}

function buildPlaybackKey(messageId?: number | null, utteranceId?: number | null) {
  return `${messageId ?? "unknown"}-${utteranceId ?? "none"}`;
}
