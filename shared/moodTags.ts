/**
 * Shared mood tag library for Strawberry Riff.
 * Used on Upload, Generate publish dialog, My Riffs edit, and Discover filter.
 *
 * Five categories cover emotional states, texture, energy arc, situational context,
 * and experimental/genre-free territory — designed to work alongside the fusion
 * system rather than replacing genre labels.
 */

export interface MoodCategory {
  label: string;
  emoji: string;
  tags: string[];
}

export const MOOD_CATEGORIES: MoodCategory[] = [
  {
    label: "Emotional",
    emoji: "💜",
    tags: [
      "Melancholic", "Romantic", "Nostalgic", "Bittersweet", "Defiant",
      "Tender", "Haunting", "Euphoric", "Aching", "Triumphant",
    ],
  },
  {
    label: "Energy",
    emoji: "⚡",
    tags: [
      "Chill", "Energetic", "Upbeat", "Aggressive", "Building",
      "Fading", "Explosive", "Meditative", "Hypnotic", "Restless",
    ],
  },
  {
    label: "Texture",
    emoji: "🎨",
    tags: [
      "Dreamy", "Dark", "Airy", "Dense", "Lush",
      "Raw", "Gritty", "Warm", "Cold", "Lo-fi",
    ],
  },
  {
    label: "Vibe / Context",
    emoji: "🌙",
    tags: [
      "Late Night", "Morning", "Road Trip", "Focus", "Movement",
      "Ritual", "Ceremony", "Epic", "Cinematic", "Abstract",
    ],
  },
  {
    label: "Sonic Character",
    emoji: "🔬",
    tags: [
      "Experimental", "Ambient", "Glitchy", "Organic", "Futuristic",
      "Sparse", "Polished", "Layered", "Minimal", "Immersive",
    ],
  },
];

/** Flat list of all tags — use for validation, search, and legacy compatibility. */
export const ALL_MOOD_TAGS: string[] = MOOD_CATEGORIES.flatMap((c) => c.tags);

/** Legacy preset list (kept for backward compatibility with existing tracks). */
export const MOOD_PRESETS = ALL_MOOD_TAGS;
