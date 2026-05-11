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
  Music,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader,
  AlertCircle,
  Volume1,
  Volume,
} from "lucide-react";

// ─── Studio Theme Definitions (mirrored from Studio.tsx) ─────────────────────
const STUDIO_THEMES = [
  {
    id: "forest-studio",
    name: "Forest Studio",
    image: "/manus-storage/studio-header-forest-studio_81baaef0.jpg",
    accent: "from-emerald-600 to-teal-700",
    sidebarBg: "bg-[#0a1f14]",
    canvasBg: "bg-[#0a1f14]",
    textAccent: "text-emerald-400",
    raspberryAccent: "text-rose-400",
    borderAccent: "border-emerald-900/50",
    buttonAccent: "bg-emerald-700 hover:bg-emerald-600",
  },
  {
    id: "cozy-den",
    name: "Cozy Den",
    image: "/manus-storage/studio-header-cozy-den_20475e46.jpg",
    accent: "from-amber-600 to-orange-700",
    sidebarBg: "bg-[#1f1208]",
    canvasBg: "bg-[#1f1208]",
    textAccent: "text-amber-400",
    raspberryAccent: "text-amber-300",
    borderAccent: "border-amber-900/50",
    buttonAccent: "bg-amber-700 hover:bg-amber-600",
  },
  {
    id: "producer-workshop",
    name: "Producer's Workshop",
    image: "/manus-storage/studio-header-producer-workshop_df572a47.jpg",
    accent: "from-indigo-700 to-purple-800",
    sidebarBg: "bg-[#0d0a1f]",
    canvasBg: "bg-[#0d0a1f]",
    textAccent: "text-indigo-400",
    raspberryAccent: "text-indigo-300",
    borderAccent: "border-indigo-900/50",
    buttonAccent: "bg-indigo-700 hover:bg-indigo-600",
  },
  {
    id: "rock-room",
    name: "Rock Room",
    image: "/manus-storage/studio-header-rock-room_606b6222.jpg",
    accent: "from-rose-700 to-red-800",
    sidebarBg: "bg-[#1f0a0a]",
    canvasBg: "bg-[#1f0a0a]",
    textAccent: "text-rose-400",
    raspberryAccent: "text-rose-300",
    borderAccent: "border-rose-900/50",
    buttonAccent: "bg-rose-700 hover:bg-rose-600",
  },
];

interface StemData {
  name: string;
  emoji: string;
  url?: string;
  color: string;
  gradient: string;
}

interface StemPlayerState {
  [key: string]: {
    isPlaying: boolean;
    volume: number;
    isMuted: boolean;
    isSolo: boolean;
  };
}

export function StemsStudio() {
  const { generationId } = useParams<{ generationId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isPlayingMaster, setIsPlayingMaster] = useState(false);
  const [masterVolume, setMasterVolume] = useState(100);
  const [showPastSplits, setShowPastSplits] = useState(false);
  const [stemStates, setStemStates] = useState<StemPlayerState>({});
  const masterAudioRef = useRef<HTMLAudioElement>(null);
  const stemAudioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // Get user's theme preference
  const { data: studioPrefs } = trpc.studio.getPreferences.useQuery();
  const themeId = studioPrefs?.studioTheme || "forest-studio";
  const theme = STUDIO_THEMES.find((t) => t.id === themeId) || STUDIO_THEMES[0];

  // Get the stem split for this generation
  const { data: stemSplit, isLoading } = trpc.stemsplit.getTrackStemSplit.useQuery({
    generationId: parseInt(generationId || "0"),
  });

  // Get generation details for title
  const { data: generation } = trpc.musicGeneration.getById.useQuery({
    id: parseInt(generationId || "0"),
  });

  // Get user's stem splits history
  const { data: stemSplits } = trpc.stemsplit.getUserStemSplits.useQuery();

  // Initialize stem states
  useEffect(() => {
    if (stemSplit?.stems) {
      const initialStates: StemPlayerState = {};
      ["Vocals", "Drums", "Bass", "Other", "Piano"].forEach((name) => {
        initialStates[name] = {
          isPlaying: false,
          volume: 100,
          isMuted: false,
          isSolo: false,
        };
      });
      setStemStates(initialStates);
    }
  }, [stemSplit]);

  if (!user) {
    return (
      <div className={`min-h-screen ${theme.canvasBg} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-foreground">Please log in to view stems.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme.canvasBg} flex items-center justify-center`}>
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-foreground" />
          <p className="text-foreground">Loading stems...</p>
        </div>
      </div>
    );
  }

  if (!stemSplit || stemSplit.status !== "completed") {
    return (
      <div className={`min-h-screen ${theme.canvasBg} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-foreground">Stems not ready yet. Please try again in a moment.</p>
          <Button
            variant="outline"
            onClick={() => navigate("/studio")}
            className="mt-4 border-white/20 hover:bg-white/10"
          >
            Back to Generate
          </Button>
        </div>
      </div>
    );
  }

  // Build stem data array
  const stems: StemData[] = [
    {
      name: "Vocals",
      emoji: "🎤",
      url: stemSplit.stems?.vocalUrl || undefined,
      color: "from-pink-500 to-rose-500",
      gradient: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    },
    {
      name: "Drums",
      emoji: "🥁",
      url: stemSplit.stems?.drumsUrl || undefined,
      color: "from-orange-500 to-yellow-500",
      gradient: "bg-gradient-to-br from-orange-500/20 to-yellow-500/20",
    },
    {
      name: "Bass",
      emoji: "🎸",
      url: stemSplit.stems?.bassUrl || undefined,
      color: "from-purple-500 to-indigo-500",
      gradient: "bg-gradient-to-br from-purple-500/20 to-indigo-500/20",
    },
    {
      name: "Other",
      emoji: "🎹",
      url: stemSplit.stems?.otherUrl || undefined,
      color: "from-cyan-500 to-blue-500",
      gradient: "bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
    },
    {
      name: "Piano",
      emoji: "🎺",
      url: stemSplit.stems?.pianoUrl || undefined,
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
    },
  ];

  const handleMasterPlay = () => {
    if (masterAudioRef.current) {
      if (isPlayingMaster) {
        masterAudioRef.current.pause();
      } else {
        masterAudioRef.current.play();
      }
      setIsPlayingMaster(!isPlayingMaster);
    }
  };

  const handleStemPlay = (stemName: string) => {
    const audio = stemAudioRefs.current[stemName];
    if (audio) {
      if (audio.paused) {
        audio.play();
        setStemStates((prev) => ({
          ...prev,
          [stemName]: { ...prev[stemName], isPlaying: true },
        }));
      } else {
        audio.pause();
        setStemStates((prev) => ({
          ...prev,
          [stemName]: { ...prev[stemName], isPlaying: false },
        }));
      }
    }
  };

  const handleStemVolume = (stemName: string, volume: number) => {
    const audio = stemAudioRefs.current[stemName];
    if (audio) {
      audio.volume = volume / 100;
      setStemStates((prev) => ({
        ...prev,
        [stemName]: { ...prev[stemName], volume },
      }));
    }
  };

  const handleStemMute = (stemName: string) => {
    const audio = stemAudioRefs.current[stemName];
    if (audio) {
      const isMuted = !stemStates[stemName]?.isMuted;
      audio.muted = isMuted;
      setStemStates((prev) => ({
        ...prev,
        [stemName]: { ...prev[stemName], isMuted },
      }));
    }
  };

  const handleDownloadStem = (stem: StemData) => {
    if (!stem.url) {
      toast.error("Stem URL not available");
      return;
    }

    const link = document.createElement("a");
    link.href = stem.url;
    link.download = `${stem.name}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${stem.name}`);
  };

  const handleDownloadAll = async () => {
    if (!stemSplit?.stems) {
      toast.error("Stems not available");
      return;
    }

    try {
      toast.info("Creating ZIP file...");
      await downloadAllStems(
        {
          vocals: stemSplit.stems.vocalUrl,
          drums: stemSplit.stems.drumsUrl,
          bass: stemSplit.stems.bassUrl,
          other: stemSplit.stems.otherUrl,
          piano: stemSplit.stems.pianoUrl,
        },
        generation?.title || "stems"
      );
      toast.success("Stems downloaded as ZIP!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download stems");
    }
  };

  return (
    <div className={`min-h-screen ${theme.canvasBg} text-foreground`}>
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className={`w-8 h-8 ${theme.textAccent}`} />
            <h1 className="text-3xl font-bold">Stems Studio</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/studio")}
            className="text-foreground hover:bg-white/10"
          >
            🚪 Back to Generate
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Master Mix Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Card
            className={`p-8 border ${theme.borderAccent} bg-white/5 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-4 mb-6">
              <Music className={`w-6 h-6 ${theme.textAccent}`} />
              <h2 className="text-2xl font-bold">Master Mix</h2>
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <Button
                size="lg"
                onClick={handleMasterPlay}
                className={`${theme.buttonAccent} text-white`}
              >
                {isPlayingMaster ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <div className="flex-1 min-w-[200px]">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value);
                    setMasterVolume(vol);
                    if (masterAudioRef.current) {
                      masterAudioRef.current.volume = vol / 100;
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-medium w-12 text-right">{masterVolume}%</span>
              </div>

              <Button
                variant="outline"
                onClick={handleDownloadAll}
                className="border-white/20 hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <audio
              ref={masterAudioRef}
              src={stemSplit.stems?.vocalUrl || ""}
              onEnded={() => setIsPlayingMaster(false)}
            />
          </Card>
        </motion.div>

        {/* Individual Stems Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold mb-6">Individual Stems</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {stems.map((stem) => {
              const state = stemStates[stem.name] || {
                isPlaying: false,
                volume: 100,
                isMuted: false,
              };

              return (
                <motion.div
                  key={stem.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`p-6 border ${theme.borderAccent} ${stem.gradient} backdrop-blur-sm transition-all hover:border-white/30`}
                  >
                    <div className="text-4xl mb-3">{stem.emoji}</div>
                    <h3 className="font-bold text-lg mb-4">{stem.name}</h3>

                    <div className="space-y-3">
                      {/* Play Button */}
                      <Button
                        size="sm"
                        className={`w-full justify-center text-white ${
                          state.isPlaying
                            ? theme.buttonAccent
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                        onClick={() => handleStemPlay(stem.name)}
                      >
                        {state.isPlaying ? (
                          <Pause className="w-4 h-4 mr-2" />
                        ) : (
                          <Play className="w-4 h-4 mr-2" />
                        )}
                        {state.isPlaying ? "Playing" : "Play"}
                      </Button>

                      {/* Volume Slider */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Volume</span>
                          <span>{state.volume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={state.volume}
                          onChange={(e) =>
                            handleStemVolume(stem.name, parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Mute Button */}
                      <Button
                        size="sm"
                        variant={state.isMuted ? "default" : "outline"}
                        className={`w-full ${
                          state.isMuted
                            ? "bg-red-600 hover:bg-red-700 border-red-600"
                            : "border-white/20 hover:bg-white/10"
                        }`}
                        onClick={() => handleStemMute(stem.name)}
                      >
                        {state.isMuted ? (
                          <Volume className="w-4 h-4 mr-2" />
                        ) : (
                          <Volume1 className="w-4 h-4 mr-2" />
                        )}
                        {state.isMuted ? "Muted" : "Mute"}
                      </Button>

                      {/* Download Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-white/20 hover:bg-white/10"
                        onClick={() => handleDownloadStem(stem)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <audio
                      ref={(el) => {
                        if (el) stemAudioRefs.current[stem.name] = el;
                      }}
                      src={stem.url || ""}
                      onEnded={() => {
                        setStemStates((prev) => ({
                          ...prev,
                          [stem.name]: { ...prev[stem.name], isPlaying: false },
                        }));
                      }}
                    />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Past Splits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card
            className={`p-6 border ${theme.borderAccent} bg-white/5 backdrop-blur-sm cursor-pointer`}
            onClick={() => setShowPastSplits(!showPastSplits)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`w-5 h-5 ${theme.textAccent}`} />
                <h3 className="font-bold text-lg">Past Splits</h3>
              </div>
              {showPastSplits ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>

            {showPastSplits && (
              <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
                {stemSplits && stemSplits.length > 0 ? (
                  stemSplits.map((split) => (
                    <div
                      key={split.id}
                      className="p-3 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">
                            {split.createdAt
                              ? new Date(split.createdAt).toLocaleDateString()
                              : "Unknown date"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Status: {split.status}
                          </p>
                        </div>
                        {split.status === "completed" && (
                          <Music className={`w-4 h-4 ${theme.textAccent}`} />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No past splits yet</p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Placeholder Sections for Future Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className={`p-8 border-dashed border-2 ${theme.borderAccent} bg-white/5 backdrop-blur-sm`}
          >
            <div className="text-center">
              <Music className={`w-8 h-8 ${theme.textAccent} mx-auto mb-3 opacity-50`} />
              <h3 className="font-bold text-lg mb-2 opacity-50">Remix Studio</h3>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          </Card>

          <Card
            className={`p-8 border-dashed border-2 ${theme.borderAccent} bg-white/5 backdrop-blur-sm`}
          >
            <div className="text-center">
              <Music className={`w-8 h-8 ${theme.textAccent} mx-auto mb-3 opacity-50`} />
              <h3 className="font-bold text-lg mb-2 opacity-50">Stem Packs</h3>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
