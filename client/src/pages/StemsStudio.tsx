import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { downloadAllStems } from "@/lib/downloadUtils";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { StemMixer } from "@/components/StemMixer";

// ── Stem theme definitions ────────────────────────────────────────────────────
const STEM_THEMES: Record<string, {
  emoji: string;
  color: string;
  description: string;
  waveformColor: string;
  buttonAccent: string;
  borderAccent: string;
}> = {
  Vocals: {
    emoji: "🎤",
    color: "from-pink-500 to-rose-500",
    description: "Isolated voice track",
    waveformColor: "#ec4899",
    buttonAccent: "bg-pink-700 hover:bg-pink-600",
    borderAccent: "border-pink-500/30",
  },
  Instrumental: {
    emoji: "🎵",
    color: "from-green-500 to-emerald-500",
    description: "Music without vocals",
    waveformColor: "#10b981",
    buttonAccent: "bg-green-700 hover:bg-green-600",
    borderAccent: "border-green-500/30",
  },
  Drums: {
    emoji: "🥁",
    color: "from-orange-500 to-yellow-500",
    description: "Percussion and rhythm",
    waveformColor: "#f97316",
    buttonAccent: "bg-orange-700 hover:bg-orange-600",
    borderAccent: "border-orange-500/30",
  },
  Bass: {
    emoji: "🎸",
    color: "from-purple-500 to-indigo-500",
    description: "Bass guitar and low frequencies",
    waveformColor: "#a855f7",
    buttonAccent: "bg-purple-700 hover:bg-purple-600",
    borderAccent: "border-purple-500/30",
  },
  Piano: {
    emoji: "🎹",
    color: "from-cyan-500 to-blue-500",
    description: "Piano and keys",
    waveformColor: "#06b6d4",
    buttonAccent: "bg-cyan-700 hover:bg-cyan-600",
    borderAccent: "border-cyan-500/30",
  },
  Guitar: {
    emoji: "🎸",
    color: "from-amber-500 to-orange-500",
    description: "Guitar tracks",
    waveformColor: "#f59e0b",
    buttonAccent: "bg-amber-700 hover:bg-amber-600",
    borderAccent: "border-amber-500/30",
  },
};

interface StemData {
  name: string;
  url?: string | null;
}

// ── WaveSurfer skeleton bar heights (stable — no Math.random in render) ───────
const MASTER_BARS = Array.from({ length: 80 }, (_, i) => 25 + Math.sin(i * 0.3) * 18);
const STEM_BARS = Array.from({ length: 60 }, (_, i) => 20 + Math.sin(i * 0.4) * 15 + (i % 7) * 1.4);

export function StemsStudio() {
  const { generationId } = useParams<{ generationId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [stemVolumes, setStemVolumes] = useState<Record<string, number>>({});
  const [downloadingStems, setDownloadingStems] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);

  // Play/pause state tracked per WaveSurfer key
  const [playingKeys, setPlayingKeys] = useState<Set<string>>(new Set());
  // Track which waveforms have finished loading (ready event fired)
  const [readyKeys, setReadyKeys] = useState<Set<string>>(new Set());

  // Refs for WaveSurfer containers and instances
  const waveSurferInstances = useRef<Record<string, WaveSurfer | null>>({});
  const loadedUrls = useRef<Record<string, string>>({});

  // ── Lazy loading queue ──────────────────────────────────────────────────────
  // We load WaveSurfer instances one at a time with a small stagger to avoid
  // hammering the browser with 6 simultaneous audio decodes on Chrome.
  const lazyLoadQueue = useRef<Array<{ key: string; container: HTMLDivElement; url: string; color: string }>>([]);
  const isLoadingWave = useRef(false);

  // Fetch stem split data
  const { data: stemSplit, refetch: refetchStemSplit } = trpc.stemsplit.getTrackStemSplit.useQuery({
    generationId: parseInt(generationId || "0"),
  });

  const { data: generation } = trpc.musicGeneration.getById.useQuery({
    id: parseInt(generationId || "0"),
  });

  // Retry stem split mutation for stuck jobs
  const retryStemSplitMutation = trpc.stemsplit.startStemSplit.useMutation({
    onSuccess: () => {
      toast.success("Stem split restarted! Check back in a few minutes.");
      refetchStemSplit();
    },
    onError: (err) => {
      toast.error("Failed to retry: " + err.message);
    },
  });

  // Build stem data array with proxy URLs — memoized to prevent infinite re-renders
  const stems: StemData[] = useMemo(() => {
    if (!generationId || !stemSplit?.stems) return [];
    const buildProxyUrl = (stemType: string) => `/api/stems/audio/${generationId}/${stemType}`;
    return [
      { name: "Vocals",       url: stemSplit.stems.vocalUrl  ? buildProxyUrl("vocals")  : undefined },
      { name: "Instrumental", url: stemSplit.stems.otherUrl  ? buildProxyUrl("other")   : undefined },
      { name: "Drums",        url: stemSplit.stems.drumsUrl  ? buildProxyUrl("drums")   : undefined },
      { name: "Bass",         url: stemSplit.stems.bassUrl   ? buildProxyUrl("bass")    : undefined },
      { name: "Piano",        url: stemSplit.stems.pianoUrl  ? buildProxyUrl("piano")   : undefined },
      { name: "Guitar",       url: stemSplit.stems.guitarUrl ? buildProxyUrl("guitar")  : undefined },
    ].filter((s) => s.url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    generationId,
    stemSplit?.stems?.vocalUrl,
    stemSplit?.stems?.drumsUrl,
    stemSplit?.stems?.bassUrl,
    stemSplit?.stems?.otherUrl,
    stemSplit?.stems?.pianoUrl,
    stemSplit?.stems?.guitarUrl,
  ]);

  // Initialize volume state when stems load
  useEffect(() => {
    if (stems.length === 0) return;
    setStemVolumes((prev) => {
      const next = { ...prev };
      stems.forEach((s) => {
        if (!(s.name in next)) next[s.name] = 100;
      });
      return next;
    });
  }, [stems]);

  // ── Lazy WaveSurfer loader ──────────────────────────────────────────────────
  const processLazyQueue = useCallback(() => {
    if (isLoadingWave.current || lazyLoadQueue.current.length === 0) return;

    const { key, container, url, color } = lazyLoadQueue.current.shift()!;

    // Skip if already loaded this URL
    if (loadedUrls.current[key] === url && waveSurferInstances.current[key]) {
      processLazyQueue(); // immediately try next
      return;
    }

    isLoadingWave.current = true;

    // Destroy any existing instance
    const existing = waveSurferInstances.current[key];
    if (existing) {
      existing.destroy();
      waveSurferInstances.current[key] = null;
    }

    const ws = WaveSurfer.create({
      container,
      waveColor: color,
      progressColor: "rgba(255,255,255,0.35)",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 60,
      normalize: true,
      cursorColor: "rgba(255,255,255,0.7)",
      cursorWidth: 2,
    });

    ws.on("error", (err) => console.error(`[WaveSurfer] Error loading ${key}:`, err));

    ws.on("ready", () => {
      console.log(`[WaveSurfer] Ready: ${key}`);
      setReadyKeys((prev) => { const next = new Set(Array.from(prev)); next.add(key); return next; });
      isLoadingWave.current = false;
      // Load next after a short stagger to keep the browser responsive
      setTimeout(processLazyQueue, 150);
    });

    ws.on("play", () => {
      setPlayingKeys((prev) => { const next = new Set(Array.from(prev)); next.add(key); return next; });
    });
    ws.on("pause", () => {
      setPlayingKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
    });
    ws.on("finish", () => {
      setPlayingKeys((prev) => { const next = new Set(prev); next.delete(key); return next; });
    });

    ws.load(url);
    waveSurferInstances.current[key] = ws;
    loadedUrls.current[key] = url;
  }, []);

  const enqueueWaveSurfer = useCallback((
    key: string,
    container: HTMLDivElement,
    url: string,
    color: string,
  ) => {
    // Already loaded this URL — skip
    if (loadedUrls.current[key] === url && waveSurferInstances.current[key]) return;
    // Remove any existing queued entry for this key
    lazyLoadQueue.current = lazyLoadQueue.current.filter((e) => e.key !== key);
    lazyLoadQueue.current.push({ key, container, url, color });
    processLazyQueue();
  }, [processLazyQueue]);

  // Use proxy URL for master mix
  const masterProxyUrl = generationId ? `/api/stems/audio/${generationId}/master` : null;

  // Ref callback for the master mix container — fires when the element mounts
  const masterContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el || !masterProxyUrl) return;
    enqueueWaveSurfer("Master", el, masterProxyUrl, "#a78bfa");
  }, [masterProxyUrl, enqueueWaveSurfer]);

  // When master proxy URL changes and container is already mounted, reload
  useEffect(() => {
    const ws = waveSurferInstances.current["Master"];
    if (!ws || !masterProxyUrl) return;
    if (loadedUrls.current["Master"] !== masterProxyUrl) {
      ws.load(masterProxyUrl);
      loadedUrls.current["Master"] = masterProxyUrl;
    }
  }, [masterProxyUrl]);

  // Ref callback factory for individual stems
  const makeStemRef = useCallback((stem: StemData) => (el: HTMLDivElement | null) => {
    if (!el || !stem.url) return;
    const theme = STEM_THEMES[stem.name];
    enqueueWaveSurfer(stem.name, el, stem.url, theme?.waveformColor ?? "#a78bfa");
  }, [enqueueWaveSurfer]);

  // When stems URLs change and containers are already mounted, reload
  useEffect(() => {
    stems.forEach((stem) => {
      if (!stem.url) return;
      const ws = waveSurferInstances.current[stem.name];
      if (ws && loadedUrls.current[stem.name] !== stem.url) {
        ws.load(stem.url);
        loadedUrls.current[stem.name] = stem.url;
      }
    });
  }, [stems]);

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

  // Cleanup all WaveSurfer instances on unmount
  useEffect(() => {
    return () => {
      Object.values(waveSurferInstances.current).forEach((ws) => {
        if (ws) ws.destroy();
      });
      waveSurferInstances.current = {};
      loadedUrls.current = {};
      lazyLoadQueue.current = [];
    };
  }, []);

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
    if (ws) ws.playPause();
  };

  const handleMasterPlay = () => {
    const ws = waveSurferInstances.current["Master"];
    if (ws) ws.playPause();
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

  const handleRetryStemSplit = () => {
    if (!generationId) return;
    retryStemSplitMutation.mutate({ generationId: parseInt(generationId) });
  };

  const isMasterPlaying = playingKeys.has("Master");

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
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                  Stems Studio
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

        {/* Pending / Failed status with retry */}
        {stemSplit && stemSplit.status !== "completed" && (
          <Card className="border-slate-700 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {stemSplit.status === "pending" || stemSplit.status === "processing" ? (
                  <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                ) : (
                  <span className="text-2xl">⚠️</span>
                )}
                <div>
                  <p className="font-semibold text-white capitalize">{stemSplit.status}</p>
                  <p className="text-sm text-slate-400">
                    {stemSplit.status === "pending" || stemSplit.status === "processing"
                      ? "Stem separation is in progress. This usually takes 1–3 minutes."
                      : stemSplit.error || "Stem separation failed. You can retry below."}
                  </p>
                </div>
              </div>
              {(stemSplit.status === "failed" || stemSplit.status === "pending") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-violet-500/40 text-violet-300 hover:bg-violet-500/10 flex-shrink-0"
                  onClick={handleRetryStemSplit}
                  disabled={retryStemSplitMutation.isPending}
                >
                  {retryStemSplitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Retry
                </Button>
              )}
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
                className={`rounded-full flex-shrink-0 ${isMasterPlaying ? "bg-violet-600 hover:bg-violet-500" : "bg-pink-700 hover:bg-pink-600"}`}
                onClick={handleMasterPlay}
              >
                {isMasterPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <div className="flex-1 relative min-h-[60px]">
                {/* Loading skeleton for master mix */}
                {!readyKeys.has("Master") && masterProxyUrl && (
                  <div className="absolute inset-0 flex items-center gap-0.5 px-1 overflow-hidden">
                    {MASTER_BARS.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-slate-700/60 animate-pulse"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                )}
                <div
                  ref={masterContainerRef}
                  className="w-full min-h-[60px]"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium">100%</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="gap-2 bg-pink-700 hover:bg-pink-600 flex-shrink-0"
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

        {/* Two-column layout: Individual Stems + Custom Mix */}
        {stemSplit?.status === "completed" && stems.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Individual Stems — takes 2/3 width on xl */}
            <div className="xl:col-span-2 space-y-4">
              <h2 className="text-xl font-bold">Individual Stems</h2>
              {stems.map((stem) => {
                const theme = STEM_THEMES[stem.name];
                if (!theme) return null;
                const isPlaying = playingKeys.has(stem.name);

                return (
                  <motion.div
                    key={stem.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`border-slate-800 ${theme.borderAccent} bg-gradient-to-r from-slate-900/50 to-slate-800/30 p-6 hover:border-slate-700 transition-colors`}>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              <span className="text-2xl">{theme.emoji}</span>
                              {stem.name}
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">
                              {theme.description}
                            </p>
                          </div>
                        </div>

                        {/* Waveform and Controls */}
                        <div className="flex items-center justify-between gap-4">
                          <Button
                            size="sm"
                            className={`rounded-full flex-shrink-0 ${theme.buttonAccent}`}
                            onClick={() => handleStemPlay(stem.name)}
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>

                          <div className="flex-1 relative min-h-[60px]">
                            {/* Loading skeleton shown until WaveSurfer fires 'ready' */}
                            {!readyKeys.has(stem.name) && stem.url && (
                              <div className="absolute inset-0 flex items-center gap-0.5 px-1 overflow-hidden">
                                {STEM_BARS.map((h, i) => (
                                  <div
                                    key={i}
                                    className="flex-1 rounded-sm bg-slate-700/60 animate-pulse"
                                    style={{ height: `${h}px` }}
                                  />
                                ))}
                              </div>
                            )}
                            <div
                              ref={makeStemRef(stem)}
                              className="w-full min-h-[60px]"
                            />
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-slate-400" />
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={stemVolumes[stem.name] ?? 100}
                                onChange={(e) =>
                                  setStemVolumes((prev) => ({
                                    ...prev,
                                    [stem.name]: parseInt(e.target.value),
                                  }))
                                }
                                className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                style={{ accentColor: theme.waveformColor }}
                              />
                              <span className="text-sm font-medium w-10">
                                {stemVolumes[stem.name] ?? 100}%
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

            {/* Custom Mix Export — sticky sidebar on xl */}
            <div className="xl:col-span-1">
              <h2 className="text-xl font-bold mb-4">🎛️ Custom Mix</h2>
              <div className="xl:sticky xl:top-6">
                <StemMixer
                  stems={{
                    vocalUrl:  stemSplit.stems?.vocalUrl  ? `/api/stems/audio/${generationId}/vocals`  : null,
                    drumsUrl:  stemSplit.stems?.drumsUrl  ? `/api/stems/audio/${generationId}/drums`   : null,
                    bassUrl:   stemSplit.stems?.bassUrl   ? `/api/stems/audio/${generationId}/bass`    : null,
                    otherUrl:  stemSplit.stems?.otherUrl  ? `/api/stems/audio/${generationId}/other`   : null,
                    pianoUrl:  stemSplit.stems?.pianoUrl  ? `/api/stems/audio/${generationId}/piano`   : null,
                    guitarUrl: stemSplit.stems?.guitarUrl ? `/api/stems/audio/${generationId}/guitar`  : null,
                  }}
                  stemSplitId={stemSplit.id}
                  trackTitle={generation?.title || "Track"}
                />
              </div>
            </div>
          </div>
        )}

        {/* No stems yet */}
        {stemSplit?.status !== "completed" && stems.length === 0 && !stemSplit && (
          <div>
            <h2 className="text-xl font-bold mb-4">Individual Stems</h2>
            <Card className="border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No stem data found for this track.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
