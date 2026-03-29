import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Upload, Users, Music, Zap, BarChart2, ListMusic,
  Sparkles, Play, Heart, Globe, Lock, UserCheck, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import ConcertTicketEasterEgg from "@/components/ConcertTicketEasterEgg";

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

  const { data: publicTracks } = trpc.tracks.publicFeed.useQuery({ limit: 3 });

  const displayTracks = publicTracks && publicTracks.length > 0
    ? publicTracks.slice(0, 3).map(t => ({ id: t.id, title: t.title, artist: t.artist, fileUrl: t.audioUrl, duration: t.duration }))
    : PLACEHOLDER_TRACKS;

  return (
    <div className="min-h-screen">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Strawberry Riff
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium mb-2">Music made by us. Not markets</p>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium mb-2">No judgement. No algorithms.</p>
          <p className="text-xl md:text-2xl text-foreground/80 font-medium mb-6">Just heartbeat-driven sound.</p>
          <p className="text-base text-muted-foreground mb-8">Share Your Vibe. Build Your Tribe.</p>
          <p className="text-sm italic text-muted-foreground mb-10">
            "Some revolutions hum. Others drop bass."
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/upload">
                <Button size="lg" className="rounded-full px-8 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                  Start Creating
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" className="rounded-full px-8 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}>
                  Start Creating
                </Button>
              </a>
            )}
            <Link href="/discover">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-semibold border-pink-400 text-pink-600 hover:bg-pink-50">
                Join the Tribe
              </Button>
            </Link>
          </div>
        </motion.div>
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
            <a href={getLoginUrl()}>
              <Button size="lg" className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold">
                Claim Your Sonic Space
              </Button>
            </a>
          )}
        </motion.div>
      </section>

      {/* ── Easter Egg ────────────────────────────────────────────────────── */}
      <ConcertTicketEasterEgg open={easterEggOpen} onClose={() => setEasterEggOpen(false)} />
    </div>
  );
}
