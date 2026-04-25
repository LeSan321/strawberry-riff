import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Music,
  Pen,
  Layers,
  Sparkles,
  Clock,
  Star,
  Palette,
  Zap,
  BookOpen,
  Shuffle,
  Crown,
  Lock,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GeneratePage } from "./Generate";
import { LyricsGeneratorPage } from "./LyricsGenerator";
import FusionRecipesDrawer from "@/components/FusionRecipesDrawer";

// ─── Studio Theme Definitions ─────────────────────────────────────────────────
const STUDIO_THEMES = [
  {
    id: "forest-studio",
    name: "Forest Studio",
    description: "Floor-to-ceiling glass walls open to an ancient forest",
    image: "/manus-storage/studio-header-forest-studio_81baaef0.jpg",
    // Raspberry accent breaks the green wash
    accent: "from-emerald-600 to-teal-700",
    accentLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    // Minimal gradient — just a soft bottom fade so text is readable
    headerGradient: "from-transparent via-transparent to-emerald-950/80",
    sidebarBg: "bg-[#0a1f14]",
    canvasBg: "bg-[#0a1f14]",
    textAccent: "text-emerald-400",
    // Raspberry accent for UI pops
    raspberryAccent: "text-rose-400",
    raspberryBorder: "border-rose-500/30",
    raspberryBg: "bg-rose-500/10",
    borderAccent: "border-emerald-900/50",
    buttonAccent: "bg-emerald-700 hover:bg-emerald-600",
  },
  {
    id: "cozy-den",
    name: "Cozy Den",
    description: "Warm cabin studio with amber light and forest window",
    image: "/manus-storage/studio-header-cozy-den_20475e46.jpg",
    accent: "from-amber-600 to-orange-700",
    accentLight: "bg-amber-50 text-amber-700 border-amber-200",
    headerGradient: "from-transparent via-transparent to-amber-950/80",
    sidebarBg: "bg-[#1f1208]",
    canvasBg: "bg-[#1f1208]",
    textAccent: "text-amber-400",
    raspberryAccent: "text-amber-300",
    raspberryBorder: "border-amber-500/30",
    raspberryBg: "bg-amber-500/10",
    borderAccent: "border-amber-900/50",
    buttonAccent: "bg-amber-700 hover:bg-amber-600",
  },
  {
    id: "producer-workshop",
    name: "Producer's Workshop",
    description: "Tropical jungle studio with waterfall view",
    image: "/manus-storage/studio-header-producer-workshop_df572a47.jpg",
    // Dialed-down to deep indigo instead of bright violet
    accent: "from-indigo-700 to-purple-800",
    accentLight: "bg-indigo-50 text-indigo-700 border-indigo-200",
    headerGradient: "from-transparent via-transparent to-indigo-950/80",
    sidebarBg: "bg-[#0d0a1f]",
    canvasBg: "bg-[#0d0a1f]",
    textAccent: "text-indigo-400",
    raspberryAccent: "text-indigo-300",
    raspberryBorder: "border-indigo-500/30",
    raspberryBg: "bg-indigo-500/10",
    borderAccent: "border-indigo-900/50",
    buttonAccent: "bg-indigo-700 hover:bg-indigo-600",
  },
  {
    id: "rock-room",
    name: "Rock Room",
    description: "Exposed brick rehearsal space with Marshall stacks",
    image: "/manus-storage/studio-header-rock-room_606b6222.jpg",
    accent: "from-rose-700 to-red-800",
    accentLight: "bg-rose-50 text-rose-700 border-rose-200",
    headerGradient: "from-transparent via-transparent to-rose-950/80",
    sidebarBg: "bg-[#1f0a0a]",
    canvasBg: "bg-[#1f0a0a]",
    textAccent: "text-rose-400",
    raspberryAccent: "text-rose-300",
    raspberryBorder: "border-rose-500/30",
    raspberryBg: "bg-rose-500/10",
    borderAccent: "border-rose-900/50",
    buttonAccent: "bg-rose-700 hover:bg-rose-600",
  },
];

// ─── Theme Picker Modal ────────────────────────────────────────────────────────
function ThemePickerModal({
  currentTheme,
  onSelect,
  onClose,
}: {
  currentTheme: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Choose Your Studio</h2>
            <p className="text-sm text-gray-400 mt-0.5">Select the environment that fuels your creativity</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {STUDIO_THEMES.map((theme) => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { onSelect(theme.id); onClose(); }}
              className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                currentTheme === theme.id
                  ? "border-white shadow-lg shadow-white/20"
                  : "border-gray-700 hover:border-gray-500"
              }`}
            >
              <img
                src={theme.image}
                alt={theme.name}
                className="w-full h-full object-cover"
              />
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

// ─── Left Sidebar ──────────────────────────────────────────────────────────────
function StudioSidebar({
  activeTool,
  onToolChange,
  theme,
  onOpenThemePicker,
  onOpenFusions,
}: {
  activeTool: "generate" | "lyrics";
  onToolChange: (t: "generate" | "lyrics") => void;
  theme: typeof STUDIO_THEMES[0];
  onOpenThemePicker: () => void;
  onOpenFusions: () => void;
}) {
  const tools = [
    { id: "generate" as const, label: "Generate", icon: Music, desc: "AI music creation" },
    { id: "lyrics" as const, label: "Lyrics", icon: Pen, desc: "Writer's Bible" },
  ];

  return (
    <div className={`flex flex-col h-full ${theme.sidebarBg} border-r ${theme.borderAccent} w-[72px] md:w-[200px] flex-shrink-0`}>
      {/* Studio Logo */}
      <div className={`px-3 md:px-4 py-4 border-b ${theme.borderAccent}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${theme.accent} flex items-center justify-center flex-shrink-0`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className={`hidden md:block text-sm font-bold ${theme.textAccent}`}>Studio</span>
        </div>
      </div>

      {/* Tool Nav */}
      <nav className="flex-1 p-2 space-y-1">
        <p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-60 px-2 py-1`}>
          Tools
        </p>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? `bg-gradient-to-r ${theme.accent} text-white shadow-md`
                  : `text-gray-400 hover:text-white hover:bg-white/10`
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

        <p className={`hidden md:block text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-60 px-2 py-1`}>
          Resources
        </p>

        {/* Fusions — uses raspberry/accent color for visual pop */}
        <button
          onClick={onOpenFusions}
          className={`w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left hover:bg-white/10 transition-all ${theme.raspberryAccent} hover:text-white`}
        >
          <Layers className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">Fusions</p>
            <p className="text-xs mt-0.5 opacity-60">47 recipes</p>
          </div>
        </button>

        <button
          onClick={() => {}}
          className="w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-left text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">Writer's Bible</p>
            <p className="text-xs mt-0.5 text-gray-500">Craft guide</p>
          </div>
        </button>
      </nav>

      {/* Theme Switcher */}
      <div className={`p-2 border-t ${theme.borderAccent}`}>
        <button
          onClick={onOpenThemePicker}
          className="w-full flex items-center gap-2.5 px-2 md:px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <Palette className="w-4 h-4 flex-shrink-0" />
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-left">Theme</p>
            <p className="text-xs mt-0.5 text-gray-500 text-left truncate">{theme.name}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Right Context Panel ───────────────────────────────────────────────────────
function StudioContextPanel({
  theme,
  activeTool,
  isOpen,
  onClose,
}: {
  theme: typeof STUDIO_THEMES[0];
  activeTool: "generate" | "lyrics";
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const historyQuery = trpc.musicGeneration.myGenerations.useQuery(
    undefined,
    { enabled: !!user }
  );

  const writerTips = [
    "Start with the emotion, not the genre.",
    "A great hook lives in the first 8 bars.",
    "Contrast is the engine of tension and release.",
    "The bridge should feel like a revelation.",
    "Silence is an instrument — use it.",
  ];

  const generateTips = [
    "Add a BPM hint for tighter results (e.g. '95 BPM').",
    "Name a specific instrument for texture control.",
    "Use emotional adjectives before genre names.",
    "Try 'Balanced' intensity for first drafts.",
    "Reference a decade for instant sonic context.",
  ];

  const tips = activeTool === "lyrics" ? writerTips : generateTips;
  const [tipIndex] = useState(() => Math.floor(Math.random() * tips.length));

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${theme.borderAccent} flex items-center justify-between flex-shrink-0`}>
        <span className={`text-sm font-semibold ${theme.textAccent}`}>Context</span>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-white" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Quick Tip */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className={`w-3.5 h-3.5 ${theme.textAccent}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-70`}>
              Pro Tip
            </span>
          </div>
          <div className={`rounded-lg p-3 bg-white/5 border ${theme.borderAccent}`}>
            <p className="text-sm text-gray-300 leading-relaxed italic">"{tips[tipIndex]}"</p>
          </div>
        </div>

        {/* Recent Generations */}
        {user && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className={`w-3.5 h-3.5 ${theme.textAccent}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-70`}>
                Recent
              </span>
            </div>
            <div className="space-y-2">
              {historyQuery.isLoading && (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
                  ))}
                </div>
              )}
              {historyQuery.data?.slice(0, 4).map((gen: { id: number; title: string | null; prompt: string | null }) => (
                <div
                  key={gen.id}
                  className={`rounded-lg p-2.5 bg-white/5 border ${theme.borderAccent} hover:bg-white/10 transition-colors cursor-pointer`}
                >
                  <p className="text-xs font-medium text-gray-200 truncate">{gen.title || "Untitled"}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{gen.prompt?.slice(0, 50)}…</p>
                </div>
              ))}
              {historyQuery.data?.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-3">No generations yet</p>
              )}
            </div>
          </div>
        )}

        {/* Quick Fusions */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Shuffle className={`w-3.5 h-3.5 ${theme.textAccent}`} />
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme.textAccent} opacity-70`}>
              Quick Fusions
            </span>
          </div>
          <div className="space-y-1.5">
            {["Lo-fi Hip Hop + Dreamy Jazz", "Indie Folk + Electronic", "Cinematic + Chill Trap"].map((f) => (
              <div
                key={f}
                className={`rounded-lg px-3 py-2 bg-white/5 border ${theme.borderAccent} text-xs text-gray-300 hover:bg-white/10 transition-colors cursor-pointer`}
              >
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Premium Upsell */}
        {user && !user.isPremium && (
          <div className={`rounded-xl p-4 bg-gradient-to-br ${theme.accent} bg-opacity-20`}>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-semibold text-white">Go Premium</span>
            </div>
            <p className="text-xs text-white/80 mb-3">Unlock unlimited generations, voice cloning, and more.</p>
            <Link href="/pricing">
              <Button size="sm" className="w-full bg-white text-gray-900 hover:bg-gray-100 text-xs font-semibold">
                View Plans
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Desktop: slide-in side panel ── */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`hidden md:flex flex-shrink-0 h-full ${theme.sidebarBg} border-l ${theme.borderAccent} overflow-hidden`}
          >
            <div className="w-[280px] h-full">{panelContent}</div>
          </motion.div>

          {/* ── Mobile: bottom sheet overlay ── */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`md:hidden fixed inset-x-0 bottom-0 z-50 rounded-t-2xl ${theme.sidebarBg} border-t ${theme.borderAccent} shadow-2xl`}
            style={{ maxHeight: "60vh" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="h-[calc(60vh-2rem)] overflow-y-auto">{panelContent}</div>
          </motion.div>

          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Studio Header ─────────────────────────────────────────────────────────────
function StudioHeader({
  theme,
  onOpenThemePicker,
}: {
  theme: typeof STUDIO_THEMES[0];
  onOpenThemePicker: () => void;
}) {
  return (
    <div className="relative h-48 md:h-56 flex-shrink-0 overflow-hidden">
      <img
        src={theme.image}
        alt={theme.name}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Soft bottom fade only — no dark overlay on the photo */}
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.headerGradient}`} />

      {/* Header Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
        {/* Top Row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`text-xs bg-black/40 text-white border-white/20 backdrop-blur-sm`}>
                <Sparkles className="w-3 h-3 mr-1" />
                Studio Mode
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              {theme.name}
            </h1>
            <p className="text-sm text-white/70 mt-0.5 drop-shadow">{theme.description}</p>
          </div>
          {/* Only the Change Theme button in the top-right; context toggle lives in sidebar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenThemePicker}
            className="bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 border border-white/20 h-8 px-3 text-xs"
          >
            <Palette className="w-3.5 h-3.5 mr-1.5" />
            Change
          </Button>
        </div>

        {/* Bottom Row — Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/60">
          <Link href="/">
            <span className="hover:text-white/90 cursor-pointer transition-colors">Home</span>
          </Link>
          <span>/</span>
          <span className="text-white/90">Studio</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Studio Page ──────────────────────────────────────────────────────────
export default function Studio() {
  const { user, isAuthenticated } = useAuth();
  const [activeTool, setActiveTool] = useState<"generate" | "lyrics">("generate");
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [fusionsOpen, setFusionsOpen] = useState(false);

  const prefsQuery = trpc.studio.getPreferences.useQuery(undefined, {
    enabled: !!user,
  });
  const setThemeMutation = trpc.studio.setTheme.useMutation({
    onSuccess: () => {
      prefsQuery.refetch();
      toast.success("Studio theme updated");
    },
  });

  const currentThemeId = prefsQuery.data?.studioTheme ?? "forest-studio";
  const theme = STUDIO_THEMES.find((t) => t.id === currentThemeId) ?? STUDIO_THEMES[0];

  const handleThemeSelect = (id: string) => {
    setThemeMutation.mutate({ theme: id });
  };

  // Unauthenticated teaser
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Studio Mode
          </h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Your dedicated creative environment. Generate music, write lyrics, and explore fusion recipes — all in one immersive space.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {STUDIO_THEMES.map((t) => (
              <div key={t.id} className="relative rounded-xl overflow-hidden aspect-video border border-gray-700">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${t.headerGradient}`} />
                <div className="absolute bottom-0 left-0 p-2">
                  <p className="text-white text-xs font-semibold">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 justify-center mb-4">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Sign in to enter the Studio</span>
          </div>
          <a href={getLoginUrl()}>
            <Button
              size="lg"
              className="w-full rounded-full font-semibold text-white border-0"
              style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
            >
              Sign In to Enter Studio
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // Studio always renders in dark mode — override CSS vars so shadcn components
  // (Card, Input, Select, etc.) use dark-theme colors regardless of global theme.
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
    "--ring": "oklch(0.70 0.22 340)",
  } as React.CSSProperties;

  return (
    <div className={`flex h-screen overflow-hidden ${theme.canvasBg}`} style={darkVars}>
      {/* Left Sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <StudioSidebar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          theme={theme}
          onOpenThemePicker={() => setThemePickerOpen(true)}
          onOpenFusions={() => setFusionsOpen(true)}
        />
      </div>

      {/* Central Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Cinematic Header */}
        <StudioHeader
          theme={theme}
          onOpenThemePicker={() => setThemePickerOpen(true)}
        />

        {/* Tool Content */}
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTool}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="min-h-full"
            >
              {activeTool === "generate" ? (
                <GeneratePage />
              ) : (
                <LyricsGeneratorPage />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Context Panel (desktop side panel / mobile bottom sheet) */}
      <StudioContextPanel
        theme={theme}
        activeTool={activeTool}
        isOpen={contextOpen}
        onClose={() => setContextOpen(false)}
      />

      {/* Mobile bottom toolbar */}
      <div className={`md:hidden fixed bottom-0 inset-x-0 z-30 ${theme.sidebarBg} border-t ${theme.borderAccent} flex items-center justify-around px-4 py-2 safe-area-pb`}>
        <button
          onClick={() => setActiveTool("generate")}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTool === "generate" ? `bg-gradient-to-r ${theme.accent} text-white` : "text-gray-400"
          }`}
        >
          <Music className="w-5 h-5" />
          <span className="text-[10px] font-medium">Generate</span>
        </button>
        <button
          onClick={() => setActiveTool("lyrics")}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
            activeTool === "lyrics" ? `bg-gradient-to-r ${theme.accent} text-white` : "text-gray-400"
          }`}
        >
          <Pen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Lyrics</span>
        </button>
        <button
          onClick={() => setFusionsOpen(true)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-gray-400"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium">Fusions</span>
        </button>
        <button
          onClick={() => setContextOpen((v) => !v)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all ${
            contextOpen ? `${theme.textAccent}` : "text-gray-400"
          }`}
        >
          <Star className="w-5 h-5" />
          <span className="text-[10px] font-medium">Tips</span>
        </button>
        <button
          onClick={() => setThemePickerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-gray-400"
        >
          <Palette className="w-5 h-5" />
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      </div>

      {/* Theme Picker Modal */}
      <AnimatePresence>
        {themePickerOpen && (
          <ThemePickerModal
            currentTheme={currentThemeId}
            onSelect={handleThemeSelect}
            onClose={() => setThemePickerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Fusion Recipes Drawer */}
      <FusionRecipesDrawer
        open={fusionsOpen}
        onClose={() => setFusionsOpen(false)}
      />
    </div>
  );
}
