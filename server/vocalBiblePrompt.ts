/**
 * Vocal Bible Prompt Assembler
 *
 * Implements the Three-Signal Model from the Vocal Bible (v0.2):
 *   Signal 1: Genre frame + negative gates (sets MiniMax's genre arbitration)
 *   Signal 2: Phonetic descriptors + register (steers acoustic character)
 *   Signal 3: Dialect lyrics (reinforces accent at semantic/phonetic level)
 *
 * Assembly order (empirically validated):
 *   genre_frame → negative_gates → vocal_identity → role → structure → vocal_reinforcement
 *
 * Key findings:
 * - Bass male and mezzo-soprano carry accent instructions more reliably than soprano female
 * - Dialect lyrics are required (not optional) for reliable accent production
 * - Genre frame must name the accent-carrying tradition FIRST, fusion element second
 */

// ─── Accent Profile Data ──────────────────────────────────────────────────────
// Derived from 04_accent_profiles_v0_1.json (Vocal Bible v0.2)

export type AccentProfileId =
  | "celtic_irish"
  | "blues_south"
  | "country_americana"
  | "british_rp"
  | "bossa_nova"
  | "jazz_american"
  | "none";

export interface AccentProfile {
  id: AccentProfileId;
  label: string;
  description: string;
  /** Genre frame to prepend — names accent-carrying tradition first */
  genreFrame: string;
  /** Negative gates to prevent genre collapse */
  negativeGates: string;
  /** Phonetic descriptors for the vocal identity block */
  phoneticDescriptors: string;
  /** Recommended registers for best accent uptake (lower = more steerable) */
  recommendedRegisters: string[];
  /** Dialect substitution rules: [original, replacement, note] */
  dialectSubstitutions: Array<{ from: string; to: string; note?: string }>;
  /** Vocabulary to avoid in lyrics (triggers genre collapse) */
  vocabularyToAvoid: string[];
}

export const ACCENT_PROFILES: Record<AccentProfileId, AccentProfile> = {
  celtic_irish: {
    id: "celtic_irish",
    label: "Celtic / Scottish",
    description: "Highland and Irish folk vocal tradition — rolled R, open back vowels, rising phrase endings",
    genreFrame: "traditional Scottish Celtic folk tradition with rockabilly rhythm influence, Highland vocal style",
    negativeGates: "not country, not Americana, not Southern rock, not gospel",
    phoneticDescriptors: "rolled R consonants, open back vowels, rising phrase-final intonation, soft lenited consonant edges, behind-the-beat delivery with rockabilly rhythmic snap, breathy phrase endings, mid-room presence",
    recommendedRegisters: ["bass male", "baritone male", "mezzo-soprano female", "contralto female"],
    dialectSubstitutions: [
      { from: "I'm", to: "Ah'm", note: "Scottish first person" },
      { from: "I am", to: "Ah am" },
      { from: "I'll", to: "Ah'll" },
      { from: "I've", to: "Ah've" },
      { from: "I'd", to: "Ah'd" },
      { from: "I ", to: "Ah " },
      { from: "you", to: "ye", note: "Scottish second person" },
      { from: "You", to: "Ye" },
      { from: "don't", to: "dinnae", note: "Scottish negation" },
      { from: "Don't", to: "Dinnae" },
      { from: "doesn't", to: "doesnae" },
      { from: "can't", to: "cannae" },
      { from: "won't", to: "willnae" },
      { from: "isn't", to: "isnae" },
      { from: "not", to: "nae", note: "Apply selectively — not every 'not'" },
      { from: "my", to: "ma", note: "Scottish possessive" },
      { from: "My", to: "Ma" },
      { from: "the old", to: "the auld" },
      { from: "old", to: "auld", note: "Apply to 'old world', 'old ways' etc" },
      { from: "home", to: "hame" },
      { from: "Home", to: "Hame" },
      { from: "one", to: "yin", note: "Scottish numeral" },
      { from: "Oh,", to: "Och," },
      { from: "Oh ", to: "Och " },
    ],
    vocabularyToAvoid: ["y'all", "ain't", "holler", "bayou", "honky-tonk", "pickup truck", "dirt road"],
  },

  blues_south: {
    id: "blues_south",
    label: "American Blues / Deep South",
    description: "Chicago and Delta blues vocal tradition — blue notes, melisma, Southern American phonetics",
    genreFrame: "Chicago blues tradition with Delta soul influence, Deep South vocal style",
    negativeGates: "not pop, not country, not gospel choir, not rock",
    phoneticDescriptors: "blue note bends on sustained vowels, melismatic phrase endings, Southern American vowel drawl, chest-forward delivery, gritty lower-mid texture, behind-the-beat phrasing, intimate club presence",
    recommendedRegisters: ["bass male", "baritone male", "contralto female", "mezzo-soprano female"],
    dialectSubstitutions: [
      { from: "going to", to: "gonna" },
      { from: "want to", to: "wanna" },
      { from: "got to", to: "gotta" },
      { from: "I am", to: "I'm" },
      { from: "about", to: "'bout" },
      { from: "because", to: "'cause" },
      { from: "something", to: "somethin'" },
      { from: "nothing", to: "nothin'" },
      { from: "everything", to: "ev'rything" },
      { from: "running", to: "runnin'" },
      { from: "coming", to: "comin'" },
      { from: "leaving", to: "leavin'" },
      { from: "crying", to: "cryin'" },
      { from: "trying", to: "tryin'" },
      { from: "feeling", to: "feelin'" },
      { from: "baby", to: "baby", note: "Keep — authentic blues vocabulary" },
    ],
    vocabularyToAvoid: ["bagpipes", "Celtic", "Highland", "glen", "loch", "bossa", "samba"],
  },

  country_americana: {
    id: "country_americana",
    label: "Country / Americana",
    description: "Nashville and Americana vocal tradition — twang, Southern drawl, storytelling delivery",
    genreFrame: "Americana folk tradition with country influence, Southern storytelling vocal style",
    negativeGates: "not pop, not rock, not blues, not gospel",
    phoneticDescriptors: "Southern twang on vowels, nasal resonance in upper register, storytelling delivery with conversational phrasing, slight drawl on sustained notes, warm mid-range presence, natural vibrato",
    recommendedRegisters: ["baritone male", "tenor male", "mezzo-soprano female", "alto female"],
    dialectSubstitutions: [
      { from: "going to", to: "gonna" },
      { from: "want to", to: "wanna" },
      { from: "I am", to: "I'm" },
      { from: "you all", to: "y'all" },
      { from: "you are", to: "you're" },
      { from: "something", to: "somethin'" },
      { from: "nothing", to: "nothin'" },
      { from: "running", to: "runnin'" },
      { from: "coming", to: "comin'" },
      { from: "down the road", to: "down the road", note: "Keep — authentic" },
      { from: "back home", to: "back home", note: "Keep — authentic" },
    ],
    vocabularyToAvoid: ["bagpipes", "Celtic", "Highland", "bossa", "samba", "blues harp"],
  },

  british_rp: {
    id: "british_rp",
    label: "British RP",
    description: "Received Pronunciation — clipped consonants, non-rhotic vowels, precise articulation",
    genreFrame: "British pop tradition with art-rock influence, English vocal style",
    negativeGates: "not country, not Americana, not Southern, not Celtic",
    phoneticDescriptors: "non-rhotic vowels (no R after vowels), clipped precise consonants, received pronunciation articulation, forward placement, bright upper-mid presence, controlled vibrato, formal delivery",
    recommendedRegisters: ["baritone male", "tenor male", "mezzo-soprano female", "soprano female"],
    dialectSubstitutions: [
      { from: "can't", to: "cahn't", note: "British broad A" },
      { from: "dance", to: "dahce", note: "Broad A" },
      { from: "path", to: "pahth" },
      { from: "after", to: "ahfter" },
      { from: "rather", to: "rahther" },
      { from: "water", to: "wah-tah", note: "Non-rhotic" },
      { from: "better", to: "bettah" },
      { from: "never", to: "nevah" },
      { from: "forever", to: "forevah" },
      { from: "together", to: "togethah" },
      { from: "another", to: "anothah" },
      { from: "going to", to: "going to", note: "RP keeps full forms" },
    ],
    vocabularyToAvoid: ["y'all", "ain't", "holler", "bayou", "twang", "dinnae", "och"],
  },

  bossa_nova: {
    id: "bossa_nova",
    label: "Bossa Nova / Brazilian",
    description: "Brazilian samba-jazz vocal tradition — soft sibilants, Portuguese phonetics, intimate delivery",
    genreFrame: "Brazilian bossa nova tradition with samba jazz influence, Rio vocal style",
    negativeGates: "not country, not rock, not gospel, not Celtic",
    phoneticDescriptors: "soft sibilant S sounds, Portuguese-influenced vowel openness, intimate breathy delivery, behind-the-beat syncopation, warm lower-mid presence, gentle vibrato on phrase endings, close-mic intimacy",
    recommendedRegisters: ["baritone male", "mezzo-soprano female", "alto female", "contralto female"],
    dialectSubstitutions: [
      { from: "the sun", to: "o sol", note: "Portuguese — use sparingly" },
      { from: "the sea", to: "o mar" },
      { from: "the night", to: "a noite" },
      { from: "love", to: "amor", note: "Use in key hook lines" },
      { from: "heart", to: "coração", note: "Use sparingly" },
      { from: "beautiful", to: "bonita" },
      { from: "gentle", to: "suave" },
      { from: "soft", to: "suave" },
    ],
    vocabularyToAvoid: ["y'all", "twang", "holler", "dinnae", "och", "ain't"],
  },

  jazz_american: {
    id: "jazz_american",
    label: "Jazz (American)",
    description: "American jazz vocal tradition — scat phrasing, blue notes, behind-the-beat delivery",
    genreFrame: "American jazz tradition with swing influence, intimate jazz club vocal style",
    negativeGates: "not country, not Americana, not rock, not gospel",
    phoneticDescriptors: "behind-the-beat phrasing, blue note bends, breathy phrase endings, gentle pitch scoops into sustained notes, warm lower-mid emphasis, slow wide vibrato on chorus phrases only, intimate close-mic presence",
    recommendedRegisters: ["bass male", "baritone male", "alto female", "mezzo-soprano female"],
    dialectSubstitutions: [
      { from: "going to", to: "gonna" },
      { from: "want to", to: "wanna" },
      { from: "got to", to: "gotta" },
      { from: "something", to: "somethin'" },
      { from: "nothing", to: "nothin'" },
      { from: "baby", to: "baby", note: "Keep — authentic jazz vocabulary" },
      { from: "darling", to: "darlin'" },
      { from: "feeling", to: "feelin'" },
      { from: "singing", to: "singin'" },
      { from: "swinging", to: "swingin'" },
    ],
    vocabularyToAvoid: ["bagpipes", "Celtic", "Highland", "twang", "holler", "y'all"],
  },

  none: {
    id: "none",
    label: "No Accent",
    description: "Standard neutral vocal — no accent steering applied",
    genreFrame: "",
    negativeGates: "",
    phoneticDescriptors: "",
    recommendedRegisters: [],
    dialectSubstitutions: [],
    vocabularyToAvoid: [],
  },
};

// ─── Structure Fingerprint ────────────────────────────────────────────────────

export interface StructureSection {
  label: string;
  bars: number;
  energy?: number;
}

export interface StructureFingerprint {
  bpm: number;
  sections: StructureSection[];
  section_sequence: string;
  shape_hash: string;
}

/**
 * Parse a structure block string from a prompt into a StructureFingerprint.
 * Handles the format: "Intro 8 bars sparse tones, Verse 1 16 bars phrasing, ..."
 * Returns null if the structure block cannot be parsed.
 */
export function parseStructureBlock(structureText: string): StructureFingerprint | null {
  try {
    // Match patterns like "Intro 8 bars", "Verse 1 16 bars", "Chorus 16 bars", etc.
    const sectionPattern = /\b(intro|verse\s*\d*|chorus|bridge|outro|pre-chorus|hook)\s+(\d+)\s+bars?\b/gi;
    const sections: StructureSection[] = [];
    let match: RegExpExecArray | null;

    while ((match = sectionPattern.exec(structureText)) !== null) {
      const label = match[1].trim().toLowerCase().replace(/\s+\d+$/, ""); // normalize "verse 1" → "verse"
      const bars = parseInt(match[2], 10);
      if (!isNaN(bars) && bars > 0) {
        sections.push({ label, bars });
      }
    }

    if (sections.length === 0) return null;

    // Extract BPM if present
    const bpmMatch = structureText.match(/(\d+)\s*BPM/i);
    const bpm = bpmMatch ? parseInt(bpmMatch[1], 10) : 0;

    const section_sequence = sections.map((s) => s.label).join("-");
    const shape_hash = sections.map((s) => `${s.label[0].toUpperCase()}${s.bars}`).join("-");

    return { bpm, sections, section_sequence, shape_hash };
  } catch {
    return null;
  }
}

/**
 * Build a structure block string from a StructureFingerprint.
 * Used to auto-assemble the structure block in a vocal prompt from an instrumental's fingerprint.
 */
export function buildStructureBlock(fingerprint: StructureFingerprint): string {
  const parts = fingerprint.sections.map((s) => {
    const label = s.label.charAt(0).toUpperCase() + s.label.slice(1);
    return `${label} ${s.bars} bars`;
  });
  return `Strict structure: ${parts.join(", ")}.`;
}

// ─── Dialect Substitution ─────────────────────────────────────────────────────

/**
 * Apply dialect substitutions to lyrics based on the selected accent profile.
 * Substitutions are applied in order — more specific patterns first.
 * Returns the original lyrics unchanged if accentProfileId is "none" or not found.
 */
export function applyDialectSubstitutions(lyrics: string, accentProfileId: AccentProfileId): string {
  const profile = ACCENT_PROFILES[accentProfileId];
  if (!profile || accentProfileId === "none" || profile.dialectSubstitutions.length === 0) {
    return lyrics;
  }

  let result = lyrics;
  for (const sub of profile.dialectSubstitutions) {
    // Word-boundary aware replacement — avoid partial word matches
    // Use a simple global replace for contractions and short words
    const escaped = sub.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "g");
    result = result.replace(regex, sub.to);
  }

  return result;
}

// ─── Three-Signal Prompt Assembler ────────────────────────────────────────────

export interface AccentVocalPromptInput {
  /** Accent profile to apply */
  accentProfileId: AccentProfileId;
  /** Vocal register (e.g. "bass male", "mezzo-soprano female") */
  register: string;
  /** Role description (e.g. "primary melodic carrier replacing lead saxophone") */
  role?: string;
  /** BPM of the instrumental track (for role description) */
  bpm?: number;
  /** Atmosphere description (e.g. "intimate jazz club") */
  atmosphere?: string;
  /** Pre-built structure block string, or auto-built from fingerprint */
  structureBlock?: string;
  /** Structure fingerprint from the instrumental track */
  structureFingerprint?: StructureFingerprint | null;
  /** Additional style notes from the user */
  styleNotes?: string;
}

/**
 * Build a full three-signal vocal prompt from the Vocal Bible.
 * Assembly order: genre_frame → negative_gates → vocal_identity → role → structure → vocal_reinforcement
 *
 * Returns the assembled prompt string ready for MiniMax.
 */
export function buildAccentVocalPrompt(input: AccentVocalPromptInput): string {
  const profile = ACCENT_PROFILES[input.accentProfileId];

  // If no accent, return a minimal prompt using just the register and style notes
  if (!profile || input.accentProfileId === "none") {
    const parts: string[] = [];
    if (input.register) parts.push(`Lead Instrument: ${input.register} Vocal`);
    if (input.role) parts.push(`Role: ${input.role}`);
    if (input.structureBlock) parts.push(input.structureBlock);
    else if (input.structureFingerprint) parts.push(buildStructureBlock(input.structureFingerprint));
    if (input.styleNotes) parts.push(input.styleNotes);
    return parts.join(". ");
  }

  const parts: string[] = [];

  // Signal 1: Genre frame + negative gates
  if (profile.genreFrame) {
    parts.push(profile.genreFrame);
  }
  if (profile.negativeGates) {
    parts.push(profile.negativeGates);
  }

  // Signal 2: Vocal identity (register + phonetic descriptors)
  if (profile.phoneticDescriptors) {
    parts.push(`Lead Instrument: ${input.register} Vocal — ${profile.phoneticDescriptors}`);
  } else {
    parts.push(`Lead Instrument: ${input.register} Vocal`);
  }

  // Role block
  const roleDesc = input.role ?? "primary melodic carrier";
  const bpmDesc = input.bpm ? ` ${input.bpm} BPM` : "";
  const atmosphereDesc = input.atmosphere ? ` ${input.atmosphere}` : "";
  parts.push(`Role: ${roleDesc}${bpmDesc}${atmosphereDesc}`);

  // Structure block (from fingerprint or explicit)
  if (input.structureBlock) {
    parts.push(input.structureBlock);
  } else if (input.structureFingerprint) {
    parts.push(buildStructureBlock(input.structureFingerprint));
  }

  // Signal 2 reinforcement (phonetic descriptors repeated at end)
  if (profile.phoneticDescriptors) {
    parts.push(`${input.register} Vocal: ${profile.phoneticDescriptors}`);
  }

  // Optional extra style notes
  if (input.styleNotes?.trim()) {
    parts.push(input.styleNotes.trim());
  }

  return parts.join(". ");
}
