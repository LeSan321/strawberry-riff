import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { downloadAllStems } from "@/lib/downloadUtils";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Play,
  Pause,
  Volume2,
  Download,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { StemMixer } from "@/components/StemMixer";

const STEM_THEMES = [
  {
    name: "Vocals",
    emoji: "🎤",
    color: "from-pink-500 to-rose-500",
    description: "Isolated voice track",
    waveformColor: "#ec4899",
    buttonAccent: "bg-pink-700 hover:bg-pink-600",
  },
  {
    name: "Instrumental",
    emoji: "🎸",
    color: "from-green-500 to-emerald-500",
    description: "Music without vocals",
    waveformColor: "#10b981",
    buttonAccent: "bg-green-700 hover:bg-green-600",
  },
  {
    name: "Drums",
    emoji: "🥁",
    color: "from-orange-500 to-yellow-500",
    description: "Percussion and rhythm",
    waveformColor: "#f97316",
    buttonAccent: "bg-orange-700 hover:bg-orange-600",
  },
  {
    name: "Bass",
    emoji: "🎹",
    color: "from-purple-500 to-indigo-500",
    description: "Bass guitar and low frequencies",
    waveformColor: "#a855f7",
    buttonAccent: "bg-purple-700 hover:bg-purple-600",
  },
  {
    name: "Other",
    emoji: "🎺",
    color: "from-cyan-500 to-blue-500",
    description: "Remaining instruments",
    waveformColor: "#06b6d4",
    buttonAccent: "bg-cyan-700 hover:bg-cyan-600",
  },
];

interface StemData {
  name: string;
  emoji: string;
  url?: string | null;
  color: string;
  description: string;
  waveformColor: string;
}

export function StemsStudio() {
  const { generationId } = useParams<{ generationId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [stemVolumes, setStemVolumes] = useState<Record<string, number>>({
    Vocals: 100,
    Instrumental: 100,
    Drums: 100,
    Bass: 100,
    Other: 100,
  });
  const [downloadingStems, setDownloadingStems] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  const stemWaveRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const waveSurferInstances = useRef<Record<string, WaveSurfer | null>>({});

  // Fetch stem split data
  const { data: stemSplit } = trpc.stemsplit.getTrackStemSplit.useQuery({
    generationId: parseInt(generationId || "0"),
  });

  const { data: generation } = trpc.musicGeneration.getById.useQuery({
    id: parseInt(generationId || "0"),
  });

  // Build stem data array with proxy URLs to bypass CORS - memoized to prevent infinite re-renders
  const stems: StemData[] = useMemo(() => {
    if (!generationId || !stemSplit?.stems) return [];
    const buildProxyUrl = (stemType: string) => `/api/stems/audio/${generationId}/${stemType}`;
    return [
      {
        name: "Vocals",
        emoji: "🎤",
        url: stemSplit.stems.vocalUrl ? buildProxyUrl("vocals") : undefined,
        color: "from-pink-500 to-rose-500",
        description: "Isolated voice track",
        waveformColor: "#ec4899",
      },
      {
        name: "Instrumental",
        emoji: "🎸",
        url: stemSplit.stems.otherUrl ? buildProxyUrl("other") : undefined,
        color: "from-green-500 to-emerald-500",
        description: "Music without vocals",
        waveformColor: "#10b981",
      },
      {
        name: "Drums",
        emoji: "🥁",
        url: stemSplit.stems.drumsUrl ? buildProxyUrl("drums") : undefined,
        color: "from-orange-500 to-yellow-500",
        description: "Percussion and rhythm",
        waveformColor: "#f97316",
      },
      {
        name: "Bass",
        emoji: "🎹",
        url: stemSplit.stems.bassUrl ? buildProxyUrl("bass") : undefined,
        color: "from-purple-500 to-indigo-500",
        description: "Bass guitar and low frequencies",
        waveformColor: "#a855f7",
      },
      {
        name: "Other",
        emoji: "🎺",
        url: stemSplit.stems.pianoUrl ? buildProxyUrl("piano") : undefined,
        color: "from-cyan-500 to-blue-500",
        description: "Remaining instruments",
        waveformColor: "#06b6d4",
      },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId, stemSplit?.stems?.vocalUrl, stemSplit?.stems?.drumsUrl, stemSplit?.stems?.bassUrl, stemSplit?.stems?.otherUrl, stemSplit?.stems?.pianoUrl]);

  // Initialize master waveform
  useEffect(() => {
    if (!generation?.audioUrl) return;
    const masterContainer = stemWaveRefs.current["Master"];
    if (!masterContainer || waveSurferInstances.current["Master"]) return;

    const masterWaveSurfer = WaveSurfer.create({
      container: masterContainer,
      waveColor: "#a78bfa",
      progressColor: "#ffffff",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
      cursorColor: "#ffffff",
      cursorWidth: 2,
    });
    masterWaveSurfer.on("error", (error) => console.error("[WaveSurfer] Error loading Master:", error));
    masterWaveSurfer.on("ready", () => console.log("[WaveSurfer] Master waveform ready"));
    console.log("[WaveSurfer] Loading Master from:", generation.audioUrl.substring(0, 100));
    masterWaveSurfer.load(generation.audioUrl);
    waveSurferInstances.current["Master"] = masterWaveSurfer;

    return () => {
      masterWaveSurfer.destroy();
      waveSurferInstances.current["Master"] = null;
    };
  }, [generation?.audioUrl]);

  // Initialize individual stem waveforms — runs after stems array is populated and DOM refs are attached
  useEffect(() => {
    if (stems.length === 0) return;

    // Use a short timeout to ensure DOM refs are attached after render
    const timer = setTimeout(() => {
      stems.forEach((stem) => {
        if (!stem.url) return;
        const container = stemWaveRefs.current[stem.name];
        if (!container || waveSurferInstances.current[stem.name]) return;

        const waveSurfer = WaveSurfer.create({
          container: container,
          waveColor: stem.waveformColor,
          progressColor: "#ffffff",
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 60,
          normalize: true,
          cursorColor: "#ffffff",
          cursorWidth: 2,
          fetchParams: { credentials: "include" },
        });

        waveSurfer.on("error", (error) => console.error(`[WaveSurfer] Error loading ${stem.name}:`, error));
        waveSurfer.on("ready", () => console.log(`[WaveSurfer] Waveform ready for ${stem.name}`));
        console.log(`[WaveSurfer] Loading ${stem.name} from:`, stem.url?.substring(0, 100));
        waveSurfer.load(stem.url);
        waveSurferInstances.current[stem.name] = waveSurfer;

        const volume = stemVolumes[stem.name] / 100;
        if (!isNaN(volume) && isFinite(volume)) waveSurfer.setVolume(volume);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      // Destroy stem waveforms (not master)
      stems.forEach((stem) => {
        const ws = waveSurferInstances.current[stem.name];
        if (ws) {
          ws.destroy();
          waveSurferInstances.current[stem.name] = null;
        }
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stems]);

  // Update volumes
  useEffect(() => {
    Object.entries(stemVolumes).forEach(([stemName, volume]) => {
      const ws = waveSurferInstances.current[stemName];
      if (!ws) return;
      const normalizedVolume = volume / 100;
      if (!isNaN(normalizedVolume) && isFinite(normalizedVolume)) {
        ws.setVolume(normalizedVolume);
      }
    });
  }, [stemVolumes]);

  const handleDownloadAll = async () => {
    if (!generation) return;
    setDownloadingAll(true);
    try {
      await downloadAllStems(parseInt(generationId || "0"), generation.title);
      toast.success("Stems downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download stems");
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleStemPlay = (stemName: string) => {
    const ws = waveSurferInstances.current[stemName];
    if (ws) {
      ws.playPause();
    }
  };

  const handleMasterPlay = () => {
    const ws = waveSurferInstances.current["Master"];
    if (ws) {
      ws.playPause();
    }
  };

  const handleDownloadStem = async (stemName: string) => {
    const stem = stems.find((s) => s.name === stemName);
    if (!stem?.url) return;

      setDownloadingStems((prev) => new Set(Array.from(prev).concat(stemName)));
    try {
      const link = document.createElement("a");
      link.href = stem.url;
      link.download = `${generation?.title || "stem"}_${stemName.toLowerCase()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${stemName} downloaded!`);
    } catch (error) {
      toast.error(`Failed to download ${stemName}`);
    } finally {
      setDownloadingStems((prev) => {
        const next = new Set(Array.from(prev));
        next.delete(stemName);
        return next;
      });
    }
  };

  const theme = STEM_THEMES.find((t) => t.name === "Vocals") || STEM_THEMES[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/generate")}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  🎵 Stems Studio
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {generation?.title || "Untitled"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Download Warning */}
        {stemSplit?.status === "completed" && (
          <Card className="border-amber-900/50 bg-amber-950/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="font-semibold text-amber-200">
                  Download your files to start the 30-day retention period
                </h3>
                <p className="text-sm text-amber-300/80 mt-1">
                  Your stems will be automatically deleted on{" "}
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}{" "}
                  (30 days remaining). Download them now to keep forever.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Master Mix Section */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            🎵 Master Mix
          </h2>
          <Card className="border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                size="lg"
                className={`rounded-full ${theme.buttonAccent}`}
                onClick={handleMasterPlay}
              >
                <Play className="w-5 h-5" />
              </Button>
              <div
                ref={(el) => {
                  if (el) stemWaveRefs.current["Master"] = el;
                }}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">100%</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className={`gap-2 ${theme.buttonAccent}`}
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadingAll ? "Downloading..." : "Download All as ZIP"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Custom Mix Export Section */}
        {stemSplit?.status === "completed" && stemSplit?.stems && stemSplit.id != null && (
          <div>
            <h2 className="text-xl font-bold mb-4">🎛️ Custom Mix Export</h2>
            <StemMixer
              stems={{
                vocalUrl: stemSplit.stems.vocalUrl ? `/api/stems/audio/${generationId}/vocals` : null,
                drumsUrl: stemSplit.stems.drumsUrl ? `/api/stems/audio/${generationId}/drums` : null,
                bassUrl: stemSplit.stems.bassUrl ? `/api/stems/audio/${generationId}/bass` : null,
                otherUrl: stemSplit.stems.otherUrl ? `/api/stems/audio/${generationId}/other` : null,
                pianoUrl: stemSplit.stems.pianoUrl ? `/api/stems/audio/${generationId}/piano` : null,
              }}
              stemSplitId={stemSplit.id}
              trackTitle={generation?.title || "Track"}
            />
          </div>
        )}

        {/* Individual Stems Section */}
        <div>
          <h2 className="text-xl font-bold mb-4">Individual Stems</h2>
          <div className="space-y-4">
            {stems.map((stem) => {
              const stemTheme = STEM_THEMES.find((t) => t.name === stem.name);
              if (!stemTheme) return null;

              return (
                <motion.div
                  key={stem.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-slate-800 bg-gradient-to-r from-slate-900/50 to-slate-800/30 p-6 hover:border-slate-700 transition-colors">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-2xl">{stem.emoji}</span>
                            {stem.name}
                          </h3>
                          <p className="text-sm text-slate-400 mt-1">
                            {stem.description}
                          </p>
                        </div>
                      </div>

                      {/* Waveform and Controls */}
                      <div className="flex items-center justify-between gap-4">
                        <Button
                          size="sm"
                          className={`rounded-full ${stemTheme.buttonAccent}`}
                          onClick={() => handleStemPlay(stem.name)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>

                        <div
                          ref={(el) => {
                            if (el) stemWaveRefs.current[stem.name] = el;
                          }}
                          className="flex-1 min-h-[60px]"
                        />

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className="w-4 h-4 text-slate-400" />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={stemVolumes[stem.name]}
                              onChange={(e) =>
                                setStemVolumes({
                                  ...stemVolumes,
                                  [stem.name]: parseInt(e.target.value),
                                })
                              }
                              className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-medium w-10">
                              {stemVolumes[stem.name]}%
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadStem(stem.name)}
                            disabled={downloadingStems.has(stem.name)}
                            className="gap-2"
                          >
                            {downloadingStems.has(stem.name) ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            {downloadingStems.has(stem.name) ? "Downloading..." : "Download"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
