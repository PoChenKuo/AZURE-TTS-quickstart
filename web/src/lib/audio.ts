import { hashText } from "./helpers";

export function generateToneWav(
  seed: string,
  durationSeconds = 1.3,
  amplitude = 0.24
): ArrayBuffer {
  const sampleRate = 22050;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const baseFrequency = 220 + (Math.abs(parseInt(hashText(seed), 16)) % 660);
  const samples = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const wobble = Math.sin(t * 2 * Math.PI * 2);
    const frequency = baseFrequency + wobble * 30;
    samples[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
  }

  return encodeWav(samples, sampleRate);
}

export function createAudioUrl(buffer: ArrayBuffer) {
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

export function getWavDurationMs(buffer: ArrayBuffer): number | undefined {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 44) {
      return undefined;
    }
    if (readString(view, 0, 4) !== "RIFF" || readString(view, 8, 4) !== "WAVE") {
      return undefined;
    }

    let offset = 12;
    let sampleRate: number | undefined;
    let bitsPerSample: number | undefined;
    let channels: number | undefined;
    let dataBytes: number | undefined;

    while (offset + 8 <= view.byteLength) {
      const chunkId = readString(view, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === "fmt ") {
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      }
      else if (chunkId === "data") {
        dataBytes = chunkSize;
        break;
      }
      offset += 8 + chunkSize + (chunkSize % 2);
    }

    if (!sampleRate || !bitsPerSample || !channels || !dataBytes) {
      return undefined;
    }
    const bytesPerSample = (bitsPerSample / 8) * channels;
    if (!bytesPerSample) {
      return undefined;
    }
    const durationSeconds = dataBytes / (sampleRate * bytesPerSample);
    return Math.max(0, Math.round(durationSeconds * 1000));
  }
  catch {
    return undefined;
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function readString(view: DataView, offset: number, length: number) {
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += String.fromCharCode(view.getUint8(offset + i));
  }
  return result;
}
