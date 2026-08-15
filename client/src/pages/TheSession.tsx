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
  ChevronDown,
  Scissors,
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

function readMatchFamilyId(metadata?: string | null): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { matchFamilyId?: unknown };
    return typeof parsed.matchFamilyId === "string" && /^F-\d+$/.test(parsed.matchFamilyId)
      ? parsed.matchFamilyId
      : null;
  } catch {
    return null;
  }
}

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
  activeTool: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer";
  onToolChange: (t: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer") => void;
  theme: SessionTheme;
  onOpenThemePicker: () => void;
  onOpenFusions: () => void;
  onOpenFrequency: () => void;
  onOpenInstrumentPalette: () => void;
}) {
  const tools = [
    { id: "generate" as const, label: "Sound World", icon: Music, desc: "Build a fusion landscape" },
    { id: "family" as const, label: "Shared Shape", icon: Layers, desc: "Browse Match Families" },
    { id: "vocals" as const, label: "Voice & Words", icon: Mic, desc: "Explore vocal color" },
    { id: "mixer" as const, label: "Listen Together", icon: Layers, desc: "Keep a custom fusion" },
    { id: "lyrics" as const, label: "Shape the Words", icon: Pen, desc: "Develop the lyric world" },
    { id: "styles" as const, label: "Your Sound Library", icon: Library, desc: "Return to saved directions" },
    { id: "stems" as const, label: "My Stems", icon: Download, desc: "Prepare a vocal take" },
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
            <p className="text-sm font-medium leading-none">Acoustic Palette</p>
            <p className="text-xs mt-0.5 opacity-60">Choose a sonic anchor</p>
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
            <Radio className="w-3 h-3 mr-1" />The Session Room
          </Badge>
          <Badge className="text-xs bg-violet-500/30 text-violet-200 border-violet-400/30 backdrop-blur-sm">
            <Crown className="w-3 h-3 mr-1" />Platinum
          </Badge>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            The Session Room
          </h1>
          <p className="text-white/75 text-sm mt-0.5 hidden md:block">Build a fusion landscape. Then explore vocal color.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Invitation-led room sequence ──────────────────────────────────────────────
function SessionJourney({
  activeTool, onToolChange, theme, activeFusionBed,
}: {
  activeTool: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer";
  onToolChange: (t: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer") => void;
  theme: SessionTheme;
  activeFusionBed?: { id: number; title: string; audioUrl: string; matchFamilyId: string } | null;
}) {
  const stages = [
    { tool: "generate" as const, title: "Sound World", detail: "Build a fusion landscape", icon: Piano },
    { tool: "family" as const, title: "Shared Shape", detail: activeFusionBed ? `Match Family ${activeFusionBed.matchFamilyId}` : "Match Family appears here", icon: Layers },
    { tool: "vocals" as const, title: "Voice & Words", detail: "Explore vocal color", icon: Mic },
    { tool: "mixer" as const, title: "Listen Together", detail: "Keep the fusion", icon: Sparkles },
  ];

  return (
    <section className="px-4 pt-4 md:px-6 md:pt-6">
      <div className={`rounded-2xl border ${theme.borderAccent} bg-black/20 p-3 md:p-4 backdrop-blur-sm`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.textAccent}`}>Your creative thread</p>
            <p className="text-xs text-gray-400 mt-1">{activeFusionBed ? `Working with “${activeFusionBed.title}”. Move in any order — the room will keep the relationship between your choices visible.` : "Move in any order. The room will keep the relationship between your choices visible."}</p>
          </div>
          <Badge className="hidden sm:flex bg-white/5 text-gray-300 border-white/10 text-[10px]">Guided, never rigid</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isCurrent = activeTool === stage.tool;
            return (
              <button
                key={stage.title}
                onClick={() => onToolChange(stage.tool)}
                className={`group relative min-h-[78px] rounded-xl border p-3 text-left transition-all ${
                  isCurrent
                    ? `border-transparent bg-gradient-to-br ${theme.accent} text-white shadow-lg`
                    : `${theme.borderAccent} bg-white/[0.035] text-gray-300 hover:bg-white/[0.08] hover:border-white/25`
                }`}
              >
                <span className={`absolute top-2 right-2 text-[10px] font-bold ${isCurrent ? "text-white/65" : "text-gray-600"}`}>{String(index + 1).padStart(2, "0")}</span>
                <Icon className={`w-4 h-4 mb-2 ${isCurrent ? "text-white" : theme.textAccent}`} />
                <p className="text-xs font-semibold leading-none">{stage.title}</p>
                <p className={`text-[10px] mt-1 leading-snug ${isCurrent ? "text-white/70" : "text-gray-500"}`}>{stage.detail}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SessionStageCallout({
  activeTool, theme, onOpenInstrumentPalette, activeFusionBed, onExploreVoice,
}: {
  activeTool: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer";
  theme: SessionTheme;
  onOpenInstrumentPalette: () => void;
  activeFusionBed?: { id: number; title: string; audioUrl: string; matchFamilyId: string } | null;
  onExploreVoice: () => void;
}) {
  const content = {
    generate: {
      label: "Begin with a sound world",
      title: "What world should this sound grow up in?",
      body: "Choose an acoustic anchor, then describe the movement, place, rhythm, or collision you want to hear. The room handles the hidden musical conditioning.",
    },
    family: {
      label: "Return to the shared shape",
      title: "What else belongs in this family?",
      body: "Browse the fusion beds and vocal takes that were made to meet. Start with the natural relationships, then follow your curiosity from there.",
    },
    vocals: {
      label: "Invite a voice in",
      title: "Who could live inside this song?",
      body: "Choose a vocal character and let the language, delivery, and structure help the voice belong to the world you built.",
    },
    mixer: {
      label: "Listen together",
      title: "What happens when these two meet?",
      body: "Choose a vocal take and an instrumental fusion. Your browser will render the relationship while your original pieces remain unchanged.",
    },
    lyrics: {
      label: "Shape the words",
      title: "Give the feeling a way to speak.",
      body: "Write freely, refine a fragment, or let the lyric space reveal what the music can hold. You can return here at any point in the session.",
    },
    styles: {
      label: "Return to a direction",
      title: "Your sound history is part of the room.",
      body: "Use a saved direction when you want to revisit a world you have already begun to make your own.",
    },
    stems: {
      label: "Prepare a take",
      title: "Separate what you want to carry forward.",
      body: "Split a vocal take only when you want to explore it in a future fusion. A song you love can remain whole.",
    },
  }[activeTool];

  return (
    <section className="px-4 pt-4 md:px-6">
      <div className={`relative overflow-hidden rounded-2xl border ${theme.borderAccent} bg-gradient-to-r from-white/[0.07] to-transparent px-4 py-4 md:px-5`}>
        <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.accent}`} />
        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.textAccent}`}>{content.label}</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-white md:text-xl">{content.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">{content.body}</p>
            {activeTool === "generate" && !activeFusionBed && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded-lg border ${theme.borderAccent} bg-black/20 px-2.5 py-2`}>
                <Layers className={`h-3.5 w-3.5 ${theme.textAccent}`} />
                <span className="text-[11px] text-gray-400"><span className="font-semibold text-gray-200">Shared Shape</span> — a Match Family appears after you keep a fusion bed.</span>
              </div>
            )}
            {activeTool === "generate" && activeFusionBed && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/10 text-emerald-300 border-emerald-400/20 text-[11px]">Fusion bed held in this session</Badge>
                <Badge className="bg-white/5 text-gray-200 border-white/10 text-[11px]">Match Family {activeFusionBed.matchFamilyId}</Badge>
                <span className="text-xs text-gray-300 truncate max-w-[16rem]">{activeFusionBed.title}</span>
                <Button onClick={onExploreVoice} size="sm" className={`bg-gradient-to-r ${theme.accent} text-white border-0`}>
                  <Mic className="mr-1.5 h-3.5 w-3.5" />Explore a voice
                </Button>
              </div>
            )}
          </div>
          {activeTool === "generate" && (
            <Button onClick={onOpenInstrumentPalette} variant="outline" className={`shrink-0 border ${theme.borderAccent} bg-white/5 text-white hover:bg-white/10`}>
              <Piano className={`mr-2 h-4 w-4 ${theme.textAccent}`} />Choose an acoustic anchor
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Add Vocals Panel ──────────────────────────────────────────────────────────
function AddVocalsPanel({ theme, persistedTrackUrl, persistedTrackTitle, persistedLyrics, persistedAccentId, persistedDialectEnabled, onTrackChange, onLyricsChange, onAccentChange, onDialectChange }: {
  theme: SessionTheme;
  persistedTrackUrl?: string | null;
  persistedTrackTitle?: string | null;
  persistedLyrics?: string;
  persistedAccentId?: string | null;
  persistedDialectEnabled?: boolean;
  onTrackChange?: (url: string | null, title: string | null) => void;
  onLyricsChange?: (lyrics: string) => void;
  onAccentChange?: (accentId: string | null) => void;
  onDialectChange?: (enabled: boolean) => void;
}) {
  const { user } = useAuth();
  const [selectedArchetype, setSelectedArchetype] = useState<VocalArchetypeId | null>(null);
  const [vocalGender, setVocalGender] = useState<"male" | "female" | "neutral">("neutral");
  const [spectrumValue, setSpectrumValue] = useState(50);
  const [lyrics, setLyrics] = useState(persistedLyrics ?? "");
  const [styleNotes, setStyleNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultGenerationId, setResultGenerationId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrackUrl, setSelectedTrackUrl] = useState<string | null>(persistedTrackUrl ?? null);
  const [selectedTrackTitle, setSelectedTrackTitle] = useState<string | null>(persistedTrackTitle ?? null);
  const [trackSearch, setTrackSearch] = useState("");
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [accentProfileId, setAccentProfileId] = useState<string | null>(persistedAccentId ?? null);
  const [dialectEnabled, setDialectEnabled] = useState(persistedDialectEnabled ?? false);
  const [dialectPreview, setDialectPreview] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitComplete, setSplitComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedTrackUrl(persistedTrackUrl ?? null);
    setSelectedTrackTitle(persistedTrackTitle ?? null);
  }, [persistedTrackUrl, persistedTrackTitle]);

  const { data: myGenerations, refetch: refetchGenerations } = trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });
  const completedTracks = myGenerations?.filter(g => {
    if (g.status !== "complete" || !g.audioUrl) return false;
    try { const m = g.metadata ? JSON.parse(g.metadata) : {}; return m.generationType !== "vocal-take"; }
    catch { return true; }
  }) ?? [];

  const filteredTracks = completedTracks.filter(t =>
    !trackSearch || t.title.toLowerCase().includes(trackSearch.toLowerCase())
  );
  const selectedTrack = completedTracks.find(t => t.audioUrl === selectedTrackUrl);
  const selectedMatchFamilyId = readMatchFamilyId(selectedTrack?.metadata);

  const ACCENT_OPTIONS = [
    { id: null as string | null, label: "No Accent", summary: "Standard neutral vocal", icon: "\u{1F3A4}" },
    { id: "celtic-irish", label: "Celtic / Scottish", summary: "Rolled R\u2019s, open vowels, rising intonation", icon: "\u{1F3F4}" },
    { id: "blues-south", label: "Blues / Deep South", summary: "Drawled vowels, melismatic bends", icon: "\u{1F3B8}" },
    { id: "british-rp", label: "British RP", summary: "Non-rhotic R, clipped consonants", icon: "\u{1F1EC}\u{1F1E7}" },
    { id: "bossa-nova", label: "Bossa Nova", summary: "Soft sibilants, nasal resonance", icon: "\u{1F3B5}" },
    { id: "jazz-american", label: "Jazz (American)", summary: "Behind-the-beat, scooped entries", icon: "\u{1F3B7}" },
    { id: "country-americana", label: "Country / Americana", summary: "Southern twang, storytelling", icon: "\u{1F920}" },
  ];

  const applyDialectPreview = (text: string, profileId: string | null): string => {
    if (!profileId || !text) return text;
    const substitutions: Record<string, Array<[RegExp, string]>> = {
      "celtic-irish": [
        [/\bI'm\b/g, "Ah'm"], [/\bI\b/g, "Ah"], [/\byou\b/gi, "ye"], [/\bmy\b/gi, "ma"],
        [/\bdon't\b/gi, "dinnae"], [/\bnot\b/gi, "nae"], [/\boh\b/gi, "och"],
        [/\bold\b/gi, "auld"], [/\bhome\b/gi, "hame"], [/\bto\b/gi, "tae"],
        [/\byes\b/gi, "aye"], [/\bnow\b/gi, "the noo"],
      ],
      "blues-south": [
        [/\bI\b/g, "Ah"], [/\bgoing to\b/gi, "gonna"], [/\bwant to\b/gi, "wanna"],
        [/\byou all\b/gi, "y'all"], [/\byou\b/gi, "ya"], [/\bmy\b/gi, "mah"],
        [/\bsomething\b/gi, "somethin'"], [/\bnothing\b/gi, "nothin'"],
      ],
      "british-rp": [
        [/\bgonna\b/gi, "going to"], [/\bwanna\b/gi, "want to"], [/\bain't\b/gi, "isn't"],
        [/\by'all\b/gi, "you all"], [/\bcool\b/gi, "brilliant"],
      ],
      "bossa-nova": [
        [/\blove\b/gi, "amor"], [/\bheart\b/gi, "cora\u00e7\u00e3o"], [/\bnight\b/gi, "noite"],
        [/\bday\b/gi, "dia"], [/\bsky\b/gi, "c\u00e9u"], [/\byes\b/gi, "sim"],
      ],
      "jazz-american": [
        [/\bsomething\b/gi, "somethin'"], [/\bnothing\b/gi, "nothin'"],
        [/\bsinging\b/gi, "singin'"], [/\bwalking\b/gi, "walkin'"],
      ],
      "country-americana": [
        [/\bgoing\b/gi, "goin'"], [/\bsinging\b/gi, "singin'"],
        [/\bsomething\b/gi, "somethin'"], [/\byou all\b/gi, "y'all"],
        [/\bwant to\b/gi, "wanna"], [/\bgoing to\b/gi, "gonna"],
      ],
    };
    const subs = substitutions[profileId] ?? [];
    let result = text;
    for (const [from, to] of subs) result = result.replace(from, to);
    return result;
  };

  useEffect(() => {
    if (dialectEnabled && accentProfileId && lyrics) {
      setDialectPreview(applyDialectPreview(lyrics, accentProfileId));
    } else {
      setDialectPreview("");
    }
  }, [lyrics, accentProfileId, dialectEnabled]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (trackDropdownRef.current && !trackDropdownRef.current.contains(e.target as Node)) {
        setShowTrackDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const startStemSplitMutation = trpc.stemsplit.startStemSplit.useMutation();
  // Note: correct procedure name is startStemSplit
  const [pendingGenerationId, setPendingGenerationId] = useState<number | null>(null);
  const generateMutation = trpc.musicGeneration.generate.useMutation();
  const { data: pendingGeneration } = trpc.musicGeneration.getById.useQuery(
    { id: pendingGenerationId! },
    { enabled: !!pendingGenerationId, refetchInterval: (query) => (query.state.data?.status === "generating" ? 4000 : false) }
  );

  useEffect(() => {
    if (!pendingGeneration) return;
    if (pendingGeneration.status === "complete" && pendingGeneration.audioUrl) {
      setResultUrl(pendingGeneration.audioUrl);
      setResultGenerationId(pendingGeneration.id);
      setIsGenerating(false);
      setPendingGenerationId(null);
      refetchGenerations();
      toast.success("Vocal take ready \u2014 it's in your library too!");
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
    setResultGenerationId(null);
    setSplitComplete(false);
    const archName = VOCAL_ARCHETYPES.find(a => a.id === selectedArchetype)?.name ?? selectedArchetype;
    const finalLyrics = dialectEnabled && accentProfileId
      ? applyDialectPreview(lyrics.trim(), accentProfileId)
      : lyrics.trim();
    try {
      const job = await generateMutation.mutateAsync({
        title: `Vocal Take \u2014 ${archName} over ${selectedTrackTitle ?? "instrumental"}`,
        lyrics: finalLyrics,
        vocalMode: true,
        vocalArchetype: selectedArchetype,
        vocalGender,
        vocalSpectrumValue: spectrumValue,
        instrumentalSourceId: selectedTrack?.id,
        instrumentalSourceUrl: selectedTrackUrl,
        intensity: "balanced",
        accentProfileId: accentProfileId ?? undefined,
        matchFamilyId: selectedMatchFamilyId ?? undefined,
      });
      setPendingGenerationId(job.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setError(msg);
      toast.error(msg);
      setIsGenerating(false);
    }
  };

  const handleSplitStems = async () => {
    if (!resultGenerationId) return;
    setIsSplitting(true);
    try {
      await startStemSplitMutation.mutateAsync({ generationId: resultGenerationId });
      setSplitComplete(true);
      toast.success("Stem split started \u2014 check My Stems in a minute");
    } catch {
      toast.error("Failed to start stem split \u2014 try again from My Stems");
    } finally {
      setIsSplitting(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <div className={`rounded-2xl border ${theme.borderAccent} bg-white/[0.035] p-4`}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.textAccent}`}>Voice &amp; Words</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Who could live inside this song?</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">Begin with a fusion bed, then choose how the words, character, and delivery should meet it.</p>
      </div>
      {/* Step 1: Pick Instrumental */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>1 \u2014 Choose a fusion bed</h3>
        {completedTracks.length === 0 ? (
          <div className={`rounded-xl border border-dashed ${theme.borderAccent} p-6 text-center`}>
            <Music className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No fusion beds yet \u2014 begin by building a sound world</p>
          </div>
        ) : (
          <div ref={trackDropdownRef} className="relative">
            <div
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${theme.borderAccent} bg-white/5 cursor-pointer hover:bg-white/10 transition-colors`}
              onClick={() => setShowTrackDropdown(v => !v)}
            >
              <Music className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className={`flex-1 text-sm truncate ${selectedTrackTitle ? "text-white" : "text-gray-500"}`}>
                {selectedTrackTitle ?? "Choose a fusion bed..."}
              </span>
              {selectedTrackTitle && (
                <button onClick={(e) => { e.stopPropagation(); setSelectedTrackUrl(null); setSelectedTrackTitle(null); }} className="text-gray-600 hover:text-gray-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showTrackDropdown ? "rotate-180" : ""}`} />
            </div>
            {selectedMatchFamilyId && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <Layers className={`w-3.5 h-3.5 ${theme.textAccent}`} />
                <span>Shared Shape</span>
                <Badge className="bg-white/5 text-gray-200 border-white/10 text-[10px]">Match Family {selectedMatchFamilyId}</Badge>
              </div>
            )}
            {showTrackDropdown && (
              <div className={`absolute z-50 top-full mt-1 w-full rounded-xl border ${theme.borderAccent} bg-gray-900 shadow-xl overflow-hidden`}>
                <div className="p-2 border-b border-white/10">
                  <Input
                    value={trackSearch}
                    onChange={(e) => setTrackSearch(e.target.value)}
                    placeholder="Search tracks..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-8 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredTracks.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No tracks found</p>
                  ) : (
                    filteredTracks.map(track => (
                      <button
                        key={track.id}
                        onClick={() => { setSelectedTrackUrl(track.audioUrl!); setSelectedTrackTitle(track.title); setShowTrackDropdown(false); setTrackSearch(""); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 transition-colors ${selectedTrackUrl === track.audioUrl ? "bg-white/10" : ""}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedTrackUrl === track.audioUrl ? `bg-gradient-to-br ${theme.accent}` : "bg-white/10"}`}>
                          {selectedTrackUrl === track.audioUrl ? <Check className="w-3 h-3 text-white" /> : <Music className="w-3 h-3 text-gray-400" />}
                        </div>
                          <span className="text-sm text-white truncate">{track.title}</span>
                          {readMatchFamilyId(track.metadata) && <Badge className="ml-auto bg-white/5 text-gray-300 border-white/10 text-[10px]">{readMatchFamilyId(track.metadata)}</Badge>}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Lyrics */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>2 \u2014 Shape the words</h3>
        <Textarea
          value={lyrics}
          onChange={(e) => setLyrics(e.target.value)}
          placeholder="Give the feeling a way to speak. You can write freely or bring in lyrics you already have..."
          className={`min-h-[120px] bg-white/5 border ${theme.borderAccent} text-white placeholder:text-gray-600 resize-none`}
          maxLength={3500}
        />
        <p className="text-xs text-gray-600 mt-1 text-right">{lyrics.length}/3500</p>
      </div>

      {/* Step 3: Vocal Accent */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>3 \u2014 Let the language support the voice</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ACCENT_OPTIONS.map((opt) => {
            const isSelected = accentProfileId === opt.id;
            return (
              <button
                key={opt.id ?? "none"}
                onClick={() => { setAccentProfileId(opt.id); if (!opt.id) setDialectEnabled(false); }}
                className={`group relative flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? `border-violet-500 bg-violet-500/15 text-white shadow-lg shadow-violet-500/20`
                    : `${theme.borderAccent} bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30`
                }`}
              >
                <span className="text-lg leading-none">{opt.icon}</span>
                <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight line-clamp-2">{opt.summary}</p>
                {isSelected && <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gradient-to-br ${theme.accent}`} />}
              </button>
            );
          })}
        </div>
        {accentProfileId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className={`mt-3 rounded-xl border ${theme.borderAccent} bg-white/5 p-3 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Apply dialect to lyrics</p>
              <button
                onClick={() => setDialectEnabled(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${dialectEnabled ? `bg-gradient-to-r ${theme.accent}` : "bg-white/20"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${dialectEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
            {dialectEnabled && dialectPreview && (
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Dialect preview</p>
                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap line-clamp-4">{dialectPreview}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Step 4: Vocal Archetype */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>4 \u2014 Invite a vocal color</h3>
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

      {/* Step 5: Voice Controls */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} mb-3`}>5 \u2014 Set the presence</h3>
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
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Vocals \u2014 2\u20135 min...</>
            : <><Mic className="w-4 h-4 mr-2" />Audition this voice</>
          }
        </Button>
      )}

      {resultUrl && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
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
                onClick={() => { setResultUrl(null); setResultGenerationId(null); setSplitComplete(false); }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!splitComplete ? (
            <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
              <div>
                <p className="text-sm font-semibold text-white">Use this vocal for a fusion?</p>
                <p className="text-xs text-gray-400 mt-1">Split the stems to extract the pure vocal track, then blend it with your instrumental.</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSplitStems}
                  disabled={isSplitting}
                  className={`flex-1 bg-gradient-to-r ${theme.accent} text-white font-semibold rounded-xl border-0`}
                  size="sm"
                >
                  {isSplitting ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Splitting...</> : <><Scissors className="w-3.5 h-3.5 mr-2" />Split &amp; Continue</>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border ${theme.borderAccent} text-gray-400 bg-white/5`}
                  onClick={() => setSplitComplete(true)}
                >
                  Keep as song
                </Button>
              </div>
            </div>
          ) : (
            <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-3 flex items-center gap-3`}>
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0`}>
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-white font-medium">Stems splitting</p>
                <p className="text-xs text-gray-400 mt-0.5">Ready in ~1–3 min. Then use <span className={`font-semibold ${theme.textAccent}`}>Blend</span> to layer.</p>
                {resultGenerationId && (
                  <Link href={`/stems/${resultGenerationId}`} className={`text-xs font-semibold ${theme.textAccent} underline underline-offset-2 mt-1 inline-block`}>
                    View Stems →
                  </Link>
                )}
              </div>
            </div>
          )}
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
  const completedSplits = stemSplits?.filter(s =>
    s.status === "completed" &&
    s.stems?.vocalUrl &&
    s.stems.vocalUrl.startsWith("https://pub-") &&
    Number(s.generationId) >= 1000000
  ) ?? [];

  // Preview audio state for pickers
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const togglePreview = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (previewUrl === url) {
      previewRef.current?.pause();
      setPreviewUrl(null);
    } else {
      if (previewRef.current) { previewRef.current.pause(); }
      setPreviewUrl(url);
      setTimeout(() => previewRef.current?.play().catch(() => {}), 50);
    }
  };

  // Fetch user's completed generations (for instrumental picker)
  const { data: myGenerations, refetch: refetchGenerations } = trpc.musicGeneration.myGenerations.useQuery(undefined, { enabled: !!user });
  
  // Find selected vocal generation to match fingerprints/session
  const selectedSplit = completedSplits.find(s => s.stems?.vocalUrl === vocalStemUrl);
  const selectedGen = myGenerations?.find(g => g.id === selectedSplit?.generationId);
  const selectedFingerprint = selectedGen?.structureFingerprint;
  const selectedMatchFamilyId = readMatchFamilyId(selectedGen?.metadata);

  // Correct model: Instrumental picker selects ONLY from explicitly tagged instrumental fusions
  // (isInstrumentalFusion === true or bespoke-instrumental mode). This cleanly excludes any ambiguous or legacy vocal tracks.
  const instrumentalTracks = (myGenerations
    ?.filter(g => {
      if (g.status !== "complete" || !g.audioUrl) return false;
      try {
        const m = g.metadata ? JSON.parse(g.metadata) : {};
        return m.isInstrumentalFusion === true || m.mode === "bespoke-instrumental";
      }
      catch { return false; }
    })
    .map(g => {
      const m = g.metadata ? JSON.parse(g.metadata) : {};
      const isBespoke = m.mode === "bespoke-instrumental";
      const isExactMatch = selectedGen && g.id === selectedGen.id;
      const isSameFingerprint = selectedFingerprint && g.structureFingerprint === selectedFingerprint;
      const matchFamilyId = readMatchFamilyId(g.metadata);
      const isSameMatchFamily = selectedMatchFamilyId && matchFamilyId === selectedMatchFamilyId;
      return {
        id: g.id,
        generationId: g.id,
        title: g.title ? `${g.title} ${isBespoke ? '(Fusion Instrumental)' : '(Instrumental)'}` : `Instrumental #${g.id}`,
        audioUrl: g.audioUrl,
        structureFingerprint: g.structureFingerprint,
        matchFamilyId,
        matchScore: isExactMatch ? 4 : (isSameMatchFamily ? 3 : (isSameFingerprint ? 2 : 1)),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)) ?? [];

  const utils = trpc.useUtils();
  const saveMixMutation = trpc.mixer.saveMixToRiffs.useMutation();
  const presignedMutation = trpc.tracks.getUploadPresignedUrl.useMutation();

  // Helper to convert AudioBuffer to WAV ArrayBuffer
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numOfChan * bytesPerSample;
    const dataLength = buffer.length * blockAlign;
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    const result = new ArrayBuffer(totalLength);
    const view = new DataView(result);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    const channels = [];
    for (let i = 0; i < numOfChan; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = Math.max(-1, Math.min(1, channels[channel][i]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }
    return result;
  };

  const handleMix = async () => {
    setError(null);
    if (!vocalStemUrl) { setError("Please select a vocal stem"); return; }
    if (!instrumentalUrl) { setError("Please select an instrumental track"); return; }
    if (!title.trim()) { setError("Please enter a title for the mix"); return; }
    setIsMixing(true);
    setResultUrl(null);
    const selectedInst = instrumentalTracks.find(t => t.audioUrl === instrumentalUrl);

    try {
      // 1. Fetch both audio files in parallel
      toast.info("Downloading stems for mixing...");
      const [vocalRes, instRes] = await Promise.all([
        fetch(vocalStemUrl),
        fetch(instrumentalUrl)
      ]);
      if (!vocalRes.ok || !instRes.ok) throw new Error("Failed to download audio stems for mixing.");

      const [vocalArrayBuf, instArrayBuf] = await Promise.all([
        vocalRes.arrayBuffer(),
        instRes.arrayBuffer()
      ]);

      // 2. Decode audio buffers in browser
      toast.info("Processing audio buffers...");
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const [vocalDecoded, instDecoded] = await Promise.all([
        audioCtx.decodeAudioData(vocalArrayBuf),
        audioCtx.decodeAudioData(instArrayBuf)
      ]);

      // 3. Render mixed audio offline
      const sampleRate = Math.max(vocalDecoded.sampleRate, instDecoded.sampleRate);
      const duration = Math.max(vocalDecoded.duration, instDecoded.duration);
      const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const vocalSource = offlineCtx.createBufferSource();
      vocalSource.buffer = vocalDecoded;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = vocalVolume;
      vocalSource.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);

      const instSource = offlineCtx.createBufferSource();
      instSource.buffer = instDecoded;
      const instGain = offlineCtx.createGain();
      instGain.gain.value = instrumentalVolume;
      instSource.connect(instGain);
      instGain.connect(offlineCtx.destination);

      vocalSource.start(0);
      instSource.start(0);

      toast.info("Rendering custom fusion mix...");
      const renderedBuffer = await offlineCtx.startRendering();

      // 4. Convert to WAV Blob
      const wavBuf = audioBufferToWav(renderedBuffer);
      const wavBlob = new Blob([wavBuf], { type: "audio/wav" });

      // 5. Try direct presigned upload to R2, or fallback to base64 if direct upload isn't configured
      toast.info("Uploading mixed fusion to your Riffs...");
      let finalAudioUrl: string | undefined = undefined;
      let finalBase64: string | undefined = undefined;

      try {
        const presigned = await presignedMutation.mutateAsync({
          mimeType: "audio/wav",
          fileExtension: "wav",
        });
        if (presigned.useDirectUpload && presigned.uploadUrl && presigned.publicUrl) {
          const putRes = await fetch(presigned.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "audio/wav" },
            body: wavBlob,
          });
          if (!putRes.ok) throw new Error("Direct R2 upload failed");
          finalAudioUrl = presigned.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Direct upload fallback to base64:", uploadErr);
      }

      if (!finalAudioUrl) {
        // Fallback: base64 encoding for small files / Forge storage
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const res = reader.result as string;
            const base64 = res.includes(",") ? res.split(",")[1] : res;
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(wavBlob);
        });
        finalBase64 = await base64Promise;
      }

      // 6. Find corresponding stemSplitId for this vocalStemUrl
      const matchedSplit = completedSplits.find(s => s.stems?.vocalUrl === vocalStemUrl);
      const stemSplitId = matchedSplit ? matchedSplit.id : (completedSplits[0]?.id ?? 1);

      // 7. Save to Riffs via tRPC
      const savedTrack = await saveMixMutation.mutateAsync({
        stemSplitId,
        audioUrl: finalAudioUrl,
        audioBase64: finalBase64,
        mimeType: "audio/wav",
        title: title.trim(),
        blendDescription: `Vocals ${(vocalVolume * 100).toFixed(0)}%, Instrumental ${(instrumentalVolume * 100).toFixed(0)}%`,
      });

      setResultUrl(savedTrack.audioUrl);
      setIsMixing(false);
      refetchGenerations();
      toast.success("Custom fusion mix saved to your library!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Client-side mix failed";
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
      <div className={`rounded-2xl border ${theme.borderAccent} bg-white/[0.035] p-4`}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.textAccent}`}>Listen Together</p>
        <h2 className="mt-1 text-xl font-semibold text-white">What happens when these two meet?</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">Choose a vocal take and a fusion landscape. Your browser renders the relationship while the original pieces remain unchanged.</p>
      </div>

      {/* Step 1: Pick Vocal Stem */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>1. Choose a vocal take</p>
        <p className="text-xs text-gray-400">Select an isolated voice you want to bring into a new relationship.</p>
        {completedSplits.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No completed stem splits yet. Split a vocal-take generation in My Stems first.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {completedSplits.map((split) => (
              <div key={split.id}
                className={`flex items-center gap-2 rounded-lg border transition-all text-sm ${
                  vocalStemUrl === split.stems?.vocalUrl
                    ? `border-transparent bg-gradient-to-r ${theme.accent} text-white`
                    : `${theme.borderAccent} bg-white/5 text-gray-300`
                }`}
              >
                <button
                  onClick={(e) => togglePreview(e, split.stems!.vocalUrl!)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-l-lg hover:bg-white/10 transition-colors"
                  title="Preview vocal stem"
                >
                  {previewUrl === split.stems?.vocalUrl
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  className="flex-1 text-left py-2 pr-3 min-w-0"
                  onClick={() => {
                    setVocalStemUrl(split.stems!.vocalUrl!);
                    setVocalStemLabel(split.generationTitle ?? `Vocal Take #${split.generationId}`);
                  }}
                >
                  <span className="font-medium line-clamp-1 block">
                    {split.generationTitle ?? `Vocal Take #${split.generationId}`}
                  </span>
                  <span className="text-xs opacity-50 block mt-0.5">Vocal stem</span>
                  {readMatchFamilyId(myGenerations?.find(g => g.id === split.generationId)?.metadata) && (
                    <Badge className="mt-1 bg-white/10 text-current border-white/15 text-[10px]">
                      {readMatchFamilyId(myGenerations?.find(g => g.id === split.generationId)?.metadata)}
                    </Badge>
                  )}
                </button>
                {vocalStemUrl === split.stems?.vocalUrl && <Check className="w-3.5 h-3.5 mr-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
        <audio ref={previewRef} src={previewUrl ?? undefined} onEnded={() => setPreviewUrl(null)} />
        {vocalStemLabel && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-green-400">
            <span>Selected: {vocalStemLabel}</span>
            {selectedMatchFamilyId && <Badge className="bg-white/5 text-gray-200 border-white/10 text-[10px]">Match Family {selectedMatchFamilyId}</Badge>}
          </div>
        )}
      </div>

      {/* Step 2: Pick Instrumental */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>2. Choose a fusion landscape</p>
        <p className="text-xs text-gray-400">Start with beds in the same Match Family when you want the most natural fit.</p>
        {instrumentalTracks.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No tagged fusion landscapes yet. Build a new sound world first.</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {instrumentalTracks.map((track) => (
              <div key={track.id}
                className={`flex items-center gap-2 rounded-lg border transition-all text-sm ${
                  instrumentalUrl === track.audioUrl
                    ? `border-transparent bg-gradient-to-r ${theme.accent} text-white`
                    : `${theme.borderAccent} bg-white/5 text-gray-300`
                }`}
              >
                <button
                  onClick={(e) => togglePreview(e, track.audioUrl!)}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-l-lg hover:bg-white/10 transition-colors"
                  title="Preview track"
                >
                  {previewUrl === track.audioUrl
                    ? <Pause className="w-3.5 h-3.5" />
                    : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  className="flex-1 text-left py-2 pr-3 min-w-0"
                  onClick={() => { setInstrumentalUrl(track.audioUrl); setInstrumentalLabel(track.title); }}
                >
                  <span className="font-medium line-clamp-1 block">{track.title}</span>
                  <span className="mt-1 flex items-center gap-1.5">
                    {track.matchFamilyId && <Badge className="bg-white/10 text-current border-white/15 text-[10px]">{track.matchFamilyId}</Badge>}
                    {selectedMatchFamilyId && track.matchFamilyId === selectedMatchFamilyId && <span className="text-[10px] opacity-65">natural starting point</span>}
                  </span>
                </button>
                {instrumentalUrl === track.audioUrl && <Check className="w-3.5 h-3.5 mr-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
        {instrumentalLabel && (
          <p className="text-xs text-green-400">Selected: {instrumentalLabel}</p>
        )}
      </div>

      {/* Step 3: Volume Controls */}
      <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-4 space-y-4`}>
        <p className={`text-sm font-semibold ${theme.textAccent}`}>3. Let each element breathe</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-300">Voice</span>
              <span className="text-xs text-gray-400">{(vocalVolume * 100).toFixed(0)}%</span>
            </div>
            <Slider value={[vocalVolume * 100]} min={0} max={200} step={5}
              onValueChange={([v]) => setVocalVolume(v / 100)}
              className="w-full" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-300">Landscape</span>
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
        <p className={`text-sm font-semibold ${theme.textAccent}`}>4. Name what you found</p>
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
          <><Sparkles className="w-4 h-4 mr-2" />Hear them together</>
        )}
      </Button>

      {isMixing && (
        <div className="text-center text-xs text-gray-400 animate-pulse">
          Your browser is rendering this custom fusion…
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

// ─── Match Family Shelf ─────────────────────────────────────────────────────────
function MatchFamilyShelf({
  theme, activeMatchFamilyId, onClearFamilyFilter, onChooseBed, onOpenBlend,
}: {
  theme: SessionTheme;
  activeMatchFamilyId: string | null;
  onClearFamilyFilter: () => void;
  onChooseBed: (bed: { id: number; title: string; audioUrl: string; matchFamilyId: string }) => void;
  onOpenBlend: () => void;
}) {
  const { data: myGenerations, isLoading } = trpc.musicGeneration.myGenerations.useQuery();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement>(null);

  const families = new Map<string, {
    beds: Array<{ id: number; title: string; audioUrl: string }>;
    vocals: Array<{ id: number; title: string; audioUrl: string }>;
  }>();

  (myGenerations ?? []).forEach((generation) => {
    if (generation.status !== "complete" || !generation.audioUrl) return;
    const familyId = readMatchFamilyId(generation.metadata);
    if (!familyId) return;
    let metadata: Record<string, unknown> = {};
    try { metadata = generation.metadata ? JSON.parse(generation.metadata) : {}; } catch { return; }
    const family = families.get(familyId) ?? { beds: [], vocals: [] };
    if (metadata.isInstrumentalFusion === true || metadata.mode === "bespoke-instrumental") {
      family.beds.push({ id: generation.id, title: generation.title, audioUrl: generation.audioUrl });
    } else if (metadata.generationType === "vocal-take") {
      family.vocals.push({ id: generation.id, title: generation.title, audioUrl: generation.audioUrl });
    }
    families.set(familyId, family);
  });

  const orderedFamilies = Array.from(families.entries()).sort(([a], [b]) =>
    Number(b.slice(2)) - Number(a.slice(2))
  );
  const visibleFamilies = activeMatchFamilyId
    ? orderedFamilies.filter(([familyId]) => familyId === activeMatchFamilyId)
    : orderedFamilies;
  const togglePreview = (url: string) => {
    if (previewUrl === url) {
      previewRef.current?.pause();
      setPreviewUrl(null);
    } else {
      previewRef.current?.pause();
      setPreviewUrl(url);
      window.setTimeout(() => previewRef.current?.play().catch(() => {}), 40);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className={`rounded-2xl border ${theme.borderAccent} bg-white/[0.035] p-4 md:p-5`}>
        <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${theme.textAccent}`}>Shared Shape</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Return to the relationships you have already begun.</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">A Match Family holds fusion beds and vocal takes designed around the same creative thread. Start with the natural pairing, then let your ear decide what else belongs.</p>
        {activeMatchFamilyId && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-white/5 text-gray-200 border-white/10 text-[11px]">Showing Match Family {activeMatchFamilyId}</Badge>
            <Button onClick={onClearFamilyFilter} variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white">Browse all families</Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className={`rounded-xl border ${theme.borderAccent} bg-white/5 p-8 text-center text-sm text-gray-400`}>Gathering your creative families…</div>
      ) : visibleFamilies.length === 0 ? (
        <div className={`rounded-xl border border-dashed ${theme.borderAccent} bg-white/[0.025] p-8 text-center`}>
          <Layers className={`mx-auto mb-3 h-8 w-8 ${theme.textAccent}`} />
          <p className="text-sm font-medium text-white">{activeMatchFamilyId ? `Match Family ${activeMatchFamilyId} is still gathering.` : "Your first Match Family is waiting to begin."}</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-400">{activeMatchFamilyId ? "Keep the fusion bed and create vocal takes from it. They will gather here automatically as the family grows." : "Keep a new fusion bed in Sound World and the room will create a family label such as F-01. Vocal takes made from that bed will gather here automatically."}</p>
          {activeMatchFamilyId && <Button onClick={onClearFamilyFilter} variant="outline" size="sm" className={`mt-4 border ${theme.borderAccent} bg-white/5 text-white hover:bg-white/10`}>Browse all families</Button>}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleFamilies.map(([familyId, family]) => (
            <section key={familyId} className={`overflow-hidden rounded-2xl border ${theme.borderAccent} bg-white/[0.035]`}>
              <div className="flex flex-col gap-3 border-b border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${theme.accent}`}><Layers className="h-4 w-4 text-white" /></div>
                  <div>
                    <div className="flex items-center gap-2"><h3 className="font-semibold text-white">Match Family {familyId}</h3><Badge className="bg-white/5 text-gray-300 border-white/10 text-[10px]">Shared Shape</Badge></div>
                    <p className="mt-0.5 text-xs text-gray-400">{family.beds.length} fusion {family.beds.length === 1 ? "bed" : "beds"} · {family.vocals.length} vocal {family.vocals.length === 1 ? "take" : "takes"}</p>
                  </div>
                </div>
                <Button onClick={onOpenBlend} variant="outline" size="sm" className={`border ${theme.borderAccent} bg-white/5 text-white hover:bg-white/10`}><Sparkles className={`mr-1.5 h-3.5 w-3.5 ${theme.textAccent}`} />Open Blend</Button>
              </div>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                  <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.textAccent}`}>Fusion beds</p>
                  {family.beds.length === 0 ? <p className="text-xs text-gray-500">No tagged fusion bed is available in this family.</p> : (
                    <div className="space-y-2">{family.beds.map((bed) => (
                      <div key={bed.id} className={`flex items-center gap-2 rounded-xl border ${theme.borderAccent} bg-white/5 p-2.5`}>
                        <button onClick={() => togglePreview(bed.audioUrl)} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-gray-200 hover:bg-white/15">{previewUrl === bed.audioUrl ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                        <span className="min-w-0 flex-1 truncate text-sm text-white">{bed.title}</span>
                        <Button onClick={() => onChooseBed({ ...bed, matchFamilyId: familyId })} size="sm" variant="outline" className={`border ${theme.borderAccent} bg-transparent text-xs text-white hover:bg-white/10`}>Use this bed</Button>
                      </div>
                    ))}</div>
                  )}
                </div>
                <div>
                  <p className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${theme.textAccent}`}>Vocal takes</p>
                  {family.vocals.length === 0 ? <p className="text-xs text-gray-500">Create a vocal take from this family’s bed and it will appear here.</p> : (
                    <div className="space-y-2">{family.vocals.map((vocal) => (
                      <div key={vocal.id} className={`flex items-center gap-2 rounded-xl border ${theme.borderAccent} bg-white/5 p-2.5`}>
                        <button onClick={() => togglePreview(vocal.audioUrl)} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-gray-200 hover:bg-white/15">{previewUrl === vocal.audioUrl ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                        <span className="min-w-0 flex-1 truncate text-sm text-white">{vocal.title}</span>
                        <Badge className="bg-white/5 text-gray-300 border-white/10 text-[10px]">Vocal take</Badge>
                      </div>
                    ))}</div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
      <audio ref={previewRef} src={previewUrl ?? undefined} onEnded={() => setPreviewUrl(null)} />
    </div>
  );
}

// ─── Main Session Page ─────────────────────────────────────────────────────────
export default function TheSession() {
  const { isAuthenticated } = useAuth();
  const [activeTool, setActiveTool] = useState<"generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer">("generate");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [fusionsOpen, setFusionsOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [instrumentPaletteOpen, setInstrumentPaletteOpen] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("midnight-studio");
  const [selectedInstrument, setSelectedInstrument] = useState<{
    id: string; name: string; family: string; description: string; audioPath: string; tags: string[];
  } | null>(null);
  const [activeFusionBed, setActiveFusionBed] = useState<{ id: number; title: string; audioUrl: string; matchFamilyId: string } | null>(null);
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  // Persisted Add Vocals state — survives tab switches
  const [vocalsTrackUrl, setVocalsTrackUrl] = useState<string | null>(null);
  const [vocalsTrackTitle, setVocalsTrackTitle] = useState<string | null>(null);
  const [vocalsLyrics, setVocalsLyrics] = useState("");
  const [vocalsAccentId, setVocalsAccentId] = useState<string | null>(null);
  const [vocalsDialectEnabled, setVocalsDialectEnabled] = useState(false);

  const theme = SESSION_THEMES.find((t) => t.id === selectedThemeId) ?? SESSION_THEMES[0];
  const handleToolChange = (tool: "generate" | "family" | "vocals" | "lyrics" | "styles" | "stems" | "mixer") => {
    if (tool === "family") setFamilyFilter(activeFusionBed?.matchFamilyId ?? null);
    setActiveTool(tool);
  };

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
          activeTool={activeTool} onToolChange={handleToolChange} theme={theme}
          onOpenThemePicker={() => setThemePickerOpen(true)}
          onOpenFusions={() => setFusionsOpen(true)}
          onOpenFrequency={() => setFrequencyOpen(true)}
          onOpenInstrumentPalette={() => setInstrumentPaletteOpen(true)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-0">
        <SessionHeader theme={theme} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0 min-h-0">
          <SessionJourney activeTool={activeTool} onToolChange={handleToolChange} theme={theme} activeFusionBed={activeFusionBed} />
          <SessionStageCallout
            activeTool={activeTool}
            theme={theme}
            onOpenInstrumentPalette={() => setInstrumentPaletteOpen(true)}
            activeFusionBed={activeFusionBed}
            onExploreVoice={() => setActiveTool("vocals")}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }} className="w-full max-w-full"
            >
              {activeTool === "generate" ? (
                <GeneratePage
                  selectedInstrument={selectedInstrument}
                  onClearInstrument={() => setSelectedInstrument(null)}
                  sessionMode
                  onFusionBedReady={(bed) => {
                    setActiveFusionBed(bed);
                    setVocalsTrackUrl(bed.audioUrl);
                    setVocalsTrackTitle(bed.title);
                  }}
                />
              ) : activeTool === "family" ? (
                <MatchFamilyShelf
                  theme={theme}
                  activeMatchFamilyId={familyFilter}
                  onClearFamilyFilter={() => setFamilyFilter(null)}
                  onChooseBed={(bed) => {
                    setActiveFusionBed(bed);
                    setVocalsTrackUrl(bed.audioUrl);
                    setVocalsTrackTitle(bed.title);
                    setFamilyFilter(bed.matchFamilyId);
                    setActiveTool("vocals");
                  }}
                  onOpenBlend={() => setActiveTool("mixer")}
                />
              ) : activeTool === "vocals" ? (
                <AddVocalsPanel theme={theme}
                  persistedTrackUrl={vocalsTrackUrl}
                  persistedTrackTitle={vocalsTrackTitle}
                  persistedLyrics={vocalsLyrics}
                  persistedAccentId={vocalsAccentId}
                  persistedDialectEnabled={vocalsDialectEnabled}
                  onTrackChange={(url, title) => { setVocalsTrackUrl(url); setVocalsTrackTitle(title ?? null); }}
                  onLyricsChange={setVocalsLyrics}
                  onAccentChange={setVocalsAccentId}
                  onDialectChange={setVocalsDialectEnabled}
                />
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
          { id: "generate" as const, icon: Music, label: "World" },
          { id: "vocals" as const, icon: Mic, label: "Voice" },
          { id: "mixer" as const, icon: Layers, label: "Listen" },
          { id: "lyrics" as const, icon: Pen, label: "Words" },
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
