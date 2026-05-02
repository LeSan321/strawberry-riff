/**
 * Vocal Nuances Bible v2 Integration
 * 
 * 8 core vocal archetypes with production-grounded prompting language.
 * Each archetype includes:
 * - Core vocal character description
 * - Emotional delivery guidance
 * - Production/recording technique hints
 * - Negative prompts (anti-polish patterns to avoid)
 * - MiniMax-specific prompting tips
 */

export type VocalArchetype = 
  | "intimate-bedroom"
  | "raw-emotional"
  | "soulful-belter"
  | "gritty-rock"
  | "confident-pop"
  | "lo-fi-whisper"
  | "powerful-anthem"
  | "storyteller-folk";

export interface VocalArchetypeProfile {
  id: VocalArchetype;
  name: string;
  description: string;
  /** Core prompt language for MiniMax */
  promptCore: string;
  /** Emotional delivery guidance */
  emotionalGuidance: string;
  /** Production/recording technique hints */
  productionTips: string[];
  /** Negative prompts to automatically include */
  negativePrompts: string[];
  /** Why this archetype works well */
  whyItWorks: string;
}

/**
 * Core Vocal Archetypes from Vocal Nuances Bible v2
 * Production-grounded, immediately usable for MiniMax prompting
 */
export const VOCAL_ARCHETYPES: Record<VocalArchetype, VocalArchetypeProfile> = {
  "intimate-bedroom": {
    id: "intimate-bedroom",
    name: "Intimate Bedroom",
    description: "Breathy, warm, close-mic'd vocal with natural breathing and subtle imperfections. Intimate, vulnerable, lo-fi feel.",
    promptCore: "breathy, warm, close-mic'd vocal with natural breathing sounds, intimate delivery, subtle imperfections, vulnerable tone, bedroom recording aesthetic",
    emotionalGuidance: "Sing as if sharing a secret with one person. Restraint is power. Let vulnerability show through imperfect phrasing and audible breath.",
    productionTips: [
      "Emphasize breath sounds as punctuation, not distraction",
      "Slight pitch wobble adds authenticity",
      "Minimal processing — capture raw emotion",
      "Close microphone placement for intimacy",
      "Natural room tone acceptable",
    ],
    negativePrompts: [
      "overly polished",
      "sterile studio vocal",
      "heavy autotune",
      "perfect pitch",
      "compressed flat",
      "no breath sounds",
    ],
    whyItWorks: "Authenticity through intentional imperfection. Listeners connect to vulnerability, not perfection.",
  },

  "raw-emotional": {
    id: "raw-emotional",
    name: "Raw Emotional",
    description: "Imperfect, human vocal with emotional cracks, breathiness, slight pitch variation. Prioritizes feeling over polish.",
    promptCore: "raw emotional vocal with natural cracks, breathiness, slight pitch variation, human imperfections, emotional delivery, feeling over polish, authentic expression",
    emotionalGuidance: "Sing from the gut. Let emotion drive phrasing. Cracks and imperfections are features, not bugs. Authenticity > technical perfection.",
    productionTips: [
      "Capture multiple takes — choose the one with most emotion, not most polish",
      "Slight vocal strain on emotional peaks is good",
      "Timing drift adds humanity",
      "Breath sounds between phrases",
      "Minimal compression — preserve dynamics",
    ],
    negativePrompts: [
      "robotic",
      "perfect pitch",
      "overly polished",
      "no imperfections",
      "artificial",
      "clinical",
    ],
    whyItWorks: "Emotional authenticity resonates. Listeners feel the artist's truth, not technical skill.",
  },

  "soulful-belter": {
    id: "soulful-belter",
    name: "Soulful Belter",
    description: "Rich, resonant voice with dynamic range, controlled runs, warm tone, intentional strain on peaks.",
    promptCore: "soulful belter with rich resonant tone, dynamic range, controlled vocal runs and melismas, warm timbre, intentional vocal strain on emotional peaks, powerful delivery",
    emotionalGuidance: "Sing with full body resonance. Runs and melismas are storytelling tools. Strain on peaks shows emotional investment, not technical failure.",
    productionTips: [
      "Runs/melismas as primary expression language",
      "Vocal strain on peaks = emotional authenticity",
      "Controlled dynamics — dynamic range is feature",
      "Warm EQ (boost low-mids)",
      "Compression for presence, not flatness",
    ],
    negativePrompts: [
      "thin reedy tone",
      "no dynamic range",
      "overly compressed",
      "robotic runs",
      "perfect pitch",
    ],
    whyItWorks: "Virtuosity + humanity. Technical skill serves emotional storytelling.",
  },

  "gritty-rock": {
    id: "gritty-rock",
    name: "Gritty Rock",
    description: "Powerful midrange with rasp, grit, and strain. Live-energy delivery designed to cut through a band.",
    promptCore: "gritty rock vocal with powerful midrange, rasp and grit, vocal strain and edge, live-energy delivery, designed to cut through a band, raw power",
    emotionalGuidance: "Sing with attitude and power. Rasp and grit are weapons. Strain shows commitment, not weakness. Catharsis through intensity.",
    productionTips: [
      "Rasp/grit from natural vocal technique, not processing",
      "Vocal strain on peaks is feature",
      "Midrange emphasis for cutting through mix",
      "Slight distortion acceptable (character, not defect)",
      "Live room tone adds energy",
    ],
    negativePrompts: [
      "polished",
      "smooth",
      "no grit",
      "overly compressed",
      "thin tone",
    ],
    whyItWorks: "Raw power and attitude. Listeners feel the artist's commitment and energy.",
  },

  "confident-pop": {
    id: "confident-pop",
    name: "Confident Modern Pop",
    description: "Bright, clear, polished-but-human vocal with excellent presence and subtle high-end air.",
    promptCore: "confident modern pop vocal, bright and clear tone, polished but human, excellent presence, subtle high-end air, professional production, engaging delivery",
    emotionalGuidance: "Sing with confidence and presence. Technical perfection + curated emotion. Authenticity through intentional production choices.",
    productionTips: [
      "Bright EQ for presence and clarity",
      "Subtle high-end air for modern sheen",
      "Controlled dynamics — polished but not flat",
      "Compression for presence and consistency",
      "Subtle effects (reverb, delay) as production choice",
    ],
    negativePrompts: [
      "overly polished",
      "sterile",
      "no personality",
      "robotic",
      "generic pop vocal",
    ],
    whyItWorks: "Produced authenticity. Technical perfection + human emotion = radio-ready but relatable.",
  },

  "lo-fi-whisper": {
    id: "lo-fi-whisper",
    name: "Lo-fi Whisper",
    description: "Soft, hazy, conversational delivery with room tone, tape warmth, and gentle imperfections.",
    promptCore: "lo-fi whisper vocal, soft and hazy, conversational delivery, room tone, tape warmth, gentle imperfections, bedroom intimacy, analog character",
    emotionalGuidance: "Sing as if in a bedroom late at night. Conversational, not performative. Imperfection is the point. Warmth > clarity.",
    productionTips: [
      "Room tone is feature, not bug",
      "Tape saturation for warmth",
      "Gentle imperfections (slight pitch drift, timing)",
      "Minimal high-end — warm and hazy",
      "Soft compression for cohesion",
    ],
    negativePrompts: [
      "bright",
      "clear",
      "polished",
      "no room tone",
      "sterile",
    ],
    whyItWorks: "Intimacy through imperfection. Lo-fi aesthetic prioritizes feeling over fidelity.",
  },

  "powerful-anthem": {
    id: "powerful-anthem",
    name: "Powerful Anthem",
    description: "Soaring, confident delivery with strong projection and emotional build. Epic but human.",
    promptCore: "powerful anthem vocal, soaring and confident delivery, strong projection, emotional build, epic scale but human, inspirational tone, dynamic intensity",
    emotionalGuidance: "Sing like you're inspiring thousands. Confidence + vulnerability. Build from intimate to powerful. Emotional arc is everything.",
    productionTips: [
      "Dynamic range is essential — build from soft to powerful",
      "Projection without strain (technique > force)",
      "Emotional peaks with controlled power",
      "Reverb for space and epic feel",
      "Compression for consistency across dynamic range",
    ],
    negativePrompts: [
      "flat",
      "no dynamics",
      "overly compressed",
      "robotic",
      "no emotional arc",
    ],
    whyItWorks: "Emotional journey. Listeners feel the build and payoff. Epic + human = universal appeal.",
  },

  "storyteller-folk": {
    id: "storyteller-folk",
    name: "Storyteller Folk",
    description: "Honest, clear, organic vocal focused on lyrical delivery with natural warmth and minimal processing.",
    promptCore: "storyteller folk vocal, honest and clear tone, focused on lyrical delivery, natural warmth, minimal processing, organic feel, authentic expression",
    emotionalGuidance: "Sing like you're telling a story to a friend. Clarity of lyric > technical perfection. Let the story drive phrasing.",
    productionTips: [
      "Lyrical clarity is priority — enunciation matters",
      "Natural phrasing — follow the story, not the beat",
      "Minimal processing — capture authenticity",
      "Warm EQ (natural, not colored)",
      "Slight timing drift adds humanity",
    ],
    negativePrompts: [
      "overly polished",
      "no personality",
      "robotic",
      "heavy effects",
      "compressed flat",
    ],
    whyItWorks: "Storytelling authenticity. Listeners connect to the narrative, not the production.",
  },
};

/**
 * Master negative prompt list — automatically include relevant ones based on archetype
 * These prevent common "too polished" and "AI-sounding" patterns
 */
export const MASTER_NEGATIVE_PROMPTS = [
  "overly polished",
  "sterile studio vocal",
  "robotic",
  "perfect pitch",
  "heavy autotune",
  "compressed flat",
  "generic pop vocal",
  "no breath sounds",
  "no imperfections",
  "artificial",
  "glossy",
  "clinical",
  "soulless",
  "emotionless",
];

/**
 * Get all vocal archetypes for UI dropdown/selection
 */
export function getVocalArchetypes(): Array<{
  id: VocalArchetype;
  name: string;
  description: string;
}> {
  return Object.values(VOCAL_ARCHETYPES).map((arch) => ({
    id: arch.id,
    name: arch.name,
    description: arch.description,
  }));
}

/**
 * Build a vocal-guided prompt using archetype + user prompt
 * Combines archetype guidance with user's original prompt
 */
export function buildVocalPrompt(
  userPrompt: string,
  archetype: VocalArchetype,
  includeNegatives: boolean = true
): string {
  const arch = VOCAL_ARCHETYPES[archetype];
  if (!arch) throw new Error(`Unknown vocal archetype: ${archetype}`);

  // Combine archetype core + user prompt
  let fullPrompt = `${arch.promptCore}. ${userPrompt}`;

  // Add negative prompts if requested
  if (includeNegatives) {
    const negatives = arch.negativePrompts.join(", ");
    fullPrompt += ` [avoid: ${negatives}]`;
  }

  return fullPrompt;
}

/**
 * Get archetype profile by ID
 */
export function getArchetypeProfile(id: VocalArchetype): VocalArchetypeProfile {
  const arch = VOCAL_ARCHETYPES[id];
  if (!arch) throw new Error(`Unknown vocal archetype: ${id}`);
  return arch;
}
