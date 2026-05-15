/**
 * StemMixer Component
 * Dark-themed mini-mixer for stem playback with mute/solo, volume controls, and custom mix export.
 * Mix export uses the Web Audio API (client-side) — no FFmpeg or server binary required.
 * Supports WAV export (lossless), MP3 export (via lamejs, shareable size), and Save to My Riffs.
 * Design: dark cards, per-stem color accents, inline volume sliders.
 *
 * Easter egg: "More Cowbell" button on the Drums row — boosts Drums to 150% (SNL tribute 🔔).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  VolumeX,
  Volume2,
  Download,
  Wand2,
  Loader2,
  Sliders,
  Music,
  BookmarkPlus,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface Stem {
  name: "vocals" | "drums" | "bass" | "other" | "piano" | "guitar";
  label: string;
  url: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
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
    guitarUrl?: string | null;
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
    name: "piano",
    label: "Piano",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-300",
    badgeBg: "bg-cyan-500/20",
    accentHex: "#06b6d4",
    icon: "🎼",
  },
  {
    name: "guitar",
    label: "Guitar",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-300",
    badgeBg: "bg-amber-500/20",
    accentHex: "#f59e0b",
    icon: "🎸",
  },
];

/**
 * Mix stems client-side using the Web Audio API.
 * Fetches each stem URL, decodes the audio, applies volume scaling,
 * sums the PCM samples, and returns a rendered AudioBuffer.
 */
async function renderMix(
  stemEntries: { url: string; volume: number }[],
  onProgress?: (msg: string) => void
): Promise<AudioBuffer> {
  onProgress?.("Fetching stems…");

  // Fetch + decode all stems in parallel
  const decoded = await Promise.all(
    stemEntries.map(async ({ url, volume }) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch stem: ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      const decodeCtx = new AudioContext();
      const audioBuf = await decodeCtx.decodeAudioData(arrayBuf);
      await decodeCtx.close();
      return { audioBuf, volume };
    })
  );

  onProgress?.("Mixing…");

  const maxLength = Math.max(...decoded.map((d) => d.audioBuf.length));
  const sampleRate = decoded[0].audioBuf.sampleRate;
  const numChannels = 2;

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

  return await offlineCtx.startRendering();
}

/**
 * Encode an AudioBuffer to a WAV Blob (16-bit PCM, stereo).
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

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

/**
 * Encode an AudioBuffer to an MP3 Blob using lamejs.
 * Dynamically imports lamejs to keep the initial bundle lean.
 */
async function audioBufferToMp3(buffer: AudioBuffer, onProgress?: (msg: string) => void): Promise<Blob> {
  onProgress?.("Encoding MP3…");
  // @ts-ignore — lamejs has no default TS types
  const lamejs = await import("lamejs");
  const Mp3Encoder = lamejs.default?.Mp3Encoder ?? lamejs.Mp3Encoder;

  const numChannels = Math.min(buffer.numberOfChannels, 2);
  const sampleRate = buffer.sampleRate;
  const bitrate = 192; // kbps

  const encoder = new Mp3Encoder(numChannels, sampleRate, bitrate);
  const blockSize = 1152; // samples per MP3 frame

  // Convert Float32 [-1,1] to Int16
  const toInt16 = (floatArr: Float32Array): Int16Array => {
    const int16 = new Int16Array(floatArr.length);
    for (let i = 0; i < floatArr.length; i++) {
      const s = Math.max(-1, Math.min(1, floatArr[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16;
  };

  const leftInt16 = toInt16(buffer.getChannelData(0));
  const rightInt16 = numChannels > 1 ? toInt16(buffer.getChannelData(1)) : leftInt16;

  const mp3Chunks: Uint8Array[] = [];
  for (let i = 0; i < leftInt16.length; i += blockSize) {
    const leftChunk = leftInt16.subarray(i, i + blockSize);
    const rightChunk = rightInt16.subarray(i, i + blockSize);
    const encoded = encoder.encodeBuffer(leftChunk, rightChunk);
    if (encoded.length > 0) mp3Chunks.push(new Uint8Array(encoded));
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) mp3Chunks.push(new Uint8Array(flushed));

  return new Blob(mp3Chunks as BlobPart[], { type: "audio/mp3" });
}

/** Convert a Blob to a base64 string */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the data:...;base64, prefix
      resolve(dataUrl.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function StemMixer({ stems, stemSplitId, trackTitle = "Track", className = "" }: StemMixerProps) {
  const [, navigate] = useLocation();

  const urlMap: Record<string, string | null | undefined> = {
    vocals: stems.vocalUrl,
    drums: stems.drumsUrl,
    bass: stems.bassUrl,
    other: stems.otherUrl,
    piano: stems.pianoUrl,
    guitar: stems.guitarUrl,
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
  const [exportedWavUrl, setExportedWavUrl] = useState<string | null>(null);
  const [exportedMp3Url, setExportedMp3Url] = useState<string | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState<string>("");
  const [savedTrackId, setSavedTrackId] = useState<number | null>(null);
  const [cowbellActive, setCowbellActive] = useState(false);
  const [mixTitle, setMixTitle] = useState(`${trackTitle} (Custom Mix)`);

  const saveMixMutation = trpc.mixer.saveMixToRiffs.useMutation({
    onSuccess: (data) => {
      setSavedTrackId(data.trackId);
      toast.success("Custom mix saved to My Riffs! 🍓", {
        action: {
          label: "View",
          onClick: () => navigate("/my-riffs"),
        },
      });
    },
    onError: (err) => {
      toast.error("Failed to save mix: " + err.message);
    },
  });

  const getActiveStemEntries = () =>
    stemsList
      .filter((stem) => {
        const isSoloActive = solo !== null && solo !== stem.name;
        return !muted[stem.name] && !isSoloActive && (volumes[stem.name] ?? 1) > 0;
      })
      .map((stem) => ({
        url: stem.url,
        volume: volumes[stem.name] ?? 1,
        label: stem.label,
        name: stem.name,
      }));

  const handleExportWav = async () => {
    const activeStemEntries = getActiveStemEntries();
    if (activeStemEntries.length === 0) {
      toast.error("No active stems to mix — unmute at least one stem.");
      return;
    }
    setIsMixing(true);
    setExportedWavUrl(null);
    setExportedMp3Url(null);
    setSavedTrackId(null);
    setMixProgress("Starting…");
    try {
      const renderedBuffer = await renderMix(activeStemEntries, setMixProgress);
      setMixProgress("Encoding WAV…");
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setExportedWavUrl(url);
      toast.success("WAV mix ready! Click Download to save.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to export mix: " + msg);
    } finally {
      setIsMixing(false);
      setMixProgress("");
    }
  };

  const handleExportMp3 = async () => {
    const activeStemEntries = getActiveStemEntries();
    if (activeStemEntries.length === 0) {
      toast.error("No active stems to mix — unmute at least one stem.");
      return;
    }
    setIsMixing(true);
    setExportedWavUrl(null);
    setExportedMp3Url(null);
    setSavedTrackId(null);
    setMixProgress("Starting…");
    try {
      const renderedBuffer = await renderMix(activeStemEntries, setMixProgress);
      const mp3Blob = await audioBufferToMp3(renderedBuffer, setMixProgress);
      const url = URL.createObjectURL(mp3Blob);
      setExportedMp3Url(url);
      toast.success("MP3 mix ready! Click Download to save.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to export MP3: " + msg);
    } finally {
      setIsMixing(false);
      setMixProgress("");
    }
  };

  const handleSaveToRiffs = async () => {
    if (!stemSplitId) {
      toast.error("Cannot save — stem split ID is missing.");
      return;
    }
    const activeStemEntries = getActiveStemEntries();
    if (activeStemEntries.length === 0) {
      toast.error("No active stems to mix — unmute at least one stem.");
      return;
    }
    // Build blend description from active stems and their volumes
    const blendDescription = activeStemEntries
      .map(({ label, name, volume }) => {
        const pct = Math.round(volume * 100);
        const cowbell = name === "drums" && cowbellActive ? " 🔔" : "";
        return `${label} ${pct}%${cowbell}`;
      })
      .join(", ");

    setIsMixing(true);
    setSavedTrackId(null);
    setMixProgress("Rendering mix…");
    try {
      const renderedBuffer = await renderMix(activeStemEntries, setMixProgress);
      setMixProgress("Encoding WAV…");
      const wavBlob = audioBufferToWav(renderedBuffer);
      setMixProgress("Uploading to My Riffs…");
      const base64 = await blobToBase64(wavBlob);
      await saveMixMutation.mutateAsync({
        stemSplitId,
        audioBase64: base64,
        mimeType: "audio/wav",
        title: mixTitle.trim() || `${trackTitle} (Custom Mix)`,
        duration: Math.round(renderedBuffer.duration),
        blendDescription,
      });
    } catch (err) {
      if (!saveMixMutation.isError) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to save mix: " + msg);
      }
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

  /** 🔔 More Cowbell — boost Drums to 150% */
  const handleMoreCowbell = () => {
    setCowbellActive(true);
    setVolumes((prev) => ({ ...prev, drums: 1.5 }));
    setMuted((prev) => ({ ...prev, drums: false }));
    toast("🔔 I got a fever... and the only prescription is MORE COWBELL!", {
      duration: 4000,
      description: "Drums boosted to 150% — Will Ferrell would be proud.",
    });
    // Reset the cowbell glow after 3 seconds
    setTimeout(() => setCowbellActive(false), 3000);
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
            const isDrums = stem.name === "drums";
            const isCowbellGlowing = isDrums && cowbellActive;

            return (
              <motion.div
                key={stem.name}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isSoloActive ? 0.35 : 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                  isCowbellGlowing
                    ? "border-orange-400/70 bg-orange-500/10 shadow-lg shadow-orange-500/20"
                    : isSoloActive
                    ? "border-slate-800 bg-slate-950/40"
                    : `${stem.borderColor} bg-slate-800/40`
                }`}
              >
                {/* Icon badge */}
                <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${stem.badgeBg} text-lg ${isCowbellGlowing ? "animate-bounce" : ""}`}>
                  {isCowbellGlowing ? "🔔" : stem.icon}
                </div>

                {/* Label + controls */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold tracking-wide uppercase ${stem.textColor}`}>
                      {stem.label}
                      {isDrums && vol > 1.2 && (
                        <span className="ml-1 text-orange-400 normal-case font-normal">🔔</span>
                      )}
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
                      max="2"
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
                  {/* More Cowbell — only on Drums row */}
                  {isDrums && (
                    <button
                      onClick={handleMoreCowbell}
                      title="More Cowbell! 🔔"
                      className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-all ${
                        cowbellActive
                          ? "bg-orange-500/30 text-orange-300 border border-orange-500/50 animate-pulse"
                          : "bg-slate-700/60 text-slate-400 hover:text-orange-300 hover:bg-orange-500/10"
                      }`}
                    >
                      🔔
                    </button>
                  )}

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

        {/* Export buttons row */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-900/30 transition-all text-xs"
            onClick={handleExportWav}
            disabled={isMixing}
          >
            {isMixing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5" />
            )}
            Export WAV
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-violet-500/40 text-violet-300 hover:bg-violet-500/10 font-semibold text-xs"
            onClick={handleExportMp3}
            disabled={isMixing}
          >
            {isMixing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Music className="w-3.5 h-3.5" />
            )}
            Export MP3
          </Button>
        </div>

        {/* Custom mix title input — shown before saving */}
        {stemSplitId && !savedTrackId && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-400 font-medium">Mix name</label>
            <input
              type="text"
              value={mixTitle}
              onChange={(e) => setMixTitle(e.target.value)}
              placeholder={`${trackTitle} (Custom Mix)`}
              maxLength={200}
              className="w-full px-3 py-1.5 text-xs rounded-md bg-slate-800/80 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
            />
          </div>
        )}

        {/* Save to My Riffs button */}
        {stemSplitId && (
          <Button
            size="sm"
            variant="outline"
            className={`w-full gap-1.5 font-semibold text-xs transition-all ${
              savedTrackId
                ? "border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10"
                : "border-pink-500/40 text-pink-300 hover:bg-pink-500/10"
            }`}
            onClick={savedTrackId ? () => navigate("/my-riffs") : handleSaveToRiffs}
            disabled={isMixing && !savedTrackId}
          >
            {isMixing && !savedTrackId ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : savedTrackId ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5" />
            )}
            {savedTrackId ? "Saved! View in My Riffs →" : "Save to My Riffs 🍓"}
          </Button>
        )}

        {/* Progress indicator */}
        {isMixing && mixProgress && (
          <p className="text-xs text-slate-400 text-center animate-pulse">{mixProgress}</p>
        )}

        {/* Download links */}
        <AnimatePresence>
          {exportedWavUrl && (
            <motion.a
              href={exportedWavUrl}
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
          {exportedMp3Url && (
            <motion.a
              href={exportedMp3Url}
              download={`${trackTitle}-custom-mix.mp3`}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-sm font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Custom Mix (MP3)
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
