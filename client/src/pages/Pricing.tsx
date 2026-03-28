import { motion } from "framer-motion";
import { Check, Zap, Music, Users, Globe, Lock, ListMusic, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const FREE_FEATURES = [
  { icon: Music, text: "Upload up to 20 tracks" },
  { icon: Globe, text: "Public & private visibility" },
  { icon: Users, text: "Follow up to 50 creators" },
  { icon: ListMusic, text: "3 playlists" },
  { icon: Heart, text: "Like and discover public tracks" },
];

const PRO_FEATURES = [
  { icon: Music, text: "Unlimited track uploads" },
  { icon: Lock, text: "Inner circle visibility tier" },
  { icon: Users, text: "Unlimited follows" },
  { icon: ListMusic, text: "Unlimited playlists" },
  { icon: Zap, text: "Priority audio processing" },
  { icon: Star, text: "Featured creator badge" },
  { icon: Heart, text: "Advanced analytics & plays" },
  { icon: Globe, text: "Custom artist profile URL" },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const handleProClick = () => {
    toast.info("Pro plan coming soon! Stay tuned for updates.", { duration: 4000 });
  };

  return (
    <div className="container py-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <Badge className="mb-4 bg-purple-100 text-purple-700 border-0 px-4 py-1">
          Simple Pricing
        </Badge>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
          Share Your Sound
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Start free and upgrade when you're ready to take your music further. No hidden fees, no
          surprises.
        </p>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-2 border-gray-200 hover:border-purple-200 transition-colors">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mb-4">
                <Music className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Free</h2>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-bold text-gray-800">$0</span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Perfect for getting started and sharing your first riffs.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.text} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
              {isAuthenticated ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Get Started Free
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 px-4 py-1 shadow-md">
              Most Popular
            </Badge>
          </div>
          <Card className="h-full border-2 border-purple-400 shadow-xl shadow-purple-100">
            <CardHeader className="pb-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-t-xl">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Pro</h2>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  $9
                </span>
                <span className="text-muted-foreground mb-1">/month</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                For serious creators who want full control over their music.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <li key={feature.text} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">{feature.text}</span>
                    </li>
                  );
                })}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0 shadow-md"
                onClick={handleProClick}
              >
                <Zap className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Coming soon — join the waitlist!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl mx-auto mt-20"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            {
              q: "What audio formats are supported?",
              a: "We support MP3, WAV, AAC, FLAC, OGG, and M4A files up to 100MB per track.",
            },
            {
              q: "What is the Inner Circle visibility tier?",
              a: "Inner Circle tracks are only visible to users who follow you. It's a privacy layer between fully private and fully public — perfect for sharing with your close community.",
            },
            {
              q: "Can I change my plan at any time?",
              a: "Yes! You can upgrade or downgrade at any time. Pro features are available immediately after upgrading.",
            },
            {
              q: "Is my music safe?",
              a: "All audio files are stored securely in the cloud with redundant backups. Private and inner circle tracks are never accessible without proper authorization.",
            },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-gray-100 pb-6">
              <h3 className="font-semibold text-gray-800 mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
