import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Upload, Users, Music, Zap, BarChart2, ListMusic,
  Sparkles, Play, Heart, Globe, Lock, UserCheck, Quote, Ticket, ChevronLeft, ChevronRight, Share2, Check
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import ConcertTicketEasterEgg from "@/components/ConcertTicketEasterEgg";
import { useClerk } from "@clerk/clerk-react";

// ─── Strawberry Band Members ─────────────────────────────────────────────────
const BAND_MEMBERS = [
  {
    name: "Jam",
    role: "The Drummer",
    desc: "Keeping the rhythm alive and kicking since the first berry dropped.",
    gradient: "from-violet-400 to-purple-600",
    emoji: "🥁",
    color: "#a855f7",
  },
  {
    name: "Melody",
    role: "The Composer",
    desc: "Crafting beautiful harmonies that make your heart ache in the best way.",
    gradient: "from-blue-400 to-cyan-500",
    emoji: "🎵",
    color: "#06b6d4",
  },
  {
    name: "Bass",
    role: "The Foundation",
    desc: "Laying down the groove so deep you feel it in your roots.",
    gradient: "from-teal-400 to-emerald-500",
    emoji: "🎸",
    color: "#10b981",
  },
  {
    name: "Riff",
    role: "The Lead",
    desc: "The one who steps into the spotlight and makes the crowd lose their minds.",
    gradient: "from-pink-400 to-rose-500",
    emoji: "🎤",
    color: "#ec4899",
  },
  {
    name: "Chord",
    role: "The Keyboardist",
    desc: "Weaving textures and color into every track like a sonic painter.",
    gradient: "from-amber-400 to-orange-500",
    emoji: "🎹",
    color: "#f97316",
  },
];

// Strawberry SVG character
function StrawberryAvatar({ gradient, emoji, size = 80 }: { gradient: string; emoji: string; size?: number }) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      <svg viewBox="0 0 60 80" width={size * 0.7} height={size * 0.7} xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="50" rx="20" ry="22" fill="#e8324a" />
        {[[22,44],[30,40],[38,44],[20,54],[30,58],[40,54],[25,49],[35,49]].map(([cx,cy],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="1.5" ry="2" fill="#c0182e" />
        ))}
        <ellipse cx="22" cy="44" rx="5" ry="7" fill="#ff6b7a" opacity="0.4" />
        <path d="M20 30 Q15 20 25 22 Q22 28 30 28" fill="#2d8a4e" />
        <path d="M40 30 Q45 20 35 22 Q38 28 30 28" fill="#2d8a4e" />
        <path d="M30 28 Q28 18 30 14 Q32 18 30 28" fill="#3aab60" />
        <circle cx="25" cy="48" r="3" fill="white" />
        <circle cx="35" cy="48" r="3" fill="white" />
        <circle cx="26" cy="48.5" r="1.8" fill="#1a1a2e" />
        <circle cx="36" cy="48.5" r="1.8" fill="#1a1a2e" />
        <circle cx="26.8" cy="47.8" r="0.6" fill="white" />
        <circle cx="36.8" cy="47.8" r="0.6" fill="white" />
        <path d="M24 54 Q30 59 36 54" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="21" cy="52" r="3" fill="#ff9eb5" opacity="0.5" />
        <circle cx="39" cy="52" r="3" fill="#ff9eb5" opacity="0.5" />
      </svg>
    </div>
  );
}

// ─── Gradient icon square ─────────────────────────────────────────────────────
function IconBox({ gradient, children }: { gradient: string; children: React.ReactNode }) {
  return (
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${gradient} shadow-md`}>
      {children}
    </div>
  );
}

// ─── Track card for Latest Riffs ──────────────────────────────────────────────
const CARD_GRADIENTS = [
  "from-purple-400 via-pink-400 to-pink-500",
  "from-blue-400 via-purple-400 to-purple-500",
  "from-teal-400 via-cyan-400 to-green-400",
];

function TrackCard({ track, index }: { track: { id: number; title: string; artist?: string | null; fileUrl: string; duration?: number | null; coverArtUrl?: string | null }; index: number }) {
  const { play, currentTrack, isPlaying, pause } = useAudioPlayer();
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 200) + 50);

  const fmt = (s?: number | null) => {
    if (!s) return "0:00";
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="bg-card rounded-2xl overflow-hidden border border-border hover:border-border/80 hover:shadow-lg hover:shadow-black/30 transition-all"
    >
      {/* Album art — real image if available, gradient fallback otherwise */}
      <div className={`h-44 bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} relative overflow-hidden`}>
        {track.coverArtUrl && (
          <img
            src={track.coverArtUrl}
            alt={track.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <button
          onClick={() => isCurrentlyPlaying ? pause() : play({ id: track.id, title: track.title, artist: track.artist ?? "Unknown", audioUrl: track.fileUrl })}
            className="absolute top-3 right-3 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-white" : ""}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="font-semibold text-foreground truncate">{track.title}</p>
        <p className="text-sm text-muted-foreground truncate">{track.artist ?? "Unknown Artist"}</p>

        {/* Mini player */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => isCurrentlyPlaying ? pause() : play({ id: track.id, title: track.title, artist: track.artist ?? "Unknown", audioUrl: track.fileUrl })}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0"
          >
            {isCurrentlyPlaying ? (
              <span className="w-3 h-3 flex gap-0.5 items-center">
                <span className="w-0.5 h-3 bg-white rounded-full" />
                <span className="w-0.5 h-3 bg-white rounded-full" />
              </span>
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>
          {/* Waveform bars */}
          <div className="flex-1 flex items-center gap-0.5 h-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-full bg-primary/30"
                style={{ height: `${20 + Math.sin(i * 0.8) * 14}%` }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">0:00</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(track.duration)}</span>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <button
            onClick={() => { setLiked(l => !l); setLikeCount(c => liked ? c - 1 : c + 1); }}
            className="flex items-center gap-1 hover:text-pink-500 transition-colors"
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
            <span>{likeCount}</span>
          </button>
          <span>{fmt(track.duration)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Static placeholder track cards for unauthenticated view ─────────────────
const PLACEHOLDER_TRACKS = [
  { id: -1, title: "Midnight Dreams", artist: "AI Composer", fileUrl: "", duration: 348, coverArtUrl: null },
  { id: -2, title: "Electric Sunset", artist: "Digital Harmony", fileUrl: "", duration: 255, coverArtUrl: null },
  { id: -3, title: "Ocean Waves", artist: "Synthetic Soul", fileUrl: "", duration: 208, coverArtUrl: null },
  { id: -4, title: "Neon Frequencies", artist: "Pulse Engine", fileUrl: "", duration: 192, coverArtUrl: null },
  { id: -5, title: "Velvet Static", artist: "Waveform Ghost", fileUrl: "", duration: 274, coverArtUrl: null },
  { id: -6, title: "Deep Signal", artist: "Resonance Field", fileUrl: "", duration: 310, coverArtUrl: null },
];

// ─── Philosophy Share Button ───────────────────────────────────────────────────
function generatePhilosophyCard(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const W = 1200, H = 630;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) { reject(new Error("No canvas context")); return; }

    // Background — deep plum
    ctx.fillStyle = "#0f0614";
    ctx.fillRect(0, 0, W, H);

    // Radial glow — left-centre
    const glow = ctx.createRadialGradient(W * 0.15, H * 0.45, 0, W * 0.15, H * 0.45, W * 0.6);
    glow.addColorStop(0, "rgba(74, 20, 104, 0.75)");
    glow.addColorStop(0.5, "rgba(42, 10, 58, 0.4)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Bottom-right whisper
    const whisper = ctx.createRadialGradient(W * 0.92, H * 0.92, 0, W * 0.92, H * 0.92, W * 0.35);
    whisper.addColorStop(0, "rgba(42, 8, 56, 0.5)");
    whisper.addColorStop(1, "transparent");
    ctx.fillStyle = whisper;
    ctx.fillRect(0, 0, W, H);

    // Accent bar — bottom gradient
    const bar = ctx.createLinearGradient(0, 0, W, 0);
    bar.addColorStop(0, "#7c3aed");
    bar.addColorStop(0.5, "#ec4899");
    bar.addColorStop(1, "#f43f5e");
    ctx.fillStyle = bar;
    ctx.fillRect(0, H - 6, W, 6);

    // Wordmark — top-left
    ctx.font = "bold 28px 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";
    const wm = ctx.createLinearGradient(60, 0, 340, 0);
    wm.addColorStop(0, "#c084fc");
    wm.addColorStop(1, "#f472b6");
    ctx.fillStyle = wm;
    ctx.fillText("\uD83C\uDF53 Strawberry Riff", 60, 72);

    // Quote lines with gradient colour
    const lines = [
      "\u201cMusic is not a product.",
      "It is a conversation",
      "between a human heart",
      "and the world that needs it.\u201d",
    ];
    const lineH = 82;
    const startY = 185;
    lines.forEach((line, i) => {
      const t = i / (lines.length - 1);
      const r = Math.round(192 + t * (244 - 192));
      const g = Math.round(132 + t * (63 - 132));
      const b = Math.round(252 + t * (158 - 252));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.font = `${i === 0 || i === lines.length - 1 ? "bold" : "normal"} 52px 'Space Grotesk', 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillText(line, 60, startY + i * lineH);
    });

    // Attribution line
    ctx.font = "italic 26px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "rgba(240, 232, 245, 0.5)";
    ctx.fillText("\u2014 The Riff Philosophy  \u00B7  strawberryriff.com", 60, startY + lines.length * lineH + 38);

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

function PhilosophyShareButton() {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const PHILOSOPHY_TEXT = "\u201cMusic is not a product. It is a conversation between a human heart and the world that needs it.\u201d \u2014 The Riff Philosophy";
  const SHARE_URL = "https://strawberryriff.com";
  const TWEET_TEXT = encodeURIComponent(PHILOSOPHY_TEXT + "\n\n" + SHARE_URL);
  const WHATSAPP_TEXT = encodeURIComponent(PHILOSOPHY_TEXT + "\n\n" + SHARE_URL);

  const handleOpen = useCallback(async () => {
    setOpen(true);
    if (imageUrl) return;
    setGenerating(true);
    try {
      const blob = await generatePhilosophyCard();
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch {
      // silently fail — modal still shows share options
    } finally {
      setGenerating(false);
    }
  }, [imageUrl]);

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = "riff-philosophy.png";
    a.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PHILOSOPHY_TEXT + "\n\n" + SHARE_URL);
      setCopied(true);
      toast.success("Copied to clipboard \u2014 drop it somewhere good \uD83C\uDF53");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Clipboard copy failed \u2014 try selecting the text manually");
    }
  };

  return (
    <>
      <div className="mt-8 flex flex-col items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="gap-2 border-pink-400/40 text-pink-300 hover:bg-pink-500/10 hover:text-pink-200 hover:border-pink-400/60 transition-all"
        >
          <Share2 className="h-3.5 w-3.5" />Share this philosophy
        </Button>
        <p className="text-xs text-muted-foreground/60">Generates a designed image card for social media</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-[#0f0614] border-[#2e1a4a] text-white">
          <DialogHeader>
            <DialogTitle className="text-pink-300 font-semibold">Share the Riff Philosophy</DialogTitle>
          </DialogHeader>

          {/* Image preview */}
          <div className="rounded-lg overflow-hidden border border-[#2e1a4a] bg-[#1a0a2e] min-h-[180px] flex items-center justify-center">
            {generating ? (
              <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
                <span className="text-sm">Building card&hellip;</span>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Riff Philosophy share card" className="w-full rounded-lg" />
            ) : (
              <p className="text-sm text-muted-foreground py-8 px-4 text-center">Card preview unavailable \u2014 you can still share the text below.</p>
            )}
          </div>

          {/* Share actions */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${TWEET_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-[#2e1a4a] bg-[#1a0a2e] hover:bg-[#2a0838] text-white text-sm font-medium py-2.5 px-4 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current flex-shrink-0" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              Post on X
            </a>

            {/* WhatsApp */}
            <a
              href={`https://wa.me/?text=${WHATSAPP_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-md border border-[#2e1a4a] bg-[#1a0a2e] hover:bg-[#2a0838] text-white text-sm font-medium py-2.5 px-4 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-green-400 flex-shrink-0" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>

            {/* Copy text */}
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 rounded-md border border-[#2e1a4a] bg-[#1a0a2e] hover:bg-[#2a0838] text-white text-sm font-medium py-2.5 px-4 transition-colors"
            >
              {copied
                ? <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                : <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              }
              {copied ? "Copied!" : "Copy text"}
            </button>

            {/* Download image */}
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              className="flex items-center justify-center gap-2 rounded-md border border-[#2e1a4a] bg-[#1a0a2e] hover:bg-[#2a0838] text-white text-sm font-medium py-2.5 px-4 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Save image
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const { openSignIn } = useClerk();
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const [activeMember, setActiveMember] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setActiveMember(m => (m + 1) % BAND_MEMBERS.length);
    }, 3200);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  const prevMember = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveMember(m => (m - 1 + BAND_MEMBERS.length) % BAND_MEMBERS.length);
  };
  const nextMember = () => {
    if (autoRef.current) clearInterval(autoRef.current);
    setActiveMember(m => (m + 1) % BAND_MEMBERS.length);
  };

  const { data: publicTracks } = trpc.tracks.publicFeed.useQuery({ limit: 6 });

  const displayTracks = publicTracks && publicTracks.length > 0
    ? publicTracks.slice(0, 6).map(t => ({ id: t.id, title: t.title, artist: t.artist, fileUrl: t.audioUrl, duration: t.duration, coverArtUrl: t.coverArtUrl }))
    : PLACEHOLDER_TRACKS;

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{
          backgroundImage: `url(https://d2xsxph8kpxj0f.cloudfront.net/310519663331665311/frNnwU2pwLKJifDR8KqR7c/hero-bg-clean_7cf36a42.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        {/* Subtle overlay — keeps text readable without killing the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/5" />
        {/* Bottom fade into page */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-24 pb-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            {/* Eyebrow */}
            <p className="text-pink-300 text-sm font-semibold tracking-widest uppercase mb-4">
              Share Your Vibe. Build Your Tribe.
            </p>

            {/* Main headline */}
            <h1
              className="text-5xl md:text-7xl font-bold leading-tight mb-6"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
                background: "linear-gradient(120deg, #ff4d4d 0%, #ff6b35 20%, #e8175d 45%, #ff9a3c 65%, #e8175d 80%, #c0392b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 2px 12px rgba(232,23,93,0.35))",
              }}
            >
              Strawberry Riff
            </h1>

            {/* Taglines */}
            <div className="space-y-1 mb-6">
              <p className="text-lg md:text-xl text-white/90 font-medium">Human soul. AI craft.</p>
              <p className="text-lg md:text-xl text-white/90 font-medium">Music that sounds like you —</p>
              <p className="text-lg md:text-xl text-white/90 font-medium">because it is.</p>
            </div>

            <p className="text-sm italic text-white/60 mb-10">
              "Some revolutions hum. Others drop bass."
            </p>

            {/* CTAs — two rows for natural diagonal balance */}
            <div className="flex flex-col gap-3">
              {/* Row 1: primary actions */}
              <div className="flex flex-wrap gap-3">
                {isAuthenticated ? (
                  <Link href="/upload">
                    <Button
                      size="lg"
                      className="rounded-full px-8 text-base font-semibold shadow-lg shadow-pink-500/30 border-0 text-white"
                      style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                    >
                      Start Creating
                    </Button>
                  </Link>
                ) : (
                  <Button
                    size="lg"
                    className="rounded-full px-8 text-base font-semibold shadow-lg shadow-pink-500/30 border-0 text-white"
                    style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
                    onClick={() => openSignIn()}
                  >
                    Start Creating
                  </Button>
                )}
                <Link href="/pricing">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 text-base font-semibold border-white/40 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm"
                  >
                    Join the Tribe
                  </Button>
                </Link>
                <Link href="/discover">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 text-base font-semibold border-white/40 text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm"
                  >
                    Discover
                  </Button>
                </Link>
              </div>
              {/* Row 2: Studio CTA — sits diagonally below, offset right */}
              <div className="flex">
                <Link href="/studio">
                  <Button
                    size="lg"
                    className="rounded-full px-8 text-base font-semibold shadow-lg shadow-purple-500/30 border-0 text-white flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Enter Studio
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Latest Riffs ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-3">Fresh from the Community</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Latest Riffs</h2>
            <p className="text-muted-foreground">Real tracks from real people — made with the tools, not despite them.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/discover">
              <Button variant="outline" className="rounded-full px-8 border-primary/40 text-primary hover:bg-primary/10">
                Explore All Riffs
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── The Collaboration ─────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-4">The Collaboration</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                We moved on from{" "}
                <span style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  the debate.
                </span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The argument over human vs. AI music asks where the value comes from instead of asking what the music actually carries. That's the wrong question. We moved on.
                </p>
                <p>
                  Strawberry Riff is built on the belief that the best music of this era comes from collaboration — human soul, AI craft, no apology.
                </p>
                <p>
                  But a collaborator is only as good as what it knows. So we built ours a library few platforms have bothered with: deep, craft-level frameworks on cinematic composition, vocal nuance, emotional texture, sonic identity — physics and neuroscience included, because that's what understanding sound actually takes.
                </p>
                <p className="text-foreground font-medium italic">
                  You bring the feeling. It already knows what to do with it.
                </p>
              </div>
            </motion.div>
            {/* The Collaboration image — The Handoff */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] border border-border/20 shadow-2xl">
                <img
                  src="/manus-storage/collab_B_The_Handoff_adf9ea5c.jpg"
                  alt="Human hand and AI hand meeting over piano keys — the collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Your Own Sound, Without the Fight ────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Your Own Sound image — Signal and Response */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] border border-border/20 shadow-2xl">
                <img
                  src="/manus-storage/collab_D_Signal_and_Response_cff79182.jpg"
                  alt="Creator in studio commanding AI neural network — your sound, your rules"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="order-1 lg:order-2"
            >
              <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-4">Your Sound</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
                Your own sound,{" "}
                <span style={{ background: "linear-gradient(135deg, #f43f8a, #c026d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  without the fight.
                </span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  If you've already built something — a voice, a brand, a body of work, even one you're just starting to find — you shouldn't have to fight a platform to keep building it.
                </p>
                <p>
                  Some AI tools see your own established work as a liability. The bigger and more visible you are, the more they flag you, block you, treat your own catalog like a threat instead of an asset.
                </p>
                <p>
                  We built Strawberry Riff the other way. Your creative identity — whatever stage it's at — is something we build with, not something we guard against.
                </p>
                <p className="text-foreground font-medium italic">
                  Describe your sound. Develop it. Return to it. Make it more yours every time, not less.
                </p>
              </div>
              <div className="mt-8">
                <Link href="/studio">
                  <Button
                    className="rounded-full px-8 text-base font-semibold shadow-lg border-0 text-white"
                    style={{ background: "linear-gradient(135deg, #f43f8a, #c026d3)" }}
                  >
                    Start Building Your Sound
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text + icons side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="order-1"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tools That Serve{" "}
                <span style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  the Creator
                </span>
              </h2>
              <p className="text-muted-foreground mb-10">
                From the first rough memo to a fully split mix, every tool here exists for one reason: to help you hear what you already know is in there.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: <Upload className="w-5 h-5" />, gradient: "bg-gradient-to-br from-pink-400 to-rose-500", title: "Upload & Share", desc: "Drop any audio, any time, and watch it echo across kindred ears." },
                  { icon: <Users className="w-5 h-5" />, gradient: "bg-gradient-to-br from-violet-400 to-purple-600", title: "Connect with Creators", desc: "Trade inspiration, not follower counts." },
                  { icon: <Zap className="w-5 h-5" />, gradient: "bg-gradient-to-br from-blue-400 to-cyan-500", title: "Generate Music", desc: "Human soul, AI craft — describe it and hear it come alive." },
                  { icon: <ListMusic className="w-5 h-5" />, gradient: "bg-gradient-to-br from-amber-400 to-orange-500", title: "Curated Playlists", desc: "Build mood journeys and share them like audio love letters." },
                ].map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${f.gradient}`}>
                      {f.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Tools That Serve image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative order-2"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] border border-border/20 shadow-2xl">
                <img
                  src="/manus-storage/collab_E_Tools_That_Serve_d3b5a07f.jpg"
                  alt="Producer at mixing console in warm amber studio light"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Who It's For ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Who It's For image — left side */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative order-2 lg:order-1"
            >
              <div className="rounded-3xl overflow-hidden aspect-[4/3] border border-border/20 shadow-2xl">
                <img
                  src="/manus-storage/collab_F_Who_Its_For_b95cd661.jpg"
                  alt="Young guitarist playing with eyes closed in warm fairy-lit room"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            {/* Text + cards side */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Who It's For</h2>
              <p className="text-pink-500 italic font-medium mb-8">"From idea-stuck to soul-struck."</p>
              <div className="flex flex-col gap-5">
                {[
                  { gradient: "bg-gradient-to-br from-pink-400 to-rose-500", title: "First-Timers", desc: "Never shared a beat before? Perfect. Bring a feeling, drop your track, and find listeners who get it—no technical gymnastics required." },
                  { gradient: "bg-gradient-to-br from-violet-400 to-purple-600", title: "AI Explorers", desc: "Push the frontier. Showcase pieces you've crafted with AI tools and trade insights with creators who speak the same future-forward language." },
                  { gradient: "bg-gradient-to-br from-teal-400 to-cyan-500", title: "Seasoned Pros", desc: "Stay ahead of the curve. Test-drive new ideas and harvest real-time feedback from peers who care about craft, not clout." },
                ].map((card, i) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${card.gradient}`} />
                    <div>
                      <h3 className="font-bold text-base mb-1">{card.title}</h3>
                      <p className="text-sm text-muted-foreground">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground mb-14">Three simple steps to share your sonic soul</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { num: "01", icon: <Upload className="w-6 h-6" />, gradient: "from-pink-400 to-rose-500", title: "Upload any type of track", desc: "Demos, half-sung hooks, voice memos, or AI experiments—if it makes a wave-form, it belongs here." },
              { num: "02", icon: <Music className="w-6 h-6" />, gradient: "from-violet-400 to-purple-600", title: "Tag the mood", desc: "Melancholy? Euphoric? Defiant? Paint your emotional palette so the tribe can find you." },
              { num: "03", icon: <Globe className="w-6 h-6" />, gradient: "from-teal-400 to-cyan-500", title: "Choose visibility", desc: "Keep it private, circle it with friends, or let the whole world feel your frequency." },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white font-bold text-lg`}>
                  {step.num}
                </div>
                <div className="h-px w-12 bg-primary/30 hidden md:block" />
                <h3 className="font-bold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sonic Soulprints (moved near hero per Platform Experience Bible) ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-3">Sonic Soulprints</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Real voices. Real feels.</h2>
            <p className="text-muted-foreground mb-12">The music made here carries something. These are the people who felt it.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "This beat found me at 3 a.m. when sleep wouldn't. Turns out strangers on the internet know my heart better than any algorithm.", handle: "@midnight_melody_introspective", mood: "introspective" },
              { quote: "Sunrise-scored. AI caught the light my words missed.", handle: "@dawn_dreamer", mood: "hopeful" },
              { quote: "For everyone who feels like they don't fit the mold. This riff is for the beautiful misfits.", handle: "@rebel_frequencies", mood: "defiant" },
            ].map((t, i) => (
              <motion.div
                key={t.handle}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border text-left"
              >
                <Quote className="w-7 h-7 text-pink-400 mb-4" />
                <p className="text-sm text-foreground/80 mb-4 italic">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-pink-500">{t.handle}</span>
                  <Badge variant="secondary" className="text-xs">{t.mood}</Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Riff Philosophy ────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-pink-400 text-sm font-semibold tracking-widest uppercase mb-6">The Riff Philosophy</p>
            <blockquote className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-8"
              style={{ background: "linear-gradient(135deg, #f9a8d4, #c084fc, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Music is not a product.<br />
              It is a conversation<br />
              between a human heart<br />
              and the world that needs it.
            </blockquote>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              We don't measure success in streams or followers. We measure it in the moment a stranger
              hears your track and feels less alone. Every tool on this platform exists to serve that moment —
              nothing more, nothing less.
            </p>
            <div className="mt-10 h-px max-w-xs mx-auto bg-gradient-to-r from-transparent via-pink-500/40 to-transparent" />
            <PhilosophyShareButton />
          </motion.div>
        </div>
      </section>



      {/* ── Join the Revolution (CTA) ─────────────────────────────────────── */}
      <section className="py-24 px-4 mx-4 mb-8 rounded-3xl text-white text-center"
        style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Revolution</h2>
          <p className="text-white/90 mb-2">Join the (not-so) quiet revolution.</p>
          <p className="text-white/80 mb-10">Where authentic voices find their audience, and music finds its meaning.</p>
          {isAuthenticated ? (
            <Link href="/upload">
              <Button size="lg" className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold">
                Claim Your Sonic Space
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold"
              onClick={() => openSignIn()}>
              Claim Your Sonic Space
            </Button>
          )}
        </motion.div>
      </section>

      {/* ── Meet the Band ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Meet the Band</h2>
            <p className="text-muted-foreground">The Strawberry Jam Session crew — the heart behind the riff</p>
          </motion.div>

          {/* Desktop: all members side by side */}
          <div className="hidden md:flex items-end justify-center gap-8">
            {BAND_MEMBERS.map((m, i) => (
              <motion.div
                key={m.name}
                className="flex flex-col items-center gap-3 cursor-pointer"
                animate={{
                  scale: i === activeMember ? 1.15 : 0.9,
                  opacity: i === activeMember ? 1 : 0.55,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={() => { if (autoRef.current) clearInterval(autoRef.current); setActiveMember(i); }}
              >
                <motion.div
                  animate={i === activeMember ? { y: [0, -10, 0] } : { y: 0 }}
                  transition={i === activeMember ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } : {}}
                >
                  <StrawberryAvatar gradient={m.gradient} emoji={m.emoji} size={i === activeMember ? 96 : 72} />
                </motion.div>
                <div className="text-center">
                  <p className="font-bold text-sm" style={{ color: m.color }}>{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Active member description */}
          <motion.div
            key={activeMember}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:block mt-8 bg-card rounded-2xl px-8 py-5 border border-border max-w-md mx-auto"
          >
            <p className="text-sm text-muted-foreground italic">"{BAND_MEMBERS[activeMember].desc}"</p>
          </motion.div>

          {/* Mobile: carousel */}
          <div className="md:hidden relative">
            <div className="flex items-center justify-center gap-4">
              <button onClick={prevMember} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <motion.div
                key={activeMember}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <StrawberryAvatar gradient={BAND_MEMBERS[activeMember].gradient} emoji={BAND_MEMBERS[activeMember].emoji} size={96} />
                </motion.div>
                <p className="font-bold" style={{ color: BAND_MEMBERS[activeMember].color }}>{BAND_MEMBERS[activeMember].name}</p>
                <p className="text-sm text-muted-foreground">{BAND_MEMBERS[activeMember].role}</p>
                <p className="text-sm text-muted-foreground italic max-w-xs">"{BAND_MEMBERS[activeMember].desc}"</p>
              </motion.div>
              <button onClick={nextMember} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {BAND_MEMBERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (autoRef.current) clearInterval(autoRef.current); setActiveMember(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeMember ? "bg-primary w-4" : "bg-primary/25"}`}
                />
              ))}
            </div>
          </div>

          {/* Dot indicators (desktop) */}
          <div className="hidden md:flex justify-center gap-2 mt-6">
            {BAND_MEMBERS.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (autoRef.current) clearInterval(autoRef.current); setActiveMember(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === activeMember ? "bg-primary w-4" : "bg-primary/25"}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Concert Ticket Easter Egg trigger ─────────────────────────────── */}
      <div className="flex justify-center py-8">
        <motion.button
          whileHover={{ scale: 1.05, rotate: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setEasterEggOpen(true)}
          className="group relative flex items-center gap-3 px-6 py-3 rounded-2xl shadow-md cursor-pointer select-none"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" }}
          title="Psst... click me 🍓"
        >
          <Ticket className="w-5 h-5 text-yellow-300" />
          <span className="text-white font-semibold text-sm">Special Event</span>
          <motion.span
            className="text-yellow-300 text-lg"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            🍓
          </motion.span>
          {/* Subtle hint tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-card border border-border px-2 py-1 rounded-lg shadow-sm">
            Psst... something special inside
          </span>
        </motion.button>
      </div>

      {/* ── Easter Egg ────────────────────────────────────────────────────── */}
      <ConcertTicketEasterEgg open={easterEggOpen} onClose={() => setEasterEggOpen(false)} />

    </div>
  );
}
