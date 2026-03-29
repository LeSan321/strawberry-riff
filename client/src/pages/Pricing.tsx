import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, Zap, Users, ListMusic, User, BarChart2, Download, Star, Heart, Shield,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const FREE_FEATURES = [
  { icon: Music, label: "Uploads", value: "5/month" },
  { icon: Zap, label: "Streaming", value: "High-quality" },
  { icon: Users, label: "Sharing Options", value: "Public & Friends" },
  { icon: ListMusic, label: "Playlists", value: "Yes" },
  { icon: User, label: "Profile Styling", value: "Basic" },
  { icon: BarChart2, label: "Feedback Tools", value: "Basic" },
  { icon: Download, label: "Track Downloads", value: "No" },
  { icon: Star, label: "Early Access", value: "No" },
  { icon: Heart, label: "Tipping Eligibility", value: "No" },
];

const PRO_FEATURES = [
  { icon: Music, label: "Uploads", value: "Unlimited" },
  { icon: Zap, label: "Streaming", value: "High-quality" },
  { icon: Users, label: "Sharing Options", value: "Private, Inner Circle, Public" },
  { icon: ListMusic, label: "Playlists", value: "Yes + Custom Covers" },
  { icon: User, label: "Profile Styling", value: "Custom styling (emoji, colors, tags)" },
  { icon: BarChart2, label: "Feedback Tools", value: "Real-time insights (non-metric based)" },
  { icon: Download, label: "Track Downloads", value: "Download archive enabled" },
  { icon: Star, label: "Early Access", value: "Yes" },
  { icon: Heart, label: "Tipping Eligibility", value: "Yes" },
];

const FAQS = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate any billing differences.",
  },
  {
    q: "Can I try Premium before committing?",
    a: "Absolutely. We offer a 14-day free trial of Premium so you can experience all the features risk-free before deciding.",
  },
  {
    q: "Is my music mine?",
    a: "Always. You retain full ownership of everything you upload. Strawberry Riff is just the stage — the music is yours, forever.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-pink-100 rounded-xl overflow-hidden cursor-pointer bg-white"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-medium text-foreground">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-pink-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground border-t border-pink-50 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen py-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Your Sound, Your Way
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Strawberry Riff is free to try, with premium features when you're ready for more room to grow.
        </p>
        <div className="flex gap-3 justify-center mt-6 flex-wrap">
          {isAuthenticated ? (
            <Link href="/upload">
              <Button
                className="rounded-full px-6 text-white border-0"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                Start Free
              </Button>
            </Link>
          ) : (
            <a href={getLoginUrl()}>
              <Button
                className="rounded-full px-6 text-white border-0"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                Start Free
              </Button>
            </a>
          )}
          <Button
            variant="outline"
            className="rounded-full px-6 border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            Upgrade to Premium
          </Button>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-pink-100 p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-center mb-1">Free Tier</h2>
          <div className="text-center mb-1">
            <span className="text-4xl font-bold" style={{ color: "#ec4899" }}>
              $0
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-5">
            Perfect for getting started
          </p>
          <Button
            variant="outline"
            className="w-full rounded-full border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 mb-6"
            onClick={() => !isAuthenticated && (window.location.href = getLoginUrl())}
          >
            Get Started Free
          </Button>
          <div className="space-y-3">
            {FREE_FEATURES.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="w-4 h-4 text-pink-400" />
                  <span>{label}</span>
                </div>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Premium */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-pink-300 p-6 shadow-md relative"
        >
          <Badge
            className="absolute -top-3 right-6 text-white border-0"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
          >
            Popular
          </Badge>
          <h2 className="text-xl font-bold text-center mb-1">Premium Tier</h2>
          <div className="text-center mb-1">
            <span className="text-4xl font-bold" style={{ color: "#ec4899" }}>
              $5
            </span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-5">
            For creators ready to grow
          </p>
          <button
            className="w-full rounded-full py-2 text-white font-semibold mb-6 text-sm"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
            onClick={() => !isAuthenticated && (window.location.href = getLoginUrl())}
          >
            Upgrade to Premium
          </button>
          <div className="space-y-3">
            {PRO_FEATURES.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm gap-2">
                <div className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
                  <Icon className="w-4 h-4 text-pink-400" />
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="font-medium text-foreground text-right text-xs">{value}</span>
                  <Badge
                    variant="secondary"
                    className="text-xs text-purple-600 bg-purple-50 flex-shrink-0"
                  >
                    Enhanced
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tipping section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mb-10"
      >
        <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center shadow-sm">
          <Heart className="w-10 h-10 text-pink-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Support Creators Directly</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Premium members can receive tips from listeners who love their work. No middleman. No
            algorithms. Just direct appreciation from your tribe.
          </p>
          <Button
            variant="outline"
            className="rounded-full border-pink-300 text-pink-600 hover:bg-pink-50"
          >
            Learn More About Tipping
          </Button>
        </div>
      </motion.div>

      {/* Why We Charge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mb-12"
      >
        <div className="bg-white rounded-2xl border border-pink-100 p-8 text-center shadow-sm">
          <Shield className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Why We Charge</h3>
          <p className="text-muted-foreground text-sm">
            Strawberry Riff runs on support, not surveillance. We don't sell your data or feed you
            ads. We charge a small fee so you can share freely, without judgment or algorithms.
          </p>
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto mb-16"
      >
        <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto rounded-3xl py-16 px-8 text-white text-center"
        style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)" }}
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Join the (not-so) quiet revolution
        </h2>
        <p className="text-white/80 mb-8">
          Your sonic space is waiting. Start sharing your sound today.
        </p>
        {isAuthenticated ? (
          <Link href="/upload">
            <Button
              size="lg"
              className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold"
            >
              Claim Your Sonic Space
            </Button>
          </Link>
        ) : (
          <a href={getLoginUrl()}>
            <Button
              size="lg"
              className="rounded-full px-10 bg-white text-pink-600 hover:bg-white/90 font-semibold"
            >
              Claim Your Sonic Space
            </Button>
          </a>
        )}
      </motion.section>
    </div>
  );
}
