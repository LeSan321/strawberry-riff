/**
 * StemMixer Component
 * Mini-mixer for stem playback with mute/solo, volume controls, and download
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Volume1, VolumeX, Music, Download, Play, Pause, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Stem {
  name: "vocals" | "drums" | "bass" | "other" | "piano";
  label: string;
  url: string;
  color: string;
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
  stemSplitId?: number; // Required to enable Export Custom Mix
  trackTitle?: string;
  className?: string;
}

export function StemMixer({ stems, stemSplitId, trackTitle = "Track", className = "" }: StemMixerProps) {
  const stemsList: Stem[] = [
    { name: "vocals" as const, label: "Vocals", url: stems.vocalUrl || "", color: "from-pink-500 to-rose-600", icon: "🎤" },
    { name: "drums" as const, label: "Drums", url: stems.drumsUrl || "", color: "from-purple-500 to-indigo-600", icon: "🥁" },
    { name: "bass" as const, label: "Bass", url: stems.bassUrl || "", color: "from-blue-500 to-cyan-600", icon: "🎸" },
    { name: "other" as const, label: "Other", url: stems.otherUrl || "", color: "from-amber-500 to-orange-600", icon: "🎹" },
    { name: "piano" as const, label: "Piano", url: stems.pianoUrl || "", color: "from-green-500 to-emerald-600", icon: "🎼" },
  ].filter((s) => s.url) // Only show stems that have URLs

  const [volumes, setVolumes] = useState<Record<string, number>>(
    Object.fromEntries(stemsList.map((s) => [s.name, 1]))
  );
  const [muted, setMuted] = useState<Record<string, boolean>>(
    Object.fromEntries(stemsList.map((s) => [s.name, false]))
  );
  const [solo, setSolo] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const handlePlay = () => {
    setIsPlaying(true);
    stemsList.forEach((stem) => {
      const audio = audioRefs.current[stem.name];
      if (audio) audio.play().catch(() => {});
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
    stemsList.forEach((stem) => {
      const audio = audioRefs.current[stem.name];
      if (audio) audio.pause();
    });
  };

  const handleStemEnded = () => {
    // Check if all stems have ended
    const allEnded = stemsList.every((stem) => {
      const audio = audioRefs.current[stem.name];
      return !audio || audio.ended;
    });
    if (allEnded) setIsPlaying(false);
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
      className={`rounded-lg border border-purple-200/30 bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-4 space-y-3 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">Stem Mixer</h3>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={isPlaying ? handlePause : handlePlay}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Stems */}
      <div className="space-y-2.5">
        <AnimatePresence>
          {stemsList.map((stem) => {
            const isMuted = muted[stem.name];
            const isSolo = solo === stem.name;
            const isSoloActive = solo !== null && solo !== stem.name;

            return (
              <motion.div
                key={stem.name}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`rounded-lg border p-2.5 transition-all ${
                  isSoloActive
                    ? "border-gray-200/30 bg-gray-50/30 opacity-40"
                    : "border-purple-200/50 bg-white/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Stem Icon & Label */}
                  <div className="w-12 flex-shrink-0">
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${stem.color} text-white text-sm`}>
                      {stem.icon}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-gray-700 min-w-fit">
                        {stem.label}
                      </span>
                      <div className="flex gap-0.5 ml-auto">
                        {/* Mute Button */}
                        <button
                          onClick={() => handleToggleMute(stem.name)}
                          className={`p-1 rounded transition-colors ${
                            isMuted
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                        </button>

                        {/* Solo Button */}
                        <button
                          onClick={() => handleToggleSolo(stem.name)}
                          className={`px-1.5 rounded text-xs font-medium transition-colors ${
                            isSolo
                              ? "bg-purple-200 text-purple-700"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={isSolo ? "Unsolo" : "Solo"}
                        >
                          S
                        </button>
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volumes[stem.name]}
                        onChange={(e) => handleVolumeChange(stem.name, parseFloat(e.target.value))}
                        className="flex-1 h-1.5 rounded-full bg-gray-200 appearance-none cursor-pointer accent-purple-600"
                      />
                      <span className="text-xs text-gray-600 w-6 text-right">
                        {Math.round(volumes[stem.name] * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownloadStem(stem)}
                    className="p-1.5 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors flex-shrink-0"
                    title={`Download ${stem.label} stem`}
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
          onEnded={handleStemEnded}
          crossOrigin="anonymous"
        />
      ))}

      {/* Export Custom Mix */}
      {stemSplitId && (
        <div className="pt-2 border-t border-purple-200/40 space-y-2">
          <Button
            size="sm"
            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
            onClick={handleExportMix}
            disabled={exportMixMutation.isPending}
          >
            {exportMixMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                Mixing… this may take a moment
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Export Custom Mix
              </>
            )}
          </Button>
          {exportedUrl && (
            <a
              href={exportedUrl}
              download={`${trackTitle}-custom-mix.mp3`}
              className="flex items-center justify-center gap-2 w-full py-1.5 px-3 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Custom Mix
            </a>
          )}
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-gray-600 mt-2">
        💡 Adjust volumes, mute/solo stems, then export your custom mix.
      </p>
    </motion.div>
  );
}
