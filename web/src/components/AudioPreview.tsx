import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { useTranslation } from "react-i18next";
import { createAudioUrl } from "../lib/audio";

type AudioPreviewProps = {
  buffer: ArrayBuffer;
  durationMs?: number;
  sharedAudioRef?: RefObject<HTMLAudioElement | null>;
  onDelete?: () => void | Promise<void>;
  isDeleting?: boolean;
  playbackRate?: number;
};

export function AudioPreview({
  buffer,
  durationMs,
  sharedAudioRef,
  onDelete,
  isDeleting,
  playbackRate = 1,
}: AudioPreviewProps) {
  const url = useMemo(() => createAudioUrl(buffer), [buffer]);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = sharedAudioRef ?? localAudioRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const element = audioRef.current;
    if (!element) {
      return;
    }

    if (!sharedAudioRef) {
      element.src = url;
    }
    element.playbackRate = playbackRate;

    const handlePlay = () => {
      if (sharedAudioRef) {
        setIsPlaying(element.src === url);
      }
      else {
        setIsPlaying(true);
      }
    };

    const handleStop = () => {
      if (!sharedAudioRef || element.src === url) {
        setIsPlaying(false);
      }
    };

    element.addEventListener("play", handlePlay);
    element.addEventListener("pause", handleStop);
    element.addEventListener("ended", handleStop);

    return () => {
      element.removeEventListener("play", handlePlay);
      element.removeEventListener("pause", handleStop);
      element.removeEventListener("ended", handleStop);
      if (!sharedAudioRef) {
        element.pause();
        element.removeAttribute("src");
      }
      setIsPlaying(false);
      // URL.revokeObjectURL(url);
    };
  }, [url, audioRef, sharedAudioRef, playbackRate]);

  const handleToggle = () => {
    if (isDeleting) {
      return;
    }
    const element = audioRef.current;
    if (!element) {
      return;
    }
    if (sharedAudioRef && element.src !== url) {
      element.src = url;
    }
    if (isPlaying) {
      element.pause();
      setIsPlaying(false);
      return;
    }
    element.currentTime = 0;
    element
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
      });
  };

  const label =
    typeof durationMs === "number" ? formatDuration(durationMs) : t("audio.playLabel");

  return (
    <div className="inline-flex flex-wrap items-center gap-3 text-xs text-slate-300">
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/60 text-white transition hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleToggle}
          aria-label={
            isPlaying ? "Pause assistant audio" : "Play assistant audio"
          }
          disabled={isDeleting}
        >
          {isPlaying ?  "❚❚" : "▶"}
        </button>
        <span>{label}</span>
      </div>
      {onDelete && (
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-full border border-rose-400/60 px-3 text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting" : "Delete"}
        </button>
      )}
      {!sharedAudioRef && <audio ref={audioRef} className="hidden" />}
    </div>
  );
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

