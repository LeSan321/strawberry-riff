/**
 * StemMixer Component
 * Dark-themed mini-mixer for stem playback with mute/solo, volume controls, and custom mix export.
 * Design: dark cards, per-stem color accents, inline volume sliders.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VolumeX, Volume2, Download, Wand2, Loader2, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

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
    label: "Other",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-300",
    badgeBg: "bg-cyan-500/20",
    accentHex: "#06b6d4",
    icon: "🎺",
  },
  {
    name: "piano",
    label: "Piano",
    borderColor: "border-green-500/40",
    textColor: "text-green-300",
    badgeBg: "bg-green-500/20",
    accentHex: "#10b981",
    icon: "🎼",
  },
];

export function StemMixer({ stems, stemSplitId, trackTitle = "Track", className = "" }: StemMixerProps) {
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
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const exportMixMutation = trpc.mixer.exportCustomMix.useMutation({
    onSuccess: (data) => {
      setExportedUrl(data.url);
      toast.success("Custom mix ready! Click Download to save.");
    },
    onError: (err) => {
      toast.error("Failed to export mix: " + err.message);
    },
  });

  const handleExportMix = () => {
    if (!stemSplitId) return;
    setExportedUrl(null);
    exportMixMutation.mutate({
      stemSplitId,
      volumes: {
        vocals: muted["vocals"] ? 0 : volumes["vocals"] ?? 1,
        drums: muted["drums"] ? 0 : volumes["drums"] ?? 1,
        bass: muted["bass"] ? 0 : volumes["bass"] ?? 1,
        other: muted["other"] ? 0 : volumes["other"] ?? 1,
        piano: muted["piano"] ? 0 : volumes["piano"] ?? 1,
      },
    });
  };

  // Sync volume and mute state to audio elements
  useEffect(() => {
    stemsList.forEach((stem) => {
      const audio = audioRefs.current[stem.name];
      if (audio) {
        const isSoloActive = solo !== null && solo !== stem.name;
        audio.volume = isSoloActive || muted[stem.name] ? 0 : volumes[stem.name];
      }
    });
  }, [volumes, muted, solo, stemsList]);

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

      {/* Hidden Audio Elements */}
      {stemsList.map((stem) => (
        <audio
          key={stem.name}
          ref={(el) => {
            if (el) audioRefs.current[stem.name] = el;
          }}
          src={stem.url}
        />
      ))}

      {/* Export Footer */}
      {stemSplitId && (
        <div className="px-4 pb-4 pt-1 space-y-2">
          <div className="h-px bg-slate-800 mb-3" />
          <Button
            size="sm"
            className="w-full gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-900/30 transition-all"
            onClick={handleExportMix}
            disabled={exportMixMutation.isPending}
          >
            {exportMixMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mixing… this may take a moment
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
                download={`${trackTitle}-custom-mix.mp3`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Custom Mix
              </motion.a>
            )}
          </AnimatePresence>

          <p className="text-xs text-slate-500 text-center pt-0.5">
            Mute or solo stems, adjust volumes, then export your custom blend.
          </p>
        </div>
      )}
    </motion.div>
  );
}
