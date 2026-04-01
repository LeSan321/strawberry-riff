import { motion } from "framer-motion";
import { CheckCircle2, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function PremiumSuccess() {
  // Invalidate stripe status so the Pricing page reflects the new state
  const utils = trpc.useUtils();
  utils.stripe.status.invalidate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h1 className="text-3xl font-bold mb-3"
            style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Welcome to Premium! 🍓
          </h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Your subscription is active. Unlimited uploads, custom playlists, tipping eligibility,
            and early access to new features are all yours now.
          </p>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 mb-8 border border-pink-100 text-left space-y-3">
            {[
              { icon: Music, text: "Unlimited track uploads" },
              { icon: Sparkles, text: "Custom profile styling" },
              { icon: CheckCircle2, text: "Early access to new features" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-foreground">
                <Icon className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/upload">
              <Button
                className="rounded-full px-8 text-white border-0 w-full sm:w-auto"
                style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
              >
                Upload Your First Riff
              </Button>
            </Link>
            <Link href="/discover">
              <Button
                variant="outline"
                className="rounded-full px-8 border-pink-200 text-pink-600 hover:bg-pink-50 w-full sm:w-auto"
              >
                Explore Discover
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
