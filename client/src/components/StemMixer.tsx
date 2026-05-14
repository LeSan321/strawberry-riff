/**
 * StemMixer Component
 * Dark-themed mini-mixer for stem playback with mute/solo, volume controls, and custom mix export.
 * Mix export uses the Web Audio API (client-side) — no FFmpeg or server binary required.
 * Design: dark cards, per-stem color accents, inline volume sliders.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VolumeX, Volume2, Download, Wand2, Loader2, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Stem {
  name: "vocals" | "drums" | "bass" | "other" | "piano";
  label: string;
  url: string;
  /** Tailwind border/ring color class */
  borderColor: string;
  /** Tailwind text color class for label */
  textColor: string;
  /** Tailwind bg color for the icon badge */
  badgeBg: string;
  /** Hex for the range input accent */
  accentHex: string;
  icon: string;
}

interface StemMixerProps {
  stems: {
    vocalUrl?: string | null;
    drumsUrl?: string | null;
    bassUrl?: string | null;
    otherUrl?: string | null;
    pianoUrl?: string | null;
  };
  stemSplitId?: number;
  trackTitle?: string;
  className?: string;
}

const STEM_DEFS: Omit<Stem, "url">[] = [
  {
    name: "vocals",
    label: "Vocals",
    borderColor: "border-pink-500/40",
    textColor: "text-pink-300",
    badgeBg: "bg-pink-500/20",
    accentHex: "#ec4899",
    icon: "🎤",
  },
  {
    name: "drums",
    label: "Drums",
    borderColor: "border-orange-500/40",
    textColor: "text-orange-300",
    badgeBg: "bg-orange-500/20",
    accentHex: "#f97316",
    icon: "🥁",
  },
  {
    name: "bass",
    label: "Bass",
    borderColor: "border-purple-500/40",
    textColor: "text-purple-300",
    badgeBg: "bg-purple-500/20",
    accentHex: "#a855f7",
    icon: "🎸",
  },
  {
    name: "other",
    // "other" from FOUR_STEMS = everything except vocals/drums/bass = effectively Instrumental
    label: "Instrumental",
    borderColor: "border-green-500/40",
    textColor: "text-green-300",
    badgeBg: "bg-green-500/20",
    accentHex: "#10b981",
    icon: "🎵",
  },
  {
    name: "piano",
    label: "Piano",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-300",
    badgeBg: "bg-cyan-500/20",
    accentHex: "#06b6d4",
    icon: "🎼",
  },
];

/**
 * Mix stems client-side using the Web Audio API.
 * Fetches each stem URL, decodes the audio, applies volume scaling,
 * sums the PCM samples, and returns a WAV Blob.
 */
async function mixStemsClientSide(
  stemEntries: { url: string; volume: number }[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  const ctx = new OfflineAudioContext(2, 1, 44100); // temp context just for decoding

  onProgress?.("Fetching stems…");

  // Fetch + decode all stems in parallel
  const decoded = await Promise.all(
    stemEntries.map(async ({ url, volume }) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch stem: ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      // Decode in a throwaway context
      const decodeCtx = new AudioContext();
      const audioBuf = await decodeCtx.decodeAudioData(arrayBuf);
      await decodeCtx.close();
      return { audioBuf, volume };
    })
  );

  onProgress?.("Mixing…");

  // Use the longest buffer duration
  const maxLength = Math.max(...decoded.map((d) => d.audioBuf.length));
  const sampleRate = decoded[0].audioBuf.sampleRate;
  const numChannels = 2;

  // Create offline context at correct sample rate and length
  const offlineCtx = new OfflineAudioContext(numChannels, maxLength, sampleRate);

  for (const { audioBuf, volume } of decoded) {
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuf;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(offlineCtx.destination);
    source.start(0);
  }

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress?.("Encoding WAV…");

  // Encode to WAV
  const wavBlob = audioBufferToWav(renderedBuffer);
  return wavBlob;
}

/**
 * Encode an AudioBuffer to a WAV Blob (16-bit PCM, stereo).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channels
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = headerSize;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function StemMixer({ stems, trackTitle = "Track", className = "" }: StemMixerProps) {
  const urlMap: Record<string, string | null | undefined> = {
    vocals: stems.vocalUrl,
    drums: stems.drumsUrl,
    bass: stems.bassUrl,
    other: stems.otherUrl,
    piano: stems.pianoUrl,
  };

  const stemsList: Stem[] = STEM_DEFS
    .map((def) => ({ ...def, url: urlMap[def.name] || "" }))
    .filter((s) => s.url);

  const [volumes, setVolumes] = useState<Record<string, number>>(
    Object.fromEntries(stemsList.map((s) => [s.name, 1]))
  );
  const [muted, setMuted] = useState<Record<string, boolean>>(
    Object.fromEntries(stemsList.map((s) => [s.name, false]))
  );
  const [solo, setSolo] = useState<string | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState<string>("");

  const handleExportMix = async () => {
    const activeStemEntries = stemsList
      .filter((stem) => {
        const isSoloActive = solo !== null && solo !== stem.name;
        return !muted[stem.name] && !isSoloActive && (volumes[stem.name] ?? 1) > 0;
      })
      .map((stem) => ({
        url: stem.url,
        volume: volumes[stem.name] ?? 1,
      }));

    if (activeStemEntries.length === 0) {
      toast.error("No active stems to mix — unmute at least one stem.");
      return;
    }

    setIsMixing(true);
    setExportedUrl(null);
    setMixProgress("Starting…");

    try {
      const wavBlob = await mixStemsClientSide(activeStemEntries, setMixProgress);
      const url = URL.createObjectURL(wavBlob);
      setExportedUrl(url);
      toast.success("Custom mix ready! Click Download to save.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to export mix: " + msg);
    } finally {
      setIsMixing(false);
      setMixProgress("");
    }
  };

  const handleToggleMute = (stemName: string) => {
    setMuted((prev) => ({ ...prev, [stemName]: !prev[stemName] }));
  };

  const handleToggleSolo = (stemName: string) => {
    setSolo((prev) => (prev === stemName ? null : stemName));
  };

  const handleVolumeChange = (stemName: string, value: number) => {
    setVolumes((prev) => ({ ...prev, [stemName]: value }));
  };

  const handleDownloadStem = (stem: Stem) => {
    const link = document.createElement("a");
    link.href = stem.url;
    link.download = `${trackTitle}-${stem.label}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${stem.label} stem`);
  };

  if (stemsList.length === 0) return null;

  return (
    <motion.div
      className={`rounded-xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Panel Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30">
          <Sliders className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Custom Mix</h3>
          <p className="text-xs text-slate-400">Adjust levels, then export your blend</p>
        </div>
      </div>

      {/* Stem Rows */}
      <div className="px-4 py-3 space-y-2">
        <AnimatePresence>
          {stemsList.map((stem) => {
            const isMuted = muted[stem.name];
            const isSolo = solo === stem.name;
            const isSoloActive = solo !== null && solo !== stem.name;
            const vol = volumes[stem.name] ?? 1;
            const effectiveVol = isMuted || isSoloActive ? 0 : vol;

            return (
              <motion.div
                key={stem.name}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isSoloActive ? 0.35 : 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  isSoloActive
                    ? "border-slate-800 bg-slate-950/40"
                    : `${stem.borderColor} bg-slate-800/50`
                }`}
              >
                {/* Icon badge */}
                <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${stem.badgeBg} text-lg`}>
                  {stem.icon}
                </div>

                {/* Label + controls */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold tracking-wide uppercase ${stem.textColor}`}>
                      {stem.label}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {Math.round(effectiveVol * 100)}%
                    </span>
                  </div>

                  {/* Volume slider */}
                  <div className="relative h-2 flex items-center">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={vol}
                      onChange={(e) => handleVolumeChange(stem.name, parseFloat(e.target.value))}
                      disabled={isMuted || isSoloActive}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ accentColor: stem.accentHex }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex-shrink-0 flex items-center gap-1">
                  {/* Solo */}
                  <button
                    onClick={() => handleToggleSolo(stem.name)}
                    title={isSolo ? "Unsolo" : "Solo"}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      isSolo
                        ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                        : "bg-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    S
                  </button>

                  {/* Mute */}
                  <button
                    onClick={() => handleToggleMute(stem.name)}
                    title={isMuted ? "Unmute" : "Mute"}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                      isMuted
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Download stem */}
                  <button
                    onClick={() => handleDownloadStem(stem)}
                    title={`Download ${stem.label}`}
                    className="w-7 h-7 rounded flex items-center justify-center bg-slate-700/60 text-slate-400 hover:text-blue-300 hover:bg-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Export Footer */}
      <div className="px-4 pb-4 pt-1 space-y-2">
        <div className="h-px bg-slate-800 mb-3" />
        <Button
          size="sm"
          className="w-full gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-900/30 transition-all"
          onClick={handleExportMix}
          disabled={isMixing}
        >
          {isMixing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mixProgress || "Mixing…"}
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Export Custom Mix
            </>
          )}
        </Button>

        <AnimatePresence>
          {exportedUrl && (
            <motion.a
              href={exportedUrl}
              download={`${trackTitle}-custom-mix.wav`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Custom Mix (WAV)
            </motion.a>
          )}
        </AnimatePresence>

        <p className="text-xs text-slate-500 text-center pt-0.5">
          Mute or solo stems, adjust volumes, then export your custom blend.
        </p>
      </div>
    </motion.div>
  );
}
