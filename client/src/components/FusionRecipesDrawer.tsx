import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, Zap, Globe, Shuffle, Star, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FUSIONS, type Fusion } from "@shared/fusionLibrary";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Tier Config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  safe: {
    label: "Safe Harbor",
    icon: Star,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    desc: "Crowd-pleasing fusions with proven sonic chemistry",
  },
  medium: {
    label: "Medium Blend",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    desc: "Bolder combinations with surprising contrast",
  },
  experimental: {
    label: "Experimental",
    icon: Layers,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    desc: "Avant-garde mashups that challenge expectations",
  },
  global: {
    label: "Global Fusion",
    icon: Globe,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    desc: "Cross-cultural mashups spanning world music traditions",
  },
  wildcard: {
    label: "Wildcard",
    icon: Shuffle,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    desc: "Maximum chaos — for when you want to break all the rules",
  },
} as const;

type Tier = keyof typeof TIER_CONFIG;

// ─── Fusion Card ──────────────────────────────────────────────────────────────
function FusionCard({
  fusion,
  onUse,
}: {
  fusion: Fusion;
  onUse: (fusion: Fusion) => void;
}) {
  const cfg = TIER_CONFIG[fusion.tier];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(fusion.promptCore);
    setCopied(true);
    toast.success("Prompt copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${cfg.bg} hover:bg-white/5 transition-colors group`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white leading-snug">{fusion.name}</h4>
          {fusion.whyItWorks && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">{fusion.whyItWorks}</p>
          )}
        </div>
        <Badge className={`text-xs flex-shrink-0 border ${cfg.badge}`}>
          {fusion.tier}
        </Badge>
      </div>

      {/* Prompt preview */}
      <div className="bg-black/30 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 font-mono">{fusion.promptCore}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onUse(fusion)}
          className={`flex-1 h-7 text-xs font-semibold text-white border-0 bg-gradient-to-r ${
            fusion.tier === "safe" ? "from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500" :
            fusion.tier === "medium" ? "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500" :
            fusion.tier === "experimental" ? "from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500" :
            fusion.tier === "global" ? "from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500" :
            "from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500"
          }`}
        >
          <ArrowRight className="w-3 h-3 mr-1" />
          Use This
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
interface FusionRecipesDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Optional callback when user clicks "Use This" — if not provided, navigates to /generate with prompt pre-filled */
  onUsePrompt?: (promptCore: string) => void;
}

export default function FusionRecipesDrawer({ open, onClose, onUsePrompt }: FusionRecipesDrawerProps) {
  const [activeTier, setActiveTier] = useState<Tier>("safe");
  const [, navigate] = useLocation();

  const handleUse = (fusion: Fusion) => {
    if (onUsePrompt) {
      onUsePrompt(fusion.promptCore);
      onClose();
    } else {
      // Store prompt in sessionStorage and navigate to /generate
      sessionStorage.setItem("fusionPrompt", fusion.promptCore);
      sessionStorage.setItem("fusionName", fusion.name);
      navigate("/generate");
      onClose();
      toast.success(`"${fusion.name}" loaded into Generate`);
    }
  };

  const tiersInOrder: Tier[] = ["safe", "medium", "experimental", "global", "wildcard"];
  const filteredFusions = FUSIONS.filter((f) => f.tier === activeTier);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-md bg-gray-950 border-l border-gray-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                  Fusion Recipes
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">47 genre mashups — click "Use This" to pre-fill Generate</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tier Tabs */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-800 overflow-x-auto flex-shrink-0">
              {tiersInOrder.map((tier) => {
                const cfg = TIER_CONFIG[tier];
                const Icon = cfg.icon;
                const count = FUSIONS.filter((f) => f.tier === tier).length;
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveTier(tier)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      activeTier === tier
                        ? `${cfg.bg} ${cfg.color} border`
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                    <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTier === tier ? "bg-white/20" : "bg-white/5"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tier Description */}
            <div className="px-5 py-2.5 border-b border-gray-800/50 flex-shrink-0">
              <p className="text-xs text-gray-400 italic">{TIER_CONFIG[activeTier].desc}</p>
            </div>

            {/* Fusion Cards */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTier}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                >
                  {filteredFusions.map((fusion, i) => (
                    <FusionCard key={fusion.name} fusion={fusion} onUse={handleUse} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 flex-shrink-0">
              <p className="text-xs text-gray-600 text-center">
                Based on the Music Prompt Bible v1.3 · Chapter 10
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
