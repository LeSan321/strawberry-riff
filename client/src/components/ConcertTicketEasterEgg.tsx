import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Star, Ticket } from "lucide-react";
import { Button } from "./ui/button";

// Anthropomorphic strawberry character SVG
function StrawberryCharacter({
  style,
}: {
  style?: React.CSSProperties;
}) {
  return (
    <motion.div style={style} className="select-none">
      <svg viewBox="0 0 60 80" width="60" height="80" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="30" cy="50" rx="20" ry="22" fill="#e8324a" />
        {/* Seeds */}
        {[
          [22, 44], [30, 40], [38, 44],
          [20, 54], [30, 58], [40, 54],
          [25, 49], [35, 49],
        ].map(([cx, cy], i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="1.5" ry="2" fill="#c0182e" />
        ))}
        {/* Shine */}
        <ellipse cx="22" cy="44" rx="5" ry="7" fill="#ff6b7a" opacity="0.4" />
        {/* Leaves */}
        <path d="M20 30 Q15 20 25 22 Q22 28 30 28" fill="#2d8a4e" />
        <path d="M40 30 Q45 20 35 22 Q38 28 30 28" fill="#2d8a4e" />
        <path d="M30 28 Q28 18 30 14 Q32 18 30 28" fill="#3aab60" />
        {/* Face */}
        {/* Eyes */}
        <circle cx="25" cy="48" r="3" fill="white" />
        <circle cx="35" cy="48" r="3" fill="white" />
        <circle cx="26" cy="48.5" r="1.8" fill="#1a1a2e" />
        <circle cx="36" cy="48.5" r="1.8" fill="#1a1a2e" />
        <circle cx="26.8" cy="47.8" r="0.6" fill="white" />
        <circle cx="36.8" cy="47.8" r="0.6" fill="white" />
        {/* Smile */}
        <path d="M24 54 Q30 59 36 54" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Rosy cheeks */}
        <circle cx="21" cy="52" r="3" fill="#ff9eb5" opacity="0.5" />
        <circle cx="39" cy="52" r="3" fill="#ff9eb5" opacity="0.5" />
        {/* Arms */}
        <path d="M10 52 Q8 48 12 46" stroke="#e8324a" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M50 52 Q52 48 48 46" stroke="#e8324a" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Tiny guitar for performer */}
        <rect x="5" y="44" width="6" height="4" rx="1" fill="#8B4513" />
        <line x1="8" y1="44" x2="8" y2="40" stroke="#8B4513" strokeWidth="1.5" />
      </svg>
    </motion.div>
  );
}

function StrawberryAudience() {
  const positions = [
    { x: "8%", delay: 0 },
    { x: "22%", delay: 0.15 },
    { x: "36%", delay: 0.3 },
    { x: "50%", delay: 0.1 },
    { x: "64%", delay: 0.25 },
    { x: "78%", delay: 0.05 },
  ];

  return (
    <div className="relative h-24 w-full overflow-hidden">
      {positions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0"
          style={{ left: pos.x }}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: pos.delay, repeatType: "loop" }}
        >
          <svg viewBox="0 0 40 55" width="40" height="55">
            <ellipse cx="20" cy="36" rx="14" ry="16" fill="#e8324a" />
            {[[14, 30], [20, 27], [26, 30], [13, 38], [20, 42], [27, 38]].map(([cx, cy], j) => (
              <ellipse key={j} cx={cx} cy={cy} rx="1.2" ry="1.6" fill="#c0182e" />
            ))}
            <ellipse cx="15" cy="30" rx="3.5" ry="5" fill="#ff6b7a" opacity="0.35" />
            <path d="M13 20 Q9 13 17 15 Q15 19 20 19" fill="#2d8a4e" />
            <path d="M27 20 Q31 13 23 15 Q25 19 20 19" fill="#2d8a4e" />
            <path d="M20 19 Q18 11 20 8 Q22 11 20 19" fill="#3aab60" />
            <circle cx="17" cy="33" r="2.2" fill="white" />
            <circle cx="23" cy="33" r="2.2" fill="white" />
            <circle cx="17.8" cy="33.4" r="1.3" fill="#1a1a2e" />
            <circle cx="23.8" cy="33.4" r="1.3" fill="#1a1a2e" />
            <path d="M16 38 Q20 42 24 38" stroke="#1a1a2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <circle cx="14" cy="37" r="2" fill="#ff9eb5" opacity="0.5" />
            <circle cx="26" cy="37" r="2" fill="#ff9eb5" opacity="0.5" />
            {/* Arms raised */}
            <path d="M6 34 Q4 26 8 24" stroke="#e8324a" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M34 34 Q36 26 32 24" stroke="#e8324a" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

interface ConcertTicketEasterEggProps {
  open: boolean;
  onClose: () => void;
}

export default function ConcertTicketEasterEgg({ open, onClose }: ConcertTicketEasterEggProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Ticket */}
          <motion.div
            initial={{ scale: 0.7, rotate: -5, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.7, rotate: 5, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="relative z-10 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ticket shape */}
            <div className="bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 rounded-2xl overflow-hidden shadow-2xl">
              {/* Top section */}
              <div className="p-6 pb-4 relative overflow-hidden">
                {/* Stars */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: `${Math.random() * 90}%`,
                      top: `${Math.random() * 80}%`,
                    }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}
                  >
                    <Star className="w-3 h-3 text-yellow-300 fill-current" />
                  </motion.div>
                ))}

                <div className="text-center relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Ticket className="w-5 h-5 text-yellow-300" />
                    <span className="text-yellow-300 text-xs font-bold uppercase tracking-widest">
                      Special Invite
                    </span>
                    <Ticket className="w-5 h-5 text-yellow-300" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    🍓 The Strawberry
                  </h2>
                  <p className="text-pink-200 text-sm font-medium">A Very Special Performance</p>
                </div>

                {/* Performer strawberry */}
                <div className="flex justify-center mt-4 relative">
                  <motion.div
                    animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <StrawberryCharacter />
                  </motion.div>
                  {/* Music notes */}
                  {["♪", "♫", "♩", "♬"].map((note, i) => (
                    <motion.span
                      key={i}
                      className="absolute text-yellow-300 text-lg font-bold"
                      style={{ left: `${25 + i * 15}%`, top: "0%" }}
                      animate={{ y: [-5, -25], opacity: [1, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    >
                      {note}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Perforated divider */}
              <div className="relative flex items-center px-4">
                <div className="w-6 h-6 rounded-full bg-black/30 -ml-7" />
                <div className="flex-1 border-t-2 border-dashed border-white/30 mx-2" />
                <div className="w-6 h-6 rounded-full bg-black/30 -mr-7" />
              </div>

              {/* Bottom section */}
              <div className="p-6 pt-4 bg-purple-900/30">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <p className="text-pink-300 text-xs uppercase tracking-wide mb-1">Date</p>
                    <p className="text-white font-bold text-sm">Midsummer</p>
                    <p className="text-pink-200 text-xs">Strawberry Season</p>
                  </div>
                  <div>
                    <p className="text-pink-300 text-xs uppercase tracking-wide mb-1">Venue</p>
                    <p className="text-white font-bold text-sm">The Patch</p>
                    <p className="text-pink-200 text-xs">Row 1, Seat 🍓</p>
                  </div>
                  <div>
                    <p className="text-pink-300 text-xs uppercase tracking-wide mb-1">Admit</p>
                    <p className="text-white font-bold text-sm">One</p>
                    <p className="text-pink-200 text-xs">Inner Circle</p>
                  </div>
                </div>

                {/* Audience */}
                <StrawberryAudience />

                <p className="text-center text-pink-300 text-xs mt-3 italic">
                  "Where every riff is a berry good time" 🎵
                </p>
              </div>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-3 -right-3 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/30 text-white"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
