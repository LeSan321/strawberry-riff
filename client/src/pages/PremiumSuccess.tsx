import { motion } from "framer-motion";
import { Music, Upload, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";

const NEXT_STEPS = [
  {
    icon: Upload,
    title: "Drop your first riff",
    description: "Upload a track and let the community hear what you've been working on.",
    href: "/upload",
    cta: "Upload Now",
  },
  {
    icon: Users,
    title: "Find your people",
    description: "Follow creators whose sound moves you. Build your inner circle.",
    href: "/friends",
    cta: "Explore Creators",
  },
  {
    icon: Music,
    title: "Build a playlist",
    description: "Curate the tracks that define your vibe and share them with the world.",
    href: "/playlists",
    cta: "Create Playlist",
  },
];

// Floating strawberry particles
function StrawberryBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {["🍓", "🍓", "✨", "🍓", "✨", "🍓"].map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${15 + i * 14}%`,
            top: "30%",
          }}
          initial={{ opacity: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y: [0, -80 - i * 20],
            scale: [0, 1.2, 1, 0.5],
            x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
          }}
          transition={{
            duration: 1.8,
            delay: 0.4 + i * 0.12,
            ease: "easeOut",
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

export default function PremiumSuccess() {
  const utils = trpc.useUtils();
  const { user } = useAuth();

  useEffect(() => {
    // Invalidate so Pricing page + Profile page reflect new premium status
    utils.stripe.status.invalidate();
    utils.auth.me.invalidate();
  }, [utils]);

  const firstName = user?.name?.split(" ")[0] ?? "friend";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative">
      <div className="max-w-2xl w-full">

        {/* Hero confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="text-center mb-12 relative"
        >
          <StrawberryBurst />

          {/* Big strawberry badge */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 18 }}
            className="text-7xl mb-6 block"
          >
            🍓
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              You're in, {firstName}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Welcome to the Premium community. This is where music made by humans,
              for humans, gets the space it deserves. We're genuinely glad you're here.
            </p>
          </motion.div>

          {/* Premium badge pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
          >
            <Sparkles className="w-4 h-4" />
            Premium Member
          </motion.div>
        </motion.div>

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-5">
            Your next moves
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {NEXT_STEPS.map(({ icon: Icon, title, description, href, cta }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 + i * 0.1 }}
              >
                <Link href={href}>
                  <div className="bg-white rounded-2xl p-5 border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all duration-200 cursor-pointer group h-full flex flex-col">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                      style={{ background: "linear-gradient(135deg, #fce7f3, #f3e8ff)" }}>
                      <Icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 flex-1">{description}</p>
                    <span className="text-xs font-semibold text-pink-500 group-hover:text-pink-600 transition-colors">
                      {cta} →
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Soft CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="text-center"
          >
            <Link href="/discover">
              <Button
                variant="outline"
                className="rounded-full px-8 border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Or just browse the community first
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
