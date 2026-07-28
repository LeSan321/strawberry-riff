/**
 * The Session — Platinum creative space
 *
 * Studio-derived layout: left sidebar + cinematic header + central canvas.
 * Full Generate controls, Add Vocals workflow, Lyrics, Styles, Stems.
 * Structurally loose — each section is its own component for easy rearrangement.
 */
import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Mic,
  Music,
  Pen,
  Library,
  Download,
  Layers,
  Zap,
  Piano,
  Home,
  Palette,
  Check,
  X,
  Play,
  Pause,
  Loader2,
  Radio,
  Calendar,
  BookOpen,
  Star,
  Crown,
  Lock,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { GeneratePage } from "./Generate";
import { LyricsGeneratorPage } from "./LyricsGenerator";
import { StyleLibrary } from "./StyleLibrary";
import { MyStemsPanel } from "@/components/MyStemsPanel";
import FusionRecipesDrawer from "@/components/FusionRecipesDrawer";
import InstrumentPaletteDrawer from "@/components/InstrumentPaletteDrawer";
import { FrequencyModal } from "@/components/FrequencyModal";

// ─── Session Theme Definitions ─────────────────────────────────────────────────
const SESSION_THEMES = [
  {
    id: "midnight-studio",
    name: "Midnight Studio",
    description: "Late-night recording session under violet neon glow",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331665311/BBbXFyizKgRlbAeq.jpg",
    accent: "from-violet-600 to-purple-700",
    headerGradient: "from-transparent via-transparent to-violet-950/80",
    sidebarBg: "bg-[#0e0a1f]",
    canvasBg: "bg-[#0e0a1f]",
    textAccent: "text-violet-400",
    raspberryAccent: "text-violet-300",
    borderAccent: "border-violet-900/50",
    buttonAccent: "bg-violet-700 hover:bg-violet-600",
    borderColor: "border-violet-500/40",
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    description: "Warm afternoon session with amber light flooding the room",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331665311/NwjbIweBYggJWMoR.jpg",
    accent: "from-amber-500 to-orange-600",
    headerGradient: "from-transparent via-transparent to-amber-950/80",
    sidebarBg: "bg-[#1a1005]",
    canvasBg: "bg-[#1a1005]",
    textAccent: "text-amber-400",
    raspberryAccent: "text-amber-300",
    borderAccent: "border-amber-900/50",
    buttonAccent: "bg-amber-600 hover:bg-amber-500",
    borderColor: "border-amber-500/40",
  },
  {
    id: "deep-indigo",
    name: "Deep Indigo",
    description: "Immersive late-night session in a deep indigo haze",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331665311/nxFyDCcRkUYCAOFl.jpg",
    accent: "from-indigo-600 to-blue-700",
    headerGradient: "from-transparent via-transparent to-indigo-950/80",
    sidebarBg: "bg-[#080a1f]",
    canvasBg: "bg-[#080a1f]",
    textAccent: "text-indigo-400",
    raspberryAccent: "text-indigo-300",
    borderAccent: "border-indigo-900/50",
    buttonAccent: "bg-indigo-700 hover:bg-indigo-600",
    borderColor: "border-indigo-500/40",
  },
  {
    id: "crimson-room",
    name: "Crimson Room",
    description: "Intense creative energy in a crimson-lit recording space",
    image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663331665311/HKkIKXLJPpTZQHEh.jpg",
    accent: "from-rose-600 to-red-700",
    headerGradient: "from-transparent via-transparent to-rose-950/80",
    sidebarBg: "bg-[#1a0808]",
    canvasBg: "bg-[#1a0808]",
    textAccent: "text-rose-400",
    raspberryAccent: "text-rose-300",
    borderAccent: "border-rose-900/50",
    buttonAccent: "bg-rose-700 hover:bg-rose-600",
    borderColor: "border-rose-500/40",
  },
];

type SessionTheme = typeof SESSION_THEMES[0];

// ─── Vocal Archetypes ──────────────────────────────────────────────────────────
const VOCAL_ARCHETYPES = [
  { id: "intimate-bedroom", name: "Intimate Bedroom", desc: "Breathy, warm, close-mic'd. Vulnerable and lo-fi.", icon: "🌙" },
  { id: "raw-emotional", name: "Raw Emotional", desc: "Imperfect, human. Emotional cracks and feeling over polish.", icon: "💔" },
  { id: "soulful-belter", name: "Soulful Belter", desc: "Rich, resonant. Dynamic range with controlled runs.", icon: "🎤" },
  { id: "gritty-rock", name: "Gritty Rock", desc: "Powerful midrange with rasp and grit. Cuts through a band.", icon: "🎸" },
  { id: "confident-pop", name: "Confident Pop", desc: "Bright, clear, polished-but-human with excellent presence.", icon: "✨" },
  { id: "lo-fi-whisper", name: "Lo-fi Whisper", desc: "Soft, hazy, conversational. Room tone and tape warmth.", icon: "🌫️" },
  { id: "powerful-anthem", name: "Powerful Anthem", desc: "Soaring, confident. Strong projection and emotional build.", icon: "🔥" },
  { id: "storyteller-folk", name: "Storyteller Folk", desc: "Honest, clear, organic. Focused on lyrical delivery.", icon: "📖" },
] as const;

type VocalArchetypeId = typeof VOCAL_ARCHETYPES[number]["id"];

// ─── Theme Picker Modal ────────────────────────────────────────────────────────
function ThemePickerModal({
  currentTheme, onSelect, onClose,
}: { currentTheme: string; onSelect: (id: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Choose Your Session</h2>
            <p className="text-sm text-gray-400 mt-0.5">Set the atmosphere for your creative space</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {SESSION_THEMES.map((theme) => (
            <motion.button
              key={theme.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { onSelect(theme.id); onClose(); }}
              className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                currentTheme === theme.id ? "border-white shadow-lg shadow-white/20" : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${theme.headerGradient}`} />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className="text-white font-semibold text-sm">{theme.name}</p>
                <p className="text-white/70 text-xs line-clamp-1">{theme.description}</p>
              </div>
              {currentTheme === theme.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-4 h-4 text-gray-900" />
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Session Sidebar ───────────────────────────────────────────────────────────
function SessionSidebar({
  activeTool, onToolChange, theme, onOpenThemePicker, onOpenFusions, onOpenFrequency, onOpenInstrumentPalette,
}: {
  activeTool: "generate" | "vocals" | "lyrics" | "styles" | "stems" | "mixer";
  onToolChange: (t: "generate" | "vocals" | "lyrics" | "styles" | "stems" | "mixer") => void;
  theme: SessionTheme;
  onOpenThemePicker: () => void;
  onOpenFusions: () => void;
  onOpenFrequency: () => void;
  onOpenInstrumentPalette: () => void;
}) {
  const tools = [
    { id: "generate" as const, label: "Generate", icon: Music, desc: "Create new fusion" },
    { id: "vocals" as const, label: "Add Vocals", icon: Mic, desc: "Vocal generation" },
    { id: "mixer" as const, label: "Blend", icon: Layers, desc: "Vocal overlay mix" },
    { id: "lyrics" as const, label: "Lyrics", icon: Pen, desc: "Lyrics editor" },
    { id: "styles" as const, label: "My Styles", icon: Library, desc: "Saved style library" },
    { id: "stems" as const, label: "My Stems", icon: Download, desc: "Split stems" },
  ];

  return (
    <div className={`flex flex-col h-full ${theme.sidebarBg} border-r ${theme.borderAccent} w-[72px] md:w-[200px] flex-shrink-0`}>
      <div className={`px-3 md:px-4 py-4 border-b ${theme.borderAccent}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0`}>
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className={`hidden md:block text-sm font-bold ${theme.textAccent}`}>The Session</span>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-60 px-2 py-1`}>Tools</p>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id} onClick={() => onToolChange(tool.id)}
              className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive ? `bg-gradient-to-r ${theme.accent} text-white shadow-md` : `text-gray-400 hover:text-white hover:bg-white/10`
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="hidden md:block">
                <p className="text-sm font-medium leading-none">{tool.label}</p>
                <p className={`text-xs mt-0.5 ${isActive ? "text-white/70" : "text-gray-500"}`}>{tool.desc}</p>
              </div>
            </button>
          );
        })}

        <div className={`border-t ${theme.borderAccent} my-2`} />
        <p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-60 px-2 py-1`}>Resources</p>

        <button onClick={onOpenFusions} className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-all ${theme.raspberryAccent} hover:text-white`}>
          <Layers className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">Fusions</p>
            <p className="text-xs mt-0.5 opacity-60">47 recipes</p>
          </div>
        </button>

        <button onClick={onOpenFrequency} className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-all ${theme.raspberryAccent} hover:text-white`}>
          <Zap className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">Your Frequency</p>
            <p className="text-xs mt-0.5 opacity-60">Visual universe</p>
          </div>
        </button>

        <button onClick={onOpenInstrumentPalette} className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-all ${theme.raspberryAccent} hover:text-white`}>
          <Piano className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">Instrument Palette</p>
            <p className="text-xs mt-0.5 opacity-60">36 sonic references</p>
          </div>
        </button>

        <div className={`border-t ${theme.borderAccent} my-2`} />
        <p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-40 px-2 py-1`}>Coming Soon</p>
        {[
          { icon: Star, label: "Saved Sessions", desc: "Your fusions" },
          { icon: Calendar, label: "Concerts", desc: "Live events" },
          { icon: BookOpen, label: "Lyrics Vault", desc: "Saved lyrics" },
        ].map(({ icon: Icon, label, desc }) => (
          <button key={label} onClick={() => toast(`${label} — coming soon`)}
            className="w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left text-gray-600 hover:text-gray-400 hover:bg-white/5 transition-all"
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none">{label}</p>
              <p className="text-xs mt-0.5 opacity-60">{desc}</p>
            </div>
          </button>
        ))}
      </nav>

      <div className={`p-2 border-t ${theme.borderAccent}`}>
        <Link href="/">
          <button className="w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
            <Home className="w-4 h-4 flex-shrink-0" />
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none text-left">Home</p>
              <p className="text-xs mt-0.5 text-gray-500 text-left">Back to app</p>
            </div>
          </button>
        </Link>
      </div>

      <div className={`p-2 border-t ${theme.borderAccent}`}>
        <button onClick={onOpenThemePicker} className="w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all">
          <Palette className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-left">Change Scene</p>
            <p className="text-xs mt-0.5 text-gray-500 text-left">{SESSION_THEMES.find(t => t.id === theme.id)?.name}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Session Header ────────────────────────────────────────────────────────────
function SessionHeader({ theme }: { theme: SessionTheme }) {
  return (
    <div className={`relative h-36 md:h-48 flex-shrink-0 overflow-hidden border-b-2 ${theme.borderColor}`}>
      <img src={theme.image} alt={theme.name} className="absolute inset-0 w-full h-full object-cover object-center" />
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.headerGradient}`} />
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Badge className="text-xs bg-black/40 text-white border-white/20 backdrop-blur-sm">
            <Radio className="w-3 h-3 mr-1" />The Session
          </Badge>
          <Badge className="text-xs bg-violet-500/30 text-violet-200 border-violet-400/30 backdrop-blur-sm">
            <Crown className="w-3 h-3 mr-1" />Platinum
          </Badge>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Riff Session
          </h1>
          <p className="text-white/60 text-sm mt-0.5 hidden md:block">{theme.description}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Add Vocals Panel ──────────────────────────────────────────────────────────
function AddVocalsPanel({ theme }: { theme: SessionTheme }) {
  const { user } = useAuth();
  const [selectedArchetype, setSelectedArchetype] = useState<VocalArchetypeId | null>(null);
  const [vocalGender, setVocalGender] = useState<"male" | "female" | "neutral">("neutral");
  const [spectrumValue, setSpectrumValue] = useState(50);
  const [lyrics, setLyrics] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackUrl, setSelectedTrackUrl] = useState<string | null>(null);
  const [selectedTrackTitle, setSelectedTrackTitle] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data: myGenerations, refetch: refetchGenerations } = trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });
  // Show completed non-vocal-take tracks as instrumental sources
  const completedTracks = myGenerations?.filter(g => {
    if (g.status !== "complete" || !g.audioUrl) return false;
    try { const m = g.metadata ? JSON.parse(g.metadata) : {}; return m.generationType !== "vocal-take"; }
    catch { return true; }
  }) ?? [];

  const [pendingGenerationId, setPendingGenerationId] = useState<number | null>(null);
  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const { data: pendingGeneration } = trpc.musicGeneration.getById.useQuery(
    { id: pendingGenerationId! },
    { enabled: !!pendingGenerationId, refetchInterval: (query) => (query.state.data?.status === "generating" ? 4000 : false) }
  );

  // When a pending generation completes, surface the result
  useEffect(() => {
    if (!pendingGeneration) return;
    if (pendingGeneration.status === "complete" && pendingGeneration.audioUrl) {
      setResultUrl(pendingGeneration.audioUrl);
      setIsGenerating(false);
      setPendingGenerationId(null);
      refetchGenerations();
      toast.success("Vocal take ready — it's in your library too!");
    } else if (pendingGeneration.status === "failed") {
      const msg = pendingGeneration.errorMessage ?? "Vocal generation failed";
      setError(msg);
      setIsGenerating(false);
      setPendingGenerationId(null);
      toast.error(msg);
    }
  }, [pendingGeneration?.status, pendingGeneration?.audioUrl]);

  const handleGenerate = async () => {
    setError(null);
    if (!selectedTrackUrl) { setError("Please select an instrumental track"); return; }
    if (!selectedArchetype) { setError("Please choose a vocal archetype"); return; }
    if (!lyrics.trim()) { setError("Please enter lyrics for the vocals"); return; }
    setIsGenerating(true);
    setResultUrl(null);
    const selectedTrack = completedTracks.find(t => t.audioUrl === selectedTrackUrl);
    const archName = VOCAL_ARCHETYPES.find(a => a.id === selectedArchetype)?.name ?? selectedArchetype;
    try {
      const job = await generateMutation.mutateAsync({
        title: `Vocal Take — ${archName} over ${selectedTrackTitle ?? "instrumental"}`,
        lyrics: lyrics.trim(),
        vocalMode: true,
        vocalArchetype: selectedArchetype,
        vocalGender,
        vocalSpectrumValue: spectrumValue,
        instrumentalSourceId: selectedTrack?.id,
        instrumentalSourceUrl: selectedTrackUrl,
        intensity: "balanced",
      });
      // Poll via getById — the useQuery above will pick this up
      setPendingGenerationId(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      toast.error(msg);
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      {/* Step 1: Pick Instrumental */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>1 — Select Instrumental</h3>
        {completedTracks.length === 0 ? (
          <div className={`rounded-xl border border-dashed ${theme.borderAccent} p-6 text-center`}>
            <Music className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No completed tracks yet — generate some music first</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {completedTracks.map((track) => {
              const isSelected = selectedTrackUrl === track.audioUrl;
              return (
                <button
                  key={track.id}
                  onClick={() => { setSelectedTrackUrl(track.audioUrl!); setSelectedTrackTitle(track.title); }}
                  className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all aspect-square text-center ${
                    isSelected
                      ? `border-violet-500 bg-violet-500/15 text-white shadow-lg shadow-violet-500/20`
                      : `${theme.borderAccent} bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30`
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? `bg-gradient-to-br ${theme.accent}` : "bg-white/10 group-hover:bg-white/20"
                  }`}>
                    {isSelected ? <Check className="w-4 h-4 text-white" /> : <Music className="w-4 h-4" />}
                  </div>
                  <p className="text-[10px] font-medium leading-tight line-clamp-2 w-full">{track.title}</p>
                  {isSelected && (
                    <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${theme.accent}`} />
                  )}
                </button>
              );
            })}
          </div>
        )}
        {selectedTrackTitle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.borderAccent} bg-white/5`}
          >
            <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0`}>
              <Check className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs text-white truncate flex-1">{selectedTrackTitle}</p>
            <button onClick={() => { setSelectedTrackUrl(null); setSelectedTrackTitle(null); }} className="text-gray-600 hover:text-gray-400 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Step 2: Lyrics */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>2 — Lyrics</h3>
        <Textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Enter the lyrics to be sung over your instrumental..."
          className={`min-h-[120px] bg-white/5 border ${theme.borderAccent} text-white placeholder:text-gray-600 resize-none`}
          maxLength={3500}
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{lyrics.length}/3500</p>
      </div>

      {/* Step 3: Vocal Archetype */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>3 — Vocal Character</h3>
        <div className="grid grid-cols-4 gap-2">
          {VOCAL_ARCHETYPES.map((arch) => {
            const isSelected = selectedArchetype === arch.id;
            return (
              <button
                key={arch.id}
                onClick={() => setSelectedArchetype(arch.id)}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl border transition-all aspect-square text-center ${
                  isSelected
                    ? `border-violet-500 bg-violet-500/15 text-white shadow-lg shadow-violet-500/20`
                    : `${theme.borderAccent} bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30`
                }`}
              >
                <span className="text-xl leading-none">{arch.icon}</span>
                <p className="text-[10px] font-semibold leading-tight">{arch.name.split(" ")[0]}</p>
                {isSelected && (
                  <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${theme.accent}`} />
                )}
              </button>
            );
          })}
        </div>
        {selectedArchetype && (() => {
          const arch = VOCAL_ARCHETYPES.find(a => a.id === selectedArchetype);
          return arch ? (
            <motion.div
              key={selectedArchetype}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              className={`mt-2 flex items-start gap-3 px-3 py-2.5 rounded-xl border ${theme.borderAccent} bg-white/5`}
            >
              <span className="text-xl flex-shrink-0 mt-0.5">{arch.icon}</span>
              <div>
                <p className="text-xs font-semibold text-white">{arch.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{arch.desc}</p>
              </div>
            </motion.div>
          ) : null;
        })()}
      </div>

      {/* Step 4: Voice Controls */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>4 — Voice Controls</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-400 mb-2">Voice Gender</p>
            <div className="flex gap-2">
              {(["female", "male", "neutral"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setVocalGender(g)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all border ${
                    vocalGender === g
                      ? `bg-gradient-to-r ${theme.accent} text-white border-transparent`
                      : `${theme.borderAccent} text-gray-400 hover:text-white bg-white/5`
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Vocal Intensity</p>
              <span className={`text-xs font-medium ${theme.textAccent}`}>{spectrumValue}%</span>
            </div>
            <Slider value={[spectrumValue]} onValueChange={([v]) => setSpectrumValue(v)} min={0} max={100} step={1} className="w-full" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-600">Subtle</span>
              <span className="text-xs text-gray-600">Intense</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-2">Style Notes <span className="text-gray-600">(optional)</span></p>
            <Input
              value={styleNotes}
              onChange={(e) => setStyleNotes(e.target.value)}
              placeholder="e.g. slightly raspy, melancholic, slow vibrato..."
              className={`bg-white/5 border ${theme.borderAccent} text-white placeholder:text-gray-600`}
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {!resultUrl && (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedTrackUrl || !selectedArchetype || !lyrics.trim()}
          className={`w-full bg-gradient-to-r ${theme.accent} text-white font-semibold py-3 rounded-xl border-0 disabled:opacity-50`}
          size="lg"
        >
          {isGenerating
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Vocals — 2–5 min...</>
            : <><Mic className="w-4 h-4 mr-2" />Generate Vocals</>
          }
        </Button>
      )}

      {resultUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {/* Result playback card */}
          <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center`}>
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Vocal Take Ready</p>
                <p className="text-xs text-gray-400">Saved to your library</p>
              </div>
            </div>
            <audio ref={audioRef} src={resultUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
            <div className="flex gap-2">
              <Button onClick={togglePlay} variant="outline" size="sm" className={`flex-1 border ${theme.borderAccent} text-white bg-white/5`}>
                {isPlaying ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Play</>}
              </Button>
              <a href={resultUrl} download="session-vocals.mp3" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className={`border ${theme.borderAccent} text-white bg-white/5`}>
                  <Download className="w-4 h-4" />
                </Button>
              </a>
              <Button variant="outline" size="sm" className={`border ${theme.borderAccent} text-white bg-white/5`}
                onClick={() => { setResultUrl(null); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pipeline next-step guide */}
          <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-2`}>
            <p className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-70`}>Next Steps</p>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Split the stems</p>
                  <p className="text-xs text-gray-400">Go to <span className={`font-semibold ${theme.textAccent}`}>My Stems</span> and split this vocal take to extract the pure vocal stem.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Blend with your instrumental</p>
                  <p className="text-xs text-gray-400">Go to <span className={`font-semibold ${theme.textAccent}`}>Blend</span> and overlay the vocal stem on your original instrumental track.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Mixer Panel ──────────────────────────────────────────────────────────────
function MixerPanel({ theme }: { theme: SessionTheme }) {
  const { user } = useAuth();
  const [vocalStemUrl, setVocalStemUrl] = useState<string | null>(null);
  const [vocalStemLabel, setVocalStemLabel] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  const [instrumentalLabel, setInstrumentalLabel] = useState<string | null>(null);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [instrumentalVolume, setInstrumentalVolume] = useState(0.9);
  const [title, setTitle] = useState("");
  const [isMixing, setIsMixing] = useState(false);
  const [pendingMixId, setPendingMixId] = useState<number | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch user's completed stem splits (for vocal stem picker)
  const { data: stemSplits } = trpc.stemsplit.getUserStemSplits.useQuery(undefined, { enabled: !!user });
  const completedSplits = stemSplits?.filter(s => s.status === "completed" && s.stems?.vocalUrl) ?? [];

  // Fetch user's completed generations (for instrumental picker)
  const { data: myGenerations, refetch: refetchGenerations } = trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });
  const instrumentalTracks = myGenerations?.filter(g => {
    if (g.status !== "complete" || !g.audioUrl) return false;
    try { const m = g.metadata ? JSON.parse(g.metadata) : {}; return m.generationType !== "vocal-overlay"; }
    catch { return true; }
  }) ?? [];

  const mixMutation = trpc.mixer.vocalOverlay.useMutation();

  // Poll for mix completion
  const { data: pendingMix } = trpc.musicGeneration.getById.useQuery(
    { id: pendingMixId! },
    { enabled: !!pendingMixId, refetchInterval: (query) => (query.state.data?.status === "generating" ? 4000 : false) }
  );

  useEffect(() => {
    if (!pendingMix) return;
    if (pendingMix.status === "complete" && pendingMix.audioUrl) {
      setResultUrl(pendingMix.audioUrl);
      setIsMixing(false);
      setPendingMixId(null);
      refetchGenerations();
      toast.success("Mix complete — saved to your library!");
    } else if (pendingMix.status === "failed") {
      const msg = pendingMix.errorMessage ?? "Mix failed";
      setError(msg);
      setIsMixing(false);
      setPendingMixId(null);
      toast.error(msg);
    }
  }, [pendingMix?.status, pendingMix?.audioUrl]);

  const handleMix = async () => {
    setError(null);
    if (!vocalStemUrl) { setError("Please select a vocal stem"); return; }
    if (!instrumentalUrl) { setError("Please select an instrumental track"); return; }
    if (!title.trim()) { setError("Please enter a title for the mix"); return; }
    setIsMixing(true);
    setResultUrl(null);
    const selectedInst = instrumentalTracks.find(t => t.audioUrl === instrumentalUrl);
    try {
      const job = await mixMutation.mutateAsync({
        vocalStemUrl,
        instrumentalUrl,
        vocalVolume,
        instrumentalVolume,
        title: title.trim(),
        instrumentalGenerationId: selectedInst?.id,
      });
      setPendingMixId(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Mix failed";
      setError(msg);
      toast.error(msg);
      setIsMixing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className={`text-lg font-bold ${theme.textAccent} mb-1`}>Vocal Overlay Mix</h2>
        <p className="text-xs text-gray-400">Blend a vocal stem with an instrumental track using server-side ffmpeg mixing.</p>
      </div>

      {/* Step 1: Pick Vocal Stem */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>1. Pick a Vocal Stem</p>
        <p className="text-xs text-gray-400">Select from your completed stem splits. The vocal stem is the isolated voice track.</p>
        {completedSplits.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No completed stem splits yet. Split a vocal-take generation in My Stems first.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {completedSplits.map((split) => (
              <button key={split.id}
                onClick={() => { setVocalStemUrl(split.stems!.vocalUrl!); setVocalStemLabel(`Split #${split.id} — generation ${split.generationId}`); }}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                  vocalStemUrl === split.stems?.vocalUrl
                    ? `border-transparent bg-gradient-to-r ${theme.accent} text-white`
                    : `${theme.borderAccent} bg-white/5 text-gray-300 hover:bg-white/10`
                }`}
              >
                <span className="font-medium">Split #{split.id}</span>
                <span className="text-xs ml-2 opacity-60">Generation {split.generationId}</span>
                {vocalStemUrl === split.stems?.vocalUrl && <Check className="w-3.5 h-3.5 inline ml-2" />}
              </button>
            ))}
          </div>
        )}
        {vocalStemLabel && (
          <p className="text-xs text-green-400">Selected: {vocalStemLabel}</p>
        )}
      </div>

      {/* Step 2: Pick Instrumental */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>2. Pick an Instrumental</p>
        <p className="text-xs text-gray-400">Choose the backing track to mix the vocals over.</p>
        {instrumentalTracks.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No completed tracks yet. Generate one in the Generate tab first.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {instrumentalTracks.map((track) => (
              <button key={track.id}
                onClick={() => { setInstrumentalUrl(track.audioUrl); setInstrumentalLabel(track.title); }}
                className={`w-full text-left px-3 py-2 rounded-lg border transition-all text-sm ${
                  instrumentalUrl === track.audioUrl
                    ? `border-transparent bg-gradient-to-r ${theme.accent} text-white`
                    : `${theme.borderAccent} bg-white/5 text-gray-300 hover:bg-white/10`
                }`}
              >
                <span className="font-medium line-clamp-1">{track.title}</span>
                {instrumentalUrl === track.audioUrl && <Check className="w-3.5 h-3.5 inline ml-2" />}
              </button>
            ))}
          </div>
        )}
        {instrumentalLabel && (
          <p className="text-xs text-green-400">Selected: {instrumentalLabel}</p>
        )}
      </div>

      {/* Step 3: Volume Controls */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-4`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>3. Volume Balance</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-300">Vocals</span>
              <span className="text-xs text-gray-400">{(vocalVolume * 100).toFixed(0)}%</span>
            </div>
            <Slider value={[vocalVolume * 100]} min={0} max={200} step={5}
              onValueChange={([v]) => setVocalVolume(v / 100)}
              className="w-full" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-300">Instrumental</span>
              <span className="text-xs text-gray-400">{(instrumentalVolume * 100).toFixed(0)}%</span>
            </div>
            <Slider value={[instrumentalVolume * 100]} min={0} max={200} step={5}
              onValueChange={([v]) => setInstrumentalVolume(v / 100)}
              className="w-full" />
          </div>
        </div>
      </div>

      {/* Step 4: Title + Mix */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>4. Name Your Mix</p>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rockabilly Samba — Soulful Belter Mix"
          className={`bg-white/5 border ${theme.borderAccent} text-white placeholder:text-gray-500 text-sm`}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      <Button
        onClick={handleMix}
        disabled={isMixing || !vocalStemUrl || !instrumentalUrl || !title.trim()}
        className={`w-full bg-gradient-to-r ${theme.accent} text-white font-semibold rounded-xl py-3 disabled:opacity-50`}
      >
        {isMixing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Mixing…</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />Mix Vocals + Instrumental</>
        )}
      </Button>

      {isMixing && (
        <div className="text-center text-xs text-gray-400 animate-pulse">
          ffmpeg is combining your tracks — this takes 30–90 seconds…
        </div>
      )}

      {resultUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center`}>
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mix Complete</p>
              <p className="text-xs text-gray-400">Saved to your library</p>
            </div>
          </div>
          <audio ref={audioRef} src={resultUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
          <div className="flex gap-2">
            <Button onClick={togglePlay} variant="outline" size="sm" className={`flex-1 border ${theme.borderAccent} text-white bg-white/5`}>
              {isPlaying ? <><Pause className="w-4 h-4 mr-2" />Pause</> : <><Play className="w-4 h-4 mr-2" />Play</>}
            </Button>
            <a href={resultUrl} download="vocal-mix.mp3" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className={`border ${theme.borderAccent} text-white bg-white/5`}>
                <Download className="w-4 h-4" />
              </Button>
            </a>
            <Button variant="outline" size="sm" className={`border ${theme.borderAccent} text-white bg-white/5`}
              onClick={() => { setResultUrl(null); setTitle(""); }}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Session Page ─────────────────────────────────────────────────────────
export default function TheSession() {
  const { isAuthenticated } = useAuth();
  const [activeTool, setActiveTool] = useState<"generate" | "vocals" | "lyrics" | "styles" | "stems" | "mixer">("generate");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [fusionsOpen, setFusionsOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [instrumentPaletteOpen, setInstrumentPaletteOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("midnight-studio");
  const [selectedInstrument, setSelectedInstrument] = useState<{
    id: string; name: string; family: string; description: string; audioPath: string; tags: string[];
  } | null>(null);

  const theme = SESSION_THEMES.find((t) => t.id === selectedThemeId) ?? SESSION_THEMES[0];

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      document.body.style.overflow = "";
    };
  }, []);

  const darkVars = {
    "--background": "oklch(0.10 0.02 280)",
    "--foreground": "oklch(0.95 0.01 300)",
    "--card": "oklch(0.14 0.02 280)",
    "--card-foreground": "oklch(0.95 0.01 300)",
    "--popover": "oklch(0.14 0.02 280)",
    "--popover-foreground": "oklch(0.95 0.01 300)",
    "--secondary": "oklch(0.20 0.03 280)",
    "--secondary-foreground": "oklch(0.90 0.01 300)",
    "--muted": "oklch(0.20 0.02 280)",
    "--muted-foreground": "oklch(0.65 0.03 300)",
    "--accent": "oklch(0.22 0.05 280)",
    "--accent-foreground": "oklch(0.90 0.01 300)",
    "--border": "oklch(0.22 0.02 280)",
    "--input": "oklch(0.22 0.02 280)",
    "--ring": "oklch(0.70 0.22 300)",
  } as React.CSSProperties;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            The Session
          </h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            A Platinum creative space for generating and steering AI vocals over your instrumentals.
          </p>
          <div className="flex items-center gap-2 justify-center mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Sign in to enter The Session</span>
          </div>
          <a href={getLoginUrl()}>
            <Button size="lg" className="w-full rounded-full font-semibold text-white border-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
              Sign In to Enter The Session
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex overflow-hidden ${theme.canvasBg}`} style={{ ...darkVars, height: "100dvh" }}>
      <div className="hidden md:flex">
        <SessionSidebar
          activeTool={activeTool} onToolChange={setActiveTool} theme={theme}
          onOpenThemePicker={() => setThemePickerOpen(true)}
          onOpenFusions={() => setFusionsOpen(true)}
          onOpenFrequency={() => setFrequencyOpen(true)}
          onOpenInstrumentPalette={() => setInstrumentPaletteOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
        <SessionHeader theme={theme} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }} className="w-full max-w-full"
            >
              {activeTool === "generate" ? (
                <GeneratePage selectedInstrument={selectedInstrument} onClearInstrument={() => setSelectedInstrument(null)} />
              ) : activeTool === "vocals" ? (
                <AddVocalsPanel theme={theme} />
              ) : activeTool === "mixer" ? (
                <MixerPanel theme={theme} />
              ) : activeTool === "lyrics" ? (
                <LyricsGeneratorPage />
              ) : activeTool === "styles" ? (
                <StyleLibrary />
              ) : (
                <MyStemsPanel textAccent={theme.textAccent} buttonAccent={theme.buttonAccent} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom toolbar */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 z-30 ${theme.sidebarBg} border-t ${theme.borderAccent} flex items-center justify-around px-2 py-2 safe-area-pb`}>
        {[
          { id: "generate" as const, icon: Music, label: "Generate" },
          { id: "vocals" as const, icon: Mic, label: "Vocals" },
          { id: "mixer" as const, icon: Layers, label: "Blend" },
          { id: "lyrics" as const, icon: Pen, label: "Lyrics" },
          { id: "stems" as const, icon: Download, label: "Stems" },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTool(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${activeTool === id ? `bg-gradient-to-r ${theme.accent} text-white` : "text-gray-400"}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
        <Link href="/">
          <button className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition-all">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
        </Link>
        <button onClick={() => setThemePickerOpen(true)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-gray-400">
          <Palette className="w-5 h-5" />
          <span className="text-[10px] font-medium">Scene</span>
        </button>
      </div>

      <AnimatePresence>
        {themePickerOpen && (
          <ThemePickerModal currentTheme={selectedThemeId} onSelect={setSelectedThemeId} onClose={() => setThemePickerOpen(false)} />
        )}
      </AnimatePresence>

      <FusionRecipesDrawer open={fusionsOpen} onClose={() => setFusionsOpen(false)} />
      <FrequencyModal open={frequencyOpen} onClose={() => setFrequencyOpen(false)} />
      <InstrumentPaletteDrawer
        open={instrumentPaletteOpen} onClose={() => setInstrumentPaletteOpen(false)}
        onSelectInstrument={(instrument) => { setSelectedInstrument(instrument); setActiveTool("generate"); }}
      />
    </div>
  );
}
