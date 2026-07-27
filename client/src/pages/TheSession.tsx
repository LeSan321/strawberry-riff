/**
 * The Session — Platinum creative space
 *
 * A standalone full-screen page at /session.
 * v1 scope:
 *   - Hero "Enter the Session" moment
 *   - Add Vocals workflow (live feature)
 *   - Placeholder sections for future features
 *   - Platinum gating
 *
 * Designed to be structurally loose — each section is its own component
 * so layout can be rearranged freely as the space evolves.
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Mic,
  Music,
  Sparkles,
  Crown,
  Lock,
  ChevronLeft,
  Play,
  Pause,
  Loader2,
  Check,
  X,
  Sliders,
  BookOpen,
  Palette,
  Radio,
  Calendar,
  Layers,
  Volume2,
  Download,
  RefreshCw,
  Home,
  ArrowRight,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// ─── Vocal Archetype Definitions ──────────────────────────────────────────────
const VOCAL_ARCHETYPES = [
  {
    id: "intimate-bedroom",
    name: "Intimate Bedroom",
    description: "Breathy, warm, close-mic'd. Vulnerable and lo-fi.",
    emoji: "🌙",
    color: "from-indigo-600 to-purple-700",
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    text: "text-indigo-300",
  },
  {
    id: "raw-emotional",
    name: "Raw Emotional",
    description: "Imperfect, human, emotional cracks. Feeling over polish.",
    emoji: "💧",
    color: "from-blue-600 to-cyan-700",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    text: "text-blue-300",
  },
  {
    id: "soulful-belter",
    name: "Soulful Belter",
    description: "Rich, resonant, dynamic runs. Powerful and warm.",
    emoji: "🔥",
    color: "from-orange-600 to-amber-700",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    text: "text-orange-300",
  },
  {
    id: "gritty-rock",
    name: "Gritty Rock",
    description: "Rasp, grit, strain. Live energy that cuts through.",
    emoji: "⚡",
    color: "from-red-600 to-rose-700",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    text: "text-red-300",
  },
  {
    id: "confident-pop",
    name: "Confident Pop",
    description: "Bright, clear, polished-but-human. Strong presence.",
    emoji: "✨",
    color: "from-pink-600 to-rose-600",
    border: "border-pink-500/30",
    bg: "bg-pink-500/10",
    text: "text-pink-300",
  },
  {
    id: "lo-fi-whisper",
    name: "Lo-fi Whisper",
    description: "Soft, hazy, conversational. Tape warmth and room tone.",
    emoji: "🌫️",
    color: "from-slate-600 to-zinc-700",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
    text: "text-slate-300",
  },
  {
    id: "powerful-anthem",
    name: "Powerful Anthem",
    description: "Soaring, confident, epic build. Human but massive.",
    emoji: "🏔️",
    color: "from-violet-600 to-purple-700",
    border: "border-violet-500/30",
    bg: "bg-violet-500/10",
    text: "text-violet-300",
  },
  {
    id: "storyteller-folk",
    name: "Storyteller Folk",
    description: "Honest, clear, organic. Lyric-first with natural warmth.",
    emoji: "📖",
    color: "from-emerald-600 to-teal-700",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
  },
] as const;

type VocalArchetypeId = typeof VOCAL_ARCHETYPES[number]["id"];

// ─── Coming Soon Section ───────────────────────────────────────────────────────
function ComingSoonSection({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex items-start gap-4 opacity-60 hover:opacity-80 transition-opacity">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white/80">{title}</span>
          <Badge variant="outline" className="text-[10px] border-white/20 text-white/40 py-0">
            Coming Soon
          </Badge>
        </div>
        <p className="text-xs text-white/40 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ─── Instrumental Picker ───────────────────────────────────────────────────────
function InstrumentalPicker({
  selectedId,
  selectedUrl,
  onSelect,
}: {
  selectedId: number | null;
  selectedUrl: string | null;
  onSelect: (id: number, url: string, title: string) => void;
}) {
  const { data: generations, isLoading } = trpc.musicGeneration.myGenerations.useQuery();
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const completed = (generations ?? []).filter(
    (g) => g.status === "complete" && g.audioUrl
  );

  function togglePlay(id: number, url: string) {
    if (playing === id) {
      audioRef.current?.pause();
      setPlaying(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audio.onended = () => setPlaying(null);
      audio.play();
      audioRef.current = audio;
      setPlaying(id);
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No completed generations yet.</p>
        <p className="text-xs mt-1">Generate an instrumental first, then come back.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {completed.map((gen) => (
        <motion.div
          key={gen.id}
          whileHover={{ scale: 1.01 }}
          onClick={() => onSelect(gen.id, gen.audioUrl!, gen.title)}
          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
            selectedId === gen.id
              ? "border-violet-500/60 bg-violet-500/10"
              : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(gen.id, gen.audioUrl!);
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {playing === gen.id ? (
              <Pause className="w-3.5 h-3.5 text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{gen.title}</p>
          </div>
          {selectedId === gen.id && (
            <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Add Vocals Panel ──────────────────────────────────────────────────────────
function AddVocalsPanel() {
  const [step, setStep] = useState<"pick" | "configure" | "generating" | "done">("pick");
  const [selectedGenId, setSelectedGenId] = useState<number | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");
  const [lyrics, setLyrics] = useState("");
  const [archetype, setArchetype] = useState<VocalArchetypeId | "">("");
  const [vocalGender, setVocalGender] = useState<"male" | "female" | "neutral">("neutral");
  const [spectrumValue, setSpectrumValue] = useState(50);
  const [styleNotes, setStyleNotes] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const resultAudioRef = useRef<HTMLAudioElement | null>(null);

  const startMutation = trpc.vocalProjects.start.useMutation();
  const pollMutation = trpc.vocalProjects.poll.useMutation();

  function handleSelectInstrumental(id: number, url: string, title: string) {
    setSelectedGenId(id);
    setSelectedUrl(url);
    setSelectedTitle(title);
  }

  async function handleGenerate() {
    if (!selectedUrl || !lyrics.trim() || !archetype) {
      toast.error("Please complete all required fields");
      return;
    }
    setStep("generating");
    setErrorMsg(null);
    try {
      const job = await startMutation.mutateAsync({
        instrumentalUrl: selectedUrl,
        lyrics: lyrics.trim(),
        vocalArchetype: archetype as VocalArchetypeId,
        vocalGender,
        vocalSpectrumValue: spectrumValue,
        styleNotes: styleNotes.trim() || undefined,
        trackId: selectedGenId ?? undefined,
      });
      setTaskId(job.taskId);
      // Poll for result (blocks server-side up to 10 min)
      const result = await pollMutation.mutateAsync({ taskId: job.taskId });
      if (result.audioUrl) {
        setResultUrl(result.audioUrl);
        setStep("done");
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setErrorMsg(msg);
      setStep("configure");
      toast.error("Vocal generation failed — " + msg);
    }
  }

  function toggleResultPlay() {
    if (!resultUrl) return;
    if (isPlaying) {
      resultAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!resultAudioRef.current) {
        resultAudioRef.current = new Audio(resultUrl);
        resultAudioRef.current.onended = () => setIsPlaying(false);
      }
      resultAudioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleReset() {
    resultAudioRef.current?.pause();
    resultAudioRef.current = null;
    setStep("pick");
    setSelectedGenId(null);
    setSelectedUrl(null);
    setSelectedTitle("");
    setLyrics("");
    setArchetype("");
    setVocalGender("neutral");
    setSpectrumValue(50);
    setStyleNotes("");
    setTaskId(null);
    setResultUrl(null);
    setErrorMsg(null);
    setIsPlaying(false);
  }

  const selectedArchetypeData = VOCAL_ARCHETYPES.find((a) => a.id === archetype);

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-purple-950/30 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Mic className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Add Vocals</h3>
          <p className="text-xs text-white/40">Layer AI vocals onto your instrumental</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          {(["pick", "configure", "generating", "done"] as const).map((s, i) => (
            <div
              key={s}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                s === step
                  ? "bg-violet-400 w-4"
                  : i < ["pick", "configure", "generating", "done"].indexOf(step)
                  ? "bg-violet-600"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Pick Instrumental ── */}
          {step === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div>
                <p className="text-xs font-medium text-white/60 uppercase tracking-wider mb-3">
                  1 — Choose your instrumental
                </p>
                <InstrumentalPicker
                  selectedId={selectedGenId}
                  selectedUrl={selectedUrl}
                  onSelect={handleSelectInstrumental}
                />
              </div>
              <Button
                onClick={() => setStep("configure")}
                disabled={!selectedGenId}
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Configure ── */}
          {step === "configure" && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Selected track */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Music className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-sm text-white/80 truncate">{selectedTitle}</span>
                <button
                  onClick={() => setStep("pick")}
                  className="ml-auto text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Lyrics */}
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
                  Lyrics
                </label>
                <Textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Paste or write your lyrics here..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none h-32 text-sm"
                />
                <p className="text-xs text-white/30 mt-1 text-right">{lyrics.length}/3500</p>
              </div>

              {/* Vocal Archetype */}
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
                  Vocal Character
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VOCAL_ARCHETYPES.map((a) => (
                    <motion.button
                      key={a.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setArchetype(a.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        archetype === a.id
                          ? `${a.border} ${a.bg}`
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{a.emoji}</span>
                        <span className={`text-xs font-semibold ${archetype === a.id ? a.text : "text-white/70"}`}>
                          {a.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/30 leading-relaxed">{a.description}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Gender + Spectrum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
                    Voice
                  </label>
                  <Select value={vocalGender} onValueChange={(v) => setVocalGender(v as typeof vocalGender)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
                    Spectrum — {spectrumValue}
                  </label>
                  <div className="pt-2">
                    <Slider
                      value={[spectrumValue]}
                      onValueChange={([v]) => setSpectrumValue(v)}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-white/30">Subtle</span>
                      <span className="text-[10px] text-white/30">Intense</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional style notes */}
              <div>
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider block mb-2">
                  Style Notes <span className="text-white/20 normal-case font-normal">(optional)</span>
                </label>
                <Textarea
                  value={styleNotes}
                  onChange={(e) => setStyleNotes(e.target.value)}
                  placeholder="Any additional direction for the vocal performance..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none h-16 text-sm"
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{errorMsg}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("pick")}
                  className="border-white/10 text-white/60 hover:text-white bg-transparent"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!lyrics.trim() || !archetype}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Vocals
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Generating ── */}
          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="py-12 flex flex-col items-center gap-5 text-center"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
                  <Mic className="w-7 h-7 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-ping" />
              </div>
              <div>
                <p className="text-white font-semibold mb-1">The Session is recording...</p>
                <p className="text-sm text-white/40">
                  {selectedArchetypeData
                    ? `${selectedArchetypeData.emoji} ${selectedArchetypeData.name} vocal generating`
                    : "Vocal generation in progress"}
                </p>
                <p className="text-xs text-white/25 mt-2">This takes 2–5 minutes. Don't close this tab.</p>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-violet-400 rounded-full"
                    animate={{ height: [4, 20, 4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Done ── */}
          {step === "done" && resultUrl && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-white" />
                </div>
                <p className="text-white font-semibold">Vocals added</p>
                <p className="text-sm text-white/40 mt-1">Your track is ready to play</p>
              </div>

              {/* Player */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={toggleResultPlay}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0 hover:from-violet-500 hover:to-purple-500 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-white" />
                  ) : (
                    <Play className="w-4 h-4 text-white ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedTitle} (with vocals)</p>
                  <p className="text-xs text-white/40">
                    {selectedArchetypeData?.name} · {vocalGender}
                  </p>
                </div>
                <a
                  href={resultUrl}
                  download
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-white/60" />
                </a>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1 border-white/10 text-white/60 hover:text-white bg-transparent"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  New Session
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Platinum Gate ─────────────────────────────────────────────────────────────
function PlatinumGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isPlatinum = (user as { isPlatinum?: boolean } | null)?.isPlatinum ?? false;

  if (isPlatinum) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/30 to-yellow-950/20 p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mx-auto mb-4">
        <Crown className="w-7 h-7 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Platinum Access Required</h3>
      <p className="text-sm text-white/50 mb-5 max-w-sm mx-auto">
        The Session is a Platinum feature. Upgrade to unlock Add Vocals, the Fusion Studio, and more.
      </p>
      <Link href="/pricing">
        <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-semibold">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Platinum
        </Button>
      </Link>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TheSession() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Lock body scroll
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      document.body.style.overflow = "";
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0514] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign in to enter The Session</h2>
          <p className="text-sm text-white/40 mb-5">A Platinum creative space for Strawberry Riff members.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white">
              Sign In
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden bg-[#0a0514]"
      style={{ height: "100dvh" }}
    >
      {/* ── Accent strip ── */}
      <div className="h-[2px] bg-gradient-to-r from-violet-600 via-purple-500 to-pink-500 flex-shrink-0" />

      {/* ── Top nav bar ── */}
      <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/5 flex-shrink-0">
        <Link href="/">
          <button className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
            <ChevronLeft className="w-4 h-4" />
            <Home className="w-3.5 h-3.5" />
          </button>
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">The Session</span>
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] py-0">
            Platinum
          </Badge>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/studio">
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/70 text-xs h-7">
              Studio
            </Button>
          </Link>
          <Link href="/generate">
            <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/70 text-xs h-7">
              Generate
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main scrollable area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">

          {/* ── Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-5">
              <Radio className="w-3 h-3" />
              Early Access
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Enter the Session
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Where your instrumentals find their voice. Layer AI vocals with archetype-driven character onto your fusions.
            </p>
          </motion.div>

          {/* ── Main content grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left: Add Vocals (live feature) ── */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <PlatinumGate>
                  <AddVocalsPanel />
                </PlatinumGate>
              </motion.div>
            </div>

            {/* ── Right: Coming soon sections ── */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3 px-1">
                  Coming to The Session
                </p>
                <div className="space-y-3">
                  <ComingSoonSection
                    icon={Layers}
                    title="Saved Sessions"
                    description="Your library of completed vocal fusions, ready to revisit and share."
                    accent="from-violet-600 to-purple-700"
                  />
                  <ComingSoonSection
                    icon={Sliders}
                    title="Instrument Palette"
                    description="Fine-tune the instrumental texture before adding vocals."
                    accent="from-blue-600 to-cyan-700"
                  />
                  <ComingSoonSection
                    icon={BookOpen}
                    title="Lyrics Vault"
                    description="Your saved lyrics, ready to drop into any session."
                    accent="from-emerald-600 to-teal-700"
                  />
                  <ComingSoonSection
                    icon={Palette}
                    title="Cover Art"
                    description="Generate artwork that matches the mood of your fusion."
                    accent="from-pink-600 to-rose-700"
                  />
                  <ComingSoonSection
                    icon={Radio}
                    title="My Frequency"
                    description="Your sonic identity — the DNA that shapes every generation."
                    accent="from-amber-600 to-orange-700"
                  />
                  <ComingSoonSection
                    icon={Calendar}
                    title="Venues Studio"
                    description="Bridge your sessions to live performance and concert booking."
                    accent="from-rose-600 to-red-700"
                  />
                </div>
              </motion.div>
            </div>
          </div>

          {/* ── Bottom spacer ── */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
