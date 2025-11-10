import { useEffect, useMemo } from "react";
import { createAudioUrl } from "../lib/audio";

type AudioPreviewProps = {
  buffer: ArrayBuffer;
};

export function AudioPreview({ buffer }: AudioPreviewProps) {
  const url = useMemo(() => createAudioUrl(buffer), [buffer]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <audio
      controls
      src={url}
      style={{ width: "100%", marginTop: "0.5rem" }}
    />
  );
}
