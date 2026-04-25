import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Music, Zap, Users, ListMusic, User, BarChart2, Download, Star, Heart, Shield,
  ChevronDown, ChevronUp, CheckCircle2, Loader2, Lock,
} from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const FREE_FEATURES = [
  { icon: Music, label: "AI Generations", value: "5 per month" },
  { icon: Zap, label: "Music Generation", value: "Full access" },
  { icon: Users, label: "Visibility", value: "Public, Inner Circle & Private" },
  { icon: ListMusic, label: "Playlists", value: "Yes" },
  { icon: User, label: "Creator Profile", value: "Yes" },
  { icon: Heart, label: "Discover & Follow", value: "Yes" },
  { icon: Shield, label: "Preview Share Links", value: "Yes (3-play limit)" },
  { icon: Star, label: "Studio Mode", value: "Generate + Lyrics" },
  { icon: Download, label: "Riff Mode", value: "No" },
  { icon: BarChart2, label: "Style Library", value: "No" },
  { icon: Star, label: "Visual Brief", value: "No" },
  { icon: Heart, label: "Style Reference Audio", value: "No" },
  { icon: Users, label: "Voice Reference", value: "No" },
];

const PRO_FEATURES = [
  { icon: Music, label: "AI Generations", value: "Unlimited" },
  { icon: Zap, label: "Music Generation", value: "Full access" },
  { icon: Users, label: "Visibility", value: "Public, Inner Circle & Private" },
  { icon: ListMusic, label: "Playlists", value: "Yes" },
  { icon: User, label: "Creator Profile", value: "Yes" },
  { icon: Heart, label: "Discover & Follow", value: "Yes" },
  { icon: Shield, label: "Preview Share Links", value: "Yes (3-play limit)" },
  { icon: Star, label: "Studio Mode", value: "Generate + Lyrics + My Styles" },
  { icon: Download, label: "Riff Mode", value: "Yes — one-click variations" },
  { icon: BarChart2, label: "Style Library", value: "Yes — save & reuse styles" },
  { icon: Star, label: "Visual Brief", value: "Yes — AI visual direction" },
  { icon: Heart, label: "Style Reference Audio", value: "Yes — match any song's vibe" },
  { icon: Users, label: "Voice Reference", value: "Yes — clone any vocal style" },
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
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as Apple Pay and Google Pay via Stripe's secure checkout.",
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
  const [, navigate] = useLocation();

  // Fetch premium status for logged-in users
  const { data: stripeStatus } = trpc.stripe.status.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const isPremium = stripeStatus?.isPremium ?? false;

  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) {
        toast.info("Redirecting to secure checkout…");
        window.location.href = url;
      }
    },
    onError: (err) => {
      toast.error(err.message ?? "Could not start checkout. Please try again.");
    },
  });

  const handleUpgrade = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (isPremium) {
      toast.info("You're already a Premium member! 🍓");
      return;
    }
    checkoutMutation.mutate();
  };

  const isLoading = checkoutMutation.isPending;

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

        {isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-full px-5 py-2.5 text-sm font-medium text-pink-700"
          >
            <CheckCircle2 className="w-4 h-4 text-pink-500" />
            You're a Premium member — thank you for supporting Strawberry Riff! 🍓
          </motion.div>
        )}

        {!isPremium && (
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
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening Checkout…</>
              ) : (
                "Upgrade to Premium"
              )}
            </Button>
          </div>
        )}
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
            <span className="text-4xl font-bold" style={{ color: "#ec4899" }}>$0</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-5">
            Perfect for getting started
          </p>
          <Button
            variant="outline"
            className="w-full rounded-full border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 mb-6"
            onClick={() => !isAuthenticated && (window.location.href = getLoginUrl())}
          >
            {isAuthenticated ? "Your Current Plan" : "Get Started Free"}
          </Button>
          <div className="space-y-3">
            {FREE_FEATURES.map(({ icon: Icon, label, value }) => {
              const isLocked = value === "No";
              return (
                <div key={label} className={`flex items-center justify-between text-sm ${isLocked ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-4 h-4 text-pink-400" />
                    <span>{label}</span>
                  </div>
                  {isLocked ? (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Premium
                    </span>
                  ) : (
                    <span className="font-medium text-foreground text-right text-xs">{value}</span>
                  )}
                </div>
              );
            })}
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
            {isPremium ? "Your Plan ✓" : "Popular"}
          </Badge>
          <h2 className="text-xl font-bold text-center mb-1">Premium Tier</h2>
          <div className="text-center mb-1">
            <span className="text-4xl font-bold" style={{ color: "#ec4899" }}>$5.00</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
          <p className="text-center text-sm text-muted-foreground mb-5">
            For creators ready to grow
          </p>
          <button
            className="w-full rounded-full py-2 text-white font-semibold mb-6 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
            onClick={handleUpgrade}
            disabled={isLoading || isPremium}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Opening Checkout…</>
            ) : isPremium ? (
              <><CheckCircle2 className="w-4 h-4" /> Active — Thank You!</>
            ) : (
              "Upgrade to Premium"
            )}
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
            onClick={() => toast.info("Tipping feature coming soon!")}
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
