import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Users, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

// ─── Strawberry Jam Session characters ───────────────────────────────────────
const CHARACTERS = [
  {
    name: "Jam the Drummer",
    desc: "Keeping the rhythm alive and kicking",
    bg: "from-violet-400 to-purple-600",
    emoji: "🥁",
  },
  {
    name: "Melody the Composer",
    desc: "Crafting beautiful melodies and harmonies",
    bg: "from-blue-400 to-cyan-500",
    emoji: "🎵",
  },
  {
    name: "Bass the Foundation",
    desc: "Laying down the groove and foundation",
    bg: "from-teal-400 to-emerald-500",
    emoji: "🎸",
  },
];

// ─── Value pillars ────────────────────────────────────────────────────────────
const VALUES = [
  {
    icon: Heart,
    gradient: "from-pink-400 to-rose-500",
    title: "Community First",
    desc: "Support over status. Feedback over follow-counts. Tribe over traffic.",
  },
  {
    icon: Zap,
    gradient: "from-blue-400 to-cyan-500",
    title: "Innovation Driven",
    desc: "Freedom from genre. Use all the tools, make all the sounds, your way.",
  },
  {
    icon: Users,
    gradient: "from-violet-400 to-purple-600",
    title: "Inclusive Platform",
    desc: "Zero gatekeeping. Infinite possibility.",
  },
  {
    icon: Shield,
    gradient: "from-orange-400 to-amber-500",
    title: "Your Content, Your Control",
    desc: "Complete control over who sees your work. Share publicly, with friends, or keep it private—your choice, always.",
  },
];

function ContactAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-2xl overflow-hidden cursor-pointer bg-card shadow-sm max-w-2xl mx-auto"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <h3 className="font-bold text-lg text-foreground">You can ring our bell.</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Questions, feedback, or a simple hello—drop us a line. We read every note.
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-5 h-5 text-pink-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-6 pb-5 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            We're a small team with big ears. Reach out at{" "}
            <a href="mailto:hello@strawberryriff.com" className="text-pink-500 hover:underline">
              hello@strawberryriff.com
            </a>{" "}
            and we'll get back to you as soon as we surface from the studio.
          </p>
        </div>
      )}
    </div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen py-16 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          About{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Strawberry Riff
          </span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          We're building the future of music creation and sharing, where community meets creativity
        </p>
      </motion.div>

      {/* Our Vision + Values */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        {/* Vision */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold mb-5">Our Vision</h2>
          <div className="space-y-4 text-foreground/80 leading-relaxed text-sm font-light">
            <p>
              Music begins with a heartbeat. From a kid drumming on a desk to a road-worn pro chasing
              fresh sparks, every dreamer deserves a stage. Strawberry Riff is that stage—a
              judgment-free sanctuary where the next great riff can rise from any corner of the world.
            </p>
            <p>
              We reject gatekeepers and black-box algorithms. Instead, real people drive discovery,
              trading perfection for connection. Drop a lo-fi voice memo, a polished studio cut, or an
              AI-assisted experiment—our tools make sharing effortless and feedback human. Artificial
              intelligence here is a sidekick, never the star. It tidies, suggests, and accelerates,
              but the soul of every track stays yours.
            </p>
            <p>
              Whether you're sketching at 3 a.m. or uploading from a tour bus, creation should feel
              like breathing, not a technical obstacle course. If you believe music is more verb than
              product, you've already found your tribe. Plug in your courage, hit upload, and let the
              pulse we share carry your sound to ears that need it.
            </p>
            <p className="font-semibold text-foreground">Welcome to Strawberry Riff.</p>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${v.gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Strawberry Jam Session */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Strawberry Jam Session! 🍓</h2>
        <p className="text-muted-foreground mb-10">
          Enter the club — check for upcoming shows.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {CHARACTERS.map((char, i) => (
            <motion.div
              key={char.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                className={`w-24 h-24 rounded-full bg-gradient-to-br ${char.bg} flex items-center justify-center shadow-lg cursor-pointer`}
                whileHover={{ scale: 1.12, rotate: [0, -6, 6, -6, 0] }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-4xl">{char.emoji}</span>
              </motion.div>
              <h3 className="font-bold text-base">{char.name}</h3>
              <p className="text-sm text-muted-foreground text-center">{char.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/pricing">
            <Button
              size="lg"
              className="rounded-full px-10 text-white border-0 font-semibold"
              style={{ background: "linear-gradient(135deg, #ec4899, #a855f7)" }}
            >
              See Our Pricing Plans
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* Contact accordion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <ContactAccordion />
      </motion.div>
    </div>
  );
}
