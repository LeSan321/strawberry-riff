import { motion } from "framer-motion";
import { Music, Shield, Users, Zap, Heart, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";

const VALUES = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your music, your rules. Three tiers of visibility — private, inner circle, and public — give you precise control over who hears what.",
    gradient: "from-blue-400 to-indigo-500",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Build your inner circle. Share exclusive tracks with your closest fans and friends while keeping the rest private.",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    icon: Zap,
    title: "Instant Sharing",
    description:
      "Upload a track in seconds. No complicated encoding, no waiting — just drag, drop, and share.",
    gradient: "from-yellow-400 to-orange-500",
  },
  {
    icon: Heart,
    title: "Made with Love",
    description:
      "Built by music lovers, for music lovers. Every feature is designed to celebrate the creative process.",
    gradient: "from-purple-400 to-pink-500",
  },
  {
    icon: Globe,
    title: "Discover New Music",
    description:
      "Explore a growing library of independent tracks from creators around the world. Find your next favorite artist.",
    gradient: "from-green-400 to-teal-500",
  },
  {
    icon: Music,
    title: "Any Genre, Any Style",
    description:
      "From lo-fi beats to classical compositions — Strawberry Riff welcomes every genre and every artist.",
    gradient: "from-indigo-400 to-purple-500",
  },
];

export default function About() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white py-20">
        <div className="container text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4">About Strawberry Riff</h1>
            <p className="text-xl text-pink-100 max-w-2xl mx-auto">
              A music sharing platform built around privacy, community, and the joy of sharing your
              sound — on your own terms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Story */}
      <div className="container py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Story</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Strawberry Riff was born from a simple frustration: existing music platforms force you
              to choose between sharing with everyone or sharing with no one. We believed there had
              to be a better way.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We built a platform where creators can share rough drafts with their inner circle,
              release polished tracks to the public, and keep works-in-progress completely private —
              all from one place. Your music, your audience, your control.
            </p>
          </motion.div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {VALUES.map((value, i) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.gradient} flex items-center justify-center mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-12 px-8 rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 border border-purple-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Share Your Riffs?</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join a growing community of independent musicians and music lovers. It's free to get
            started.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {isAuthenticated ? (
              <Link href="/upload">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  Upload Your First Riff
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Join Strawberry Riff
              </Button>
            )}
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
