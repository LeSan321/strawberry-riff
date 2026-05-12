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
  Loader,
  AlertCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import WaveSurfer from "wavesurfer.js";

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
  url?: string | null;
  color: string;
  description: string;
  waveformColor: string;
}

export function StemsStudio() {
  const { generationId } = useParams<{ generationId: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Waveform refs
  const masterWaveRef = useRef<HTMLDivElement>(null);
  const stemWaveRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const waveSurferInstances = useRef<{ [key: string]: WaveSurfer | null }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // State
  const [masterVolume, setMasterVolume] = useState(100);
  const [stemVolumes, setStemVolumes] = useState<{ [key: string]: number }>({
    Vocals: 100,
    Drums: 100,
    Bass: 100,
    Other: 100,
    Piano: 100,
  });

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

  // Build stem data array with direct R2 URLs
  const stems: StemData[] = [
    {
      name: "Vocals",
      emoji: "🎤",
      url: stemSplit?.stems?.vocalUrl,
      color: "from-pink-500 to-rose-500",
      description: "Isolated voice track",
      waveformColor: "#ec4899",
    },
    {
      name: "Instrumental",
      emoji: "🎸",
      url: stemSplit?.stems?.otherUrl,
      color: "from-green-500 to-emerald-500",
      description: "Music without vocals",
      waveformColor: "#10b981",
    },
    {
      name: "Drums",
      emoji: "🥁",
      url: stemSplit?.stems?.drumsUrl,
      color: "from-orange-500 to-yellow-500",
      description: "Percussion and rhythm",
      waveformColor: "#f97316",
    },
    {
      name: "Bass",
      emoji: "🎹",
      url: stemSplit?.stems?.bassUrl,
      color: "from-purple-500 to-indigo-500",
      description: "Bass guitar and low frequencies",
      waveformColor: "#a855f7",
    },
    {
      name: "Other",
      emoji: "🎺",
      url: stemSplit?.stems?.pianoUrl,
      color: "from-cyan-500 to-blue-500",
      description: "Remaining instruments",
      waveformColor: "#06b6d4",
    },
  ];

  // Initialize waveforms
  useEffect(() => {
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
          credentials: 'include',
        },
      });

      // Add error handling for waveform loading
      waveSurfer.on('error', (error) => {
        console.error(`[WaveSurfer] Error loading ${stem.name}:`, error);
      });

      waveSurfer.on('ready', () => {
        console.log(`[WaveSurfer] Waveform ready for ${stem.name}`);
      });

      console.log(`[WaveSurfer] Loading ${stem.name} from:`, stem.url?.substring(0, 100));
      waveSurfer.load(stem.url);
      waveSurferInstances.current[stem.name] = waveSurfer;

      // Sync volume with error handling for NaN
      const volume = stemVolumes[stem.name] / 100;
      if (!isNaN(volume) && isFinite(volume)) {
        waveSurfer.setVolume(volume);
      }
    });

    return () => {
      Object.values(waveSurferInstances.current).forEach((ws) => {
        if (ws) ws.destroy();
      });
      waveSurferInstances.current = {};
    };
  }, [stemSplit?.stems]);

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
    try {
      await downloadAllStems(parseInt(generationId || "0"), generation.title);
    } catch (error) {
      toast.error("Failed to download stems");
    }
  };

  const handleStemPlay = (stemName: string) => {
    const ws = waveSurferInstances.current[stemName];
    if (ws) {
      ws.playPause();
    }
  };

  // Calculate expiration date (30 days from creation)
  const calculateExpiration = () => {
    if (!generation?.createdAt) return null;
    const createdDate = new Date(generation.createdAt);
    const expirationDate = new Date(createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return { expirationDate, daysRemaining };
  };

  const expiration = calculateExpiration();

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

  return (
    <div className={`min-h-screen ${theme.canvasBg} text-foreground`}>
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Music className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Stems Studio</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/studio")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generate
          </Button>
        </div>
        <p className="text-sm text-foreground/70">{generation?.title || "Untitled Track"}</p>
      </div>

      {/* Retention Notice */}
      {expiration && expiration.daysRemaining > 0 && (
        <div className="p-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
          >
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-100 mb-1">Download your files to start the 30-day retention period</p>
              <p className="text-sm text-amber-100/70">
                Your stems will be automatically deleted on {expiration.expirationDate.toLocaleDateString()} ({expiration.daysRemaining} days remaining). Download them now to keep forever.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {/* Master Mix Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Music className="w-5 h-5" />
            Master Mix
          </h2>
          <Card className={`p-6 ${theme.canvasBg} border-white/10`}>
            <div className="flex items-center gap-4">
              <Button
                variant="default"
                size="icon"
                className={`${theme.buttonAccent} rounded-lg`}
              >
                <Play className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <div className="h-12 bg-white/5 rounded-lg mb-2" />
                <div className="flex justify-between text-xs text-foreground/60">
                  <span>0:00</span>
                  <span>3:10</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(Number(e.target.value))}
                  className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-xs w-8 text-right">{masterVolume}%</span>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadAll}
                className={`gap-2 ${theme.buttonAccent}`}
              >
                <Download className="w-4 h-4" />
                Download All as ZIP
              </Button>
            </div>
          </Card>
        </div>

        {/* Individual Stems Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Individual Stems</h2>
          <div className="grid grid-cols-1 gap-6">
            {stems.map((stem) => (
              <Card
                key={stem.name}
                className={`p-6 ${theme.canvasBg} border-white/10 hover:border-white/20 transition`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">{stem.emoji}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{stem.name}</h3>
                    <p className="text-sm text-foreground/60">{stem.description}</p>
                  </div>
                </div>

                {/* Waveform */}
                <div
                  ref={(el) => {
                    if (el) stemWaveRefs.current[stem.name] = el;
                  }}
                  className="mb-4 rounded-lg overflow-hidden bg-black/20"
                />

                {/* Timeline and Controls */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="default"
                    size="icon"
                    onClick={() => handleStemPlay(stem.name)}
                    className={`${theme.buttonAccent} rounded-lg`}
                  >
                    <Play className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <Volume2 className="w-4 h-4" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stemVolumes[stem.name]}
                      onChange={(e) =>
                        setStemVolumes((prev) => ({
                          ...prev,
                          [stem.name]: Number(e.target.value),
                        }))
                      }
                      className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                    />
                    <span className="text-xs w-8 text-right">
                      {stemVolumes[stem.name]}%
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      const url = stem.url;
                      if (url) {
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${generation?.title || "stem"}_${stem.name.toLowerCase()}.mp3`;
                        a.click();
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
