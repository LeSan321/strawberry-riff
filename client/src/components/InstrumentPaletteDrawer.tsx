import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music2, Play, Pause, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Family Config ────────────────────────────────────────────────────────────
const FAMILY_CONFIG: Record<string, { color: string; bg: string; badge: string }> = {
  "Strings": {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  "Woodwind": {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  "Brass": {
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  "Percussion": {
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
  "World & Folk": {
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
};

// ─── Instrument Card ──────────────────────────────────────────────────────────
interface InstrumentSample {
  id: string;
  name: string;
  family: string;
  description: string;
  audioPath: string;
  source: string;
  tags: string[];
}

function InstrumentCard({
  instrument,
  isSelected,
  onSelect,
}: {
  instrument: InstrumentSample;
  isSelected: boolean;
  onSelect: (instrument: InstrumentSample) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cfg = FAMILY_CONFIG[instrument.family] ?? FAMILY_CONFIG["Strings"];

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    // Stop any other playing audio
    document.querySelectorAll("audio[data-instrument-preview]").forEach((el) => {
      (el as HTMLAudioElement).pause();
    });
    if (!audioRef.current) {
      audioRef.current = new Audio(instrument.audioPath);
      audioRef.current.dataset.instrumentPreview = "true";
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("error", () => {
        setIsPlaying(false);
        toast.error("Preview unavailable");
      });
    }
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
      toast.error("Could not play preview");
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-3.5 transition-all group cursor-pointer ${
        isSelected
          ? "border-pink-500/60 bg-pink-500/10"
          : `${cfg.bg} hover:bg-white/5`
      }`}
      onClick={() => onSelect(instrument)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white leading-snug">{instrument.name}</h4>
            {isSelected && (
              <span className="flex items-center gap-1 text-xs text-pink-400 font-medium">
                <Check className="w-3 h-3" />
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{instrument.description}</p>
        </div>
        <Badge className={`text-[10px] flex-shrink-0 border ${cfg.badge} px-1.5 py-0.5`}>
          {instrument.family}
        </Badge>
      </div>

      {/* Source attribution */}
      <p className="text-[10px] text-gray-600 mb-2.5 truncate">{instrument.source}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handlePreview}
          className={`h-7 w-7 p-0 flex-shrink-0 ${isPlaying ? "text-pink-400" : "text-gray-400 hover:text-white"}`}
          title={isPlaying ? "Pause preview" : "Preview sound"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm"
          onClick={(e) => { e.stopPropagation(); onSelect(instrument); }}
          className={`flex-1 h-7 text-xs font-semibold border-0 transition-all ${
            isSelected
              ? "bg-pink-600 hover:bg-pink-500 text-white"
              : "bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white"
          }`}
        >
          {isSelected ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Selected
            </>
          ) : (
            "Use as Reference"
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
interface InstrumentPaletteDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called when user selects an instrument — passes the audioPath and name */
  onSelectInstrument?: (audioPath: string, name: string) => void;
}

export default function InstrumentPaletteDrawer({
  open,
  onClose,
  onSelectInstrument,
}: InstrumentPaletteDrawerProps) {
  const [activeFamily, setActiveFamily] = useState("Strings");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: catalog, isLoading } = trpc.instrumentPalette.getCatalog.useQuery(undefined, {
    staleTime: Infinity, // catalog never changes at runtime
  });

  const families = catalog?.families ?? ["Strings", "Woodwind", "Brass", "Percussion", "World & Folk"];
  const instruments = catalog?.byFamily[activeFamily] ?? [];

  const handleSelect = (instrument: InstrumentSample) => {
    const newId = selectedId === instrument.id ? null : instrument.id;
    setSelectedId(newId);

    if (newId) {
      if (onSelectInstrument) {
        onSelectInstrument(instrument.audioPath, instrument.name);
        onClose();
      } else {
        // sessionStorage fallback for when used outside Studio context
        sessionStorage.setItem("instrumentReferenceUrl", instrument.audioPath);
        sessionStorage.setItem("instrumentReferenceName", instrument.name);
        onClose();
      }
      toast.success(`"${instrument.name}" set as sonic reference`);
    } else {
      // Deselect
      sessionStorage.removeItem("instrumentReferenceUrl");
      sessionStorage.removeItem("instrumentReferenceName");
    }
  };

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
                  Instrument Palette
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {catalog?.all.length ?? 36} curated sonic references — preview and select
                </p>
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

            {/* How it works note */}
            <div className="flex items-start gap-2.5 px-5 py-3 bg-blue-500/5 border-b border-blue-500/20 flex-shrink-0">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300/80 leading-relaxed">
                <span className="font-semibold text-blue-300">How this works:</span> The selected sample is sent to MiniMax as a sonic reference. The AI absorbs its timbre and character — results vary from subtle influence to clear presence. Best with clean, isolated recordings.
              </p>
            </div>

            {/* Family Tabs */}
            <div className="flex items-center gap-1 px-4 py-3 border-b border-gray-800 overflow-x-auto flex-shrink-0">
              {families.map((family) => {
                const cfg = FAMILY_CONFIG[family] ?? FAMILY_CONFIG["Strings"];
                const count = catalog?.byFamily[family]?.length ?? 0;
                const isActive = activeFamily === family;
                return (
                  <button
                    key={family}
                    onClick={() => setActiveFamily(family)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? `${cfg.bg} ${cfg.color} border`
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Music2 className="w-3 h-3" />
                    {family}
                    <span className={`text-[10px] ${isActive ? "opacity-80" : "opacity-50"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Instrument Cards */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : instruments.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No instruments in this family yet
                </div>
              ) : (
                instruments.map((instrument) => (
                  <InstrumentCard
                    key={instrument.id}
                    instrument={instrument}
                    isSelected={selectedId === instrument.id}
                    onSelect={handleSelect}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 flex-shrink-0">
              <p className="text-[10px] text-gray-600 text-center">
                Philharmonia Orchestra (CC BY-SA 3.0) · Freesound.org (CC0) · Wikimedia Commons (CC0)
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
