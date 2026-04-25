import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Upload, Users, Music, Zap, BarChart2, ListMusic,
  Sparkles, Play, Heart, Globe, Lock, UserCheck, Quote, Ticket, ChevronLeft, ChevronRight
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import ConcertTicketEasterEgg from "@/components/ConcertTicketEasterEgg";
import { SignInExplainerModal } from "@/components/SignInExplainerModal";

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

function TrackCard({ track, index }: { track: { id: number; title: string; artist?: string | null; fileUrl: string; duration?: number | null }; index: number }) {
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
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Gradient album art */}
      <div className={`h-44 bg-gradient-to-br ${CARD_GRADIENTS[index % CARD_GRADIENTS.length]} relative`}>
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
                className="flex-1 rounded-full bg-pink-200"
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
  { id: -1, title: "Midnight Dreams", artist: "AI Composer", fileUrl: "", duration: 348 },
  { id: -2, title: "Electric Sunset", artist: "Digital Harmony", fileUrl: "", duration: 255 },
  { id: -3, title: "Ocean Waves", artist: "Synthetic Soul", fileUrl: "", duration: 208 },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { isAuthenticated } = useAuth();
  const [easterEggOpen, setEasterEggOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
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

  const { data: publicTracks } = trpc.tracks.publicFeed.useQuery({ limit: 3 });

  const displayTracks = publicTracks && publicTracks.length > 0
    ? publicTracks.slice(0, 3).map(t => ({ id: t.id, title: t.title, artist: t.artist, fileUrl: t.audioUrl, duration: t.duration }))
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
              <p className="text-lg md:text-xl text-white/90 font-medium">Music made by us. Not markets.</p>
              <p className="text-lg md:text-xl text-white/90 font-medium">No judgement. No algorithms.</p>
              <p className="text-lg md:text-xl text-white/90 font-medium">Just heartbeat-driven sound.</p>
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
                    onClick={() => setSignInModalOpen(true)}
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

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to{" "}
              <span style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Share Your Sound
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From the first rough memo to a stadium-ready mix, every tool here serves one purpose: helping you be heard.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Upload className="w-6 h-6" />, gradient: "bg-gradient-to-br from-pink-400 to-rose-500", title: "Upload & Share", desc: "Drop any audio, any time, and watch it echo across kindred ears." },
              { icon: <Users className="w-6 h-6" />, gradient: "bg-gradient-to-br from-violet-400 to-purple-600", title: "Connect with Creators", desc: "Trade inspiration, not follower counts. Collaboration begins with conversation." },
              { icon: <Heart className="w-6 h-6" />, gradient: "bg-gradient-to-br from-pink-400 to-orange-400", title: "Discover New Music", desc: "Let people, not code, guide you to tracks that move your soul." },
              { icon: <Zap className="w-6 h-6" />, gradient: "bg-gradient-to-br from-blue-400 to-cyan-500", title: "High-Quality Streaming", desc: "24-bit fidelity so every nuance arrives untouched." },
              { icon: <BarChart2 className="w-6 h-6" />, gradient: "bg-gradient-to-br from-teal-400 to-emerald-500", title: "Track Analytics", desc: "See how real humans respond, far beyond vanity metrics." },
              { icon: <ListMusic className="w-6 h-6" />, gradient: "bg-gradient-to-br from-amber-400 to-orange-500", title: "Curated Playlists", desc: "Build mood journeys and share them like audio love letters." },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center text-center gap-3"
              >
                <IconBox gradient={f.gradient}>{f.icon}</IconBox>
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who It's For ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Who It's For</h2>
            <p className="text-pink-500 italic font-medium">"From idea-stuck to soul-struck."</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {[
              { icon: <Sparkles className="w-7 h-7 text-white" />, gradient: "bg-gradient-to-br from-pink-400 to-rose-500", title: "First-Timers", desc: "Never shared a beat before? Perfect. Bring a feeling, drop your track, and find listeners who get it—no technical gymnastics required." },
              { icon: <Sparkles className="w-7 h-7 text-white" />, gradient: "bg-gradient-to-br from-violet-400 to-purple-600", title: "AI Explorers", desc: "Push the frontier. Showcase pieces you've crafted with outside AI tools and trade insights with creators who speak the same future-forward language." },
              { icon: <Sparkles className="w-7 h-7 text-white" />, gradient: "bg-gradient-to-br from-teal-400 to-cyan-500", title: "Seasoned Pros", desc: "Stay ahead of the curve. Test-drive new ideas, upload work shaped by emerging tech, and harvest real-time feedback from peers who care about craft, not clout." },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${card.gradient}`}>
                  {card.icon}
                </div>
                <h3 className="font-bold text-lg">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </motion.div>
            ))}
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
                <div className="h-px w-12 bg-pink-200 hidden md:block" />
                <h3 className="font-bold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sonic Soulprints (Testimonials) ───────────────────────────────── */}
      <section className="py-20 px-4 bg-white/50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Sonic Soulprints</h2>
            <p className="text-muted-foreground mb-12">Real voices. Real feels.</p>
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
                className="bg-white rounded-2xl p-6 shadow-sm text-left"
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

      {/* ── Latest Riffs ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Latest Riffs</h2>
            <p className="text-muted-foreground">Fresh drops from the community—updated by humans, not math.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayTracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/discover">
              <Button variant="outline" className="rounded-full px-8 border-pink-300 text-pink-600 hover:bg-pink-50">
                Explore All Riffs
              </Button>
            </Link>
          </div>
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
              onClick={() => setSignInModalOpen(true)}>
              Claim Your Sonic Space
            </Button>
          )}
        </motion.div>
      </section>

      {/* ── Meet the Band ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white/50">
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
            className="hidden md:block mt-8 bg-white rounded-2xl px-8 py-5 shadow-sm max-w-md mx-auto"
          >
            <p className="text-sm text-muted-foreground italic">"{BAND_MEMBERS[activeMember].desc}"</p>
          </motion.div>

          {/* Mobile: carousel */}
          <div className="md:hidden relative">
            <div className="flex items-center justify-center gap-4">
              <button onClick={prevMember} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors">
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
              <button onClick={nextMember} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {BAND_MEMBERS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (autoRef.current) clearInterval(autoRef.current); setActiveMember(i); }}
                  className={`w-2 h-2 rounded-full transition-all ${i === activeMember ? "bg-pink-500 w-4" : "bg-pink-200"}`}
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
                className={`w-2 h-2 rounded-full transition-all ${i === activeMember ? "bg-pink-500 w-4" : "bg-pink-200"}`}
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
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-2 py-1 rounded-lg shadow-sm">
            Psst... something special inside
          </span>
        </motion.button>
      </div>

      {/* ── Easter Egg ────────────────────────────────────────────────────── */}
      <ConcertTicketEasterEgg open={easterEggOpen} onClose={() => setEasterEggOpen(false)} />
      <SignInExplainerModal
        open={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        loginUrl={getLoginUrl()}
        reason="to start creating"
      />
    </div>
  );
}
