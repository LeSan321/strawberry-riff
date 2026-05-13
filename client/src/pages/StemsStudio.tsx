import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { downloadAllStems } from "@/lib/downloadUtils";
import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
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
  Volume,
  VolumeX,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

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
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportMixName, setExportMixName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const exportMutation = trpc.stemsplit.exportCustomMix.useMutation();

  const stemWaveRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const waveSurferInstances = useRef<Record<string, WaveSurfer | null>>({});

  // Fetch stem split data
  const { data: stemSplit } = trpc.stemsplit.getTrackStemSplit.useQuery({
    generationId: parseInt(generationId || "0"),
  });

  const { data: generation } = trpc.musicGeneration.getById.useQuery({
    id: parseInt(generationId || "0"),
  });

  // Build stem data array with proxy URLs to bypass CORS
  const buildProxyUrl = (stemType: string) => {
    if (!generationId || !stemSplit?.stems) return undefined;
    return `/api/stems/audio/${generationId}/${stemType}`;
  };

  const stems: StemData[] = [
    {
      name: "Vocals",
      emoji: "🎤",
      url: stemSplit?.stems?.vocalUrl ? buildProxyUrl("vocals") : undefined,
      color: "from-pink-500 to-rose-500",
      description: "Isolated voice track",
      waveformColor: "#ec4899",
    },
    {
      name: "Instrumental",
      emoji: "🎸",
      url: stemSplit?.stems?.otherUrl ? buildProxyUrl("other") : undefined,
      color: "from-green-500 to-emerald-500",
      description: "Music without vocals",
      waveformColor: "#10b981",
    },
    {
      name: "Drums",
      emoji: "🥁",
      url: stemSplit?.stems?.drumsUrl ? buildProxyUrl("drums") : undefined,
      color: "from-orange-500 to-yellow-500",
      description: "Percussion and rhythm",
      waveformColor: "#f97316",
    },
    {
      name: "Bass",
      emoji: "🎹",
      url: stemSplit?.stems?.bassUrl ? buildProxyUrl("bass") : undefined,
      color: "from-purple-500 to-indigo-500",
      description: "Bass guitar and low frequencies",
      waveformColor: "#a855f7",
    },
    {
      name: "Other",
      emoji: "🎺",
      url: stemSplit?.stems?.pianoUrl ? buildProxyUrl("piano") : undefined,
      color: "from-cyan-500 to-blue-500",
      description: "Remaining instruments",
      waveformColor: "#06b6d4",
    },
  ];

  // Initialize waveforms
  useEffect(() => {
    if (!stemSplit?.stems && !generation?.audioUrl) return;

    // Initialize master mix waveform
    if (generation?.audioUrl) {
      const masterContainer = stemWaveRefs.current["Master"];
      if (masterContainer && !waveSurferInstances.current["Master"]) {
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
          // Master audio is on CloudFront (public), no credentials needed
          // Credentials would conflict with CORS wildcard (*) policy
        });

        masterWaveSurfer.on("error", (error) => {
          console.error("[WaveSurfer] Error loading Master:", error);
        });

        masterWaveSurfer.on("ready", () => {
          console.log("[WaveSurfer] Master waveform ready");
        });

        console.log("[WaveSurfer] Loading Master from:", generation.audioUrl.substring(0, 100));
        masterWaveSurfer.load(generation.audioUrl);
        waveSurferInstances.current["Master"] = masterWaveSurfer;
      }
    }

    // Initialize stem waveforms
    if (!stemSplit?.stems) return;

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
        fetchParams: {
          credentials: "include",
        },
      });

      waveSurfer.on("error", (error) => {
        console.error(`[WaveSurfer] Error loading ${stem.name}:`, error);
      });

      waveSurfer.on("ready", () => {
        console.log(`[WaveSurfer] ${stem.name} waveform ready`);
      });

      console.log(`[WaveSurfer] Loading ${stem.name} from:`, stem.url.substring(0, 100));
      waveSurfer.load(stem.url);
      waveSurferInstances.current[stem.name] = waveSurfer;
    });

    return () => {
      Object.values(waveSurferInstances.current).forEach((ws) => {
        if (ws) ws.destroy();
      });
      waveSurferInstances.current = {};
    };
  }, [stemSplit?.stems, generation?.audioUrl]);

  // Update volumes when slider changes
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

  const handleToggleMute = (stemName: string) => {
    setMutedStems((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(stemName)) {
        next.delete(stemName);
        // Restore volume when unmuting
        const ws = waveSurferInstances.current[stemName];
        if (ws) {
          const volume = stemVolumes[stemName] / 100;
          if (!isNaN(volume) && isFinite(volume)) {
            ws.setVolume(volume);
          }
        }
      } else {
        next.add(stemName);
        // Mute by setting volume to 0
        const ws = waveSurferInstances.current[stemName];
        if (ws) {
          ws.setVolume(0);
        }
      }
      return next;
    });
  };

  const handleExportMix = async () => {
    if (!generation) return;
    setIsExporting(true);
    try {
      const result = await exportMutation.mutateAsync({
        generationId: parseInt(generationId || "0"),
        stemVolumes: stemVolumes as { Vocals: number; Instrumental: number; Drums: number; Bass: number; Other: number },
        mixName: exportMixName || undefined,
      });
      
      if (result.success) {
        toast.success(`Mix exported: ${result.fileName}`);
        // Optionally open the download link
        window.open(result.url, "_blank");
        setShowExportDialog(false);
        setExportMixName("");
      }
    } catch (error) {
      toast.error(`Failed to export mix: ${(error as Error).message}`);
    } finally {
      setIsExporting(false);
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

        {/* Master Mix */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportDialog(true)}
                className="gap-2"
              >
                <span>🎚️</span>
                Export Custom Mix
              </Button>
            </div>
          </Card>
        </div>

        {/* Export Custom Mix Dialog */}
        {showExportDialog && (
          <Card className="border-slate-800 bg-slate-900/50 p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Export Custom Mix</h3>
              <p className="text-sm text-slate-400">
                Your current stem volumes will be mixed into a single audio file.
              </p>
              <div>
                <label className="block text-sm font-medium mb-2">Mix Name (optional)</label>
                <input
                  type="text"
                  value={exportMixName}
                  onChange={(e) => setExportMixName(e.target.value)}
                  placeholder="e.g., Vocals Heavy, Drums Only"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg text-sm text-slate-300">
                <p className="font-medium mb-2">Current Mix:</p>
                <ul className="space-y-1">
                  {Object.entries(stemVolumes).map(([name, volume]) => (
                    <li key={name}>
                      {name}: {mutedStems.has(name) ? "0" : volume}%
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(false)}
                  disabled={isExporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExportMix}
                  disabled={isExporting}
                  className={`gap-2 ${theme.buttonAccent}`}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>🎚️</span>
                  )}
                  {isExporting ? "Exporting..." : "Export Mix"}
                </Button>
              </div>
            </div>
          </Card>
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
                              onChange={(e) => {
                                const newVolume = parseInt(e.target.value);
                                setStemVolumes({
                                  ...stemVolumes,
                                  [stem.name]: newVolume,
                                });
                                if (!mutedStems.has(stem.name)) {
                                  const ws = waveSurferInstances.current[stem.name];
                                  if (ws) {
                                    const volume = newVolume / 100;
                                    if (!isNaN(volume) && isFinite(volume)) {
                                      ws.setVolume(volume);
                                    }
                                  }
                                }
                              }}
                              className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-medium w-10">
                              {mutedStems.has(stem.name) ? "0" : stemVolumes[stem.name]}%
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleMute(stem.name)}
                            className={mutedStems.has(stem.name) ? "bg-slate-700 border-slate-600" : ""}
                            title={mutedStems.has(stem.name) ? "Unmute" : "Mute"}
                          >
                            {mutedStems.has(stem.name) ? (
                              <VolumeX className="w-4 h-4" />
                            ) : (
                              <Volume className="w-4 h-4" />
                            )}
                          </Button>
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
