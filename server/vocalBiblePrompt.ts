/**
 * Vocal Bible Prompt Assembler
 * Implements the Three-Signal Model for accent-steered vocal generation.
 * Signal 1: Genre frame + negative gates (prompt opening)
 * Signal 2: Phonetic descriptors + register (vocal identity string)
 * Signal 3: Dialect lyrics (transformed before generation)
 *
 * Key findings (empirically validated August 2026):
 *   - Bass male / mezzo-soprano female carry accent instructions most reliably
 *   - Genre frame must name the accent-carrying tradition FIRST
 *   - Dialect lyrics are required; prompt alone collapses to neutral American
 */

export interface StructureSection {
  label: string;
  bars: number;
}

export interface StructureFingerprint {
  bpm: number;
  time_signature: string;
  total_bars: number;
  sections: StructureSection[];
  section_sequence: string;
  shape_hash: string;
}

export interface AccentVocalPromptOptions {
  accentProfileId: string;
  register: "bass-male" | "mezzo-soprano-female" | "tenor-male" | "soprano-female";
  bpm?: number;
  atmosphere?: string;
  structureFingerprint?: StructureFingerprint | null;
}

interface AccentProfile {
  id: string;
  label: string;
  genre_frame: string;
  negative_gates: string;
  phonetic_descriptors: string;
  reinforcement_descriptors: string;
  summary: string;
  dialect_substitutions: Array<{ from: string | RegExp; to: string }>;
}

const ACCENT_PROFILES: Record<string, AccentProfile> = {
  "celtic-irish": {
    id: "celtic-irish",
    label: "Celtic / Scottish Highland",
    genre_frame: "traditional Scottish Celtic folk tradition, Highland vocal style",
    negative_gates: "not country, not Americana, not Southern rock, not gospel",
    phonetic_descriptors: "rolled R consonants, open back vowels, rising phrase-final intonation, soft lenited consonant edges, behind-the-beat delivery with rhythmic snap, breathy phrase endings, mid-room presence",
    reinforcement_descriptors: "rolled R consonants, open back vowels, rising phrase-final intonation, soft lenited consonant edges, behind beat rhythmic snap",
    summary: "Celtic/Scottish Highland — rolled R consonants, open back vowels, rising intonation",
    dialect_substitutions: [
      { from: /\bI'm\b/g, to: "Ah'm" },
      { from: /\bI\b/g, to: "Ah" },
      { from: /\byou\b/gi, to: "ye" },
      { from: /\bmy\b/gi, to: "ma" },
      { from: /\bdon't\b/gi, to: "dinnae" },
      { from: /\bcan't\b/gi, to: "cannae" },
      { from: /\bwon't\b/gi, to: "willnae" },
      { from: /\bnot\b/gi, to: "nae" },
      { from: /\bno\b/gi, to: "nae" },
      { from: /\boh\b/gi, to: "och" },
      { from: /\bold\b/gi, to: "auld" },
      { from: /\bhome\b/gi, to: "hame" },
      { from: /\bone\b/gi, to: "yin" },
      { from: /\bmore\b/gi, to: "mair" },
      { from: /\bto\b/gi, to: "tae" },
      { from: /\byes\b/gi, to: "aye" },
      { from: /\bnow\b/gi, to: "the noo" },
      { from: /\bsinging\b/gi, to: "singin'" },
      { from: /\bhumming\b/gi, to: "hummin'" },
      { from: /\brunning\b/gi, to: "runnin'" },
    ],
  },
  "blues-south": {
    id: "blues-south",
    label: "Blues / American Deep South",
    genre_frame: "American Delta blues tradition, Deep South vocal style",
    negative_gates: "not Celtic, not British, not pop, not gospel choir",
    phonetic_descriptors: "drawled vowels, dropped final consonants, melismatic phrase endings, chest-heavy tone, blue note bends, behind-the-beat phrasing, intimate close-mic presence",
    reinforcement_descriptors: "drawled vowels, dropped final consonants, melismatic endings, chest-heavy tone, blue note bends",
    summary: "Blues/Deep South — drawled vowels, melismatic bends, chest-heavy tone",
    dialect_substitutions: [
      { from: /\bI'm going to\b/gi, to: "Ah'm gonna" },
      { from: /\bI\b/g, to: "Ah" },
      { from: /\bgoing to\b/gi, to: "gonna" },
      { from: /\bwant to\b/gi, to: "wanna" },
      { from: /\byou all\b/gi, to: "y'all" },
      { from: /\byou\b/gi, to: "ya" },
      { from: /\bmy\b/gi, to: "mah" },
      { from: /\bsomething\b/gi, to: "somethin'" },
      { from: /\bnothing\b/gi, to: "nothin'" },
      { from: /\beverything\b/gi, to: "everythin'" },
    ],
  },
  "british-rp": {
    id: "british-rp",
    label: "British RP",
    genre_frame: "British Received Pronunciation vocal tradition, classic English pop style",
    negative_gates: "not American country, not Southern, not Celtic, not Australian",
    phonetic_descriptors: "non-rhotic R, clipped consonants, received pronunciation vowels, even phrase-final intonation, precise diction, restrained vibrato, mid-room presence",
    reinforcement_descriptors: "non-rhotic R, clipped consonants, received pronunciation vowels, precise diction, restrained vibrato",
    summary: "British RP — non-rhotic R, clipped consonants, precise received pronunciation",
    dialect_substitutions: [
      { from: /\bgonna\b/gi, to: "going to" },
      { from: /\bwanna\b/gi, to: "want to" },
      { from: /\bgotta\b/gi, to: "got to" },
      { from: /\bain't\b/gi, to: "isn't" },
      { from: /\by'all\b/gi, to: "you all" },
      { from: /\bcool\b/gi, to: "brilliant" },
      { from: /\bawesome\b/gi, to: "splendid" },
    ],
  },
  "bossa-nova": {
    id: "bossa-nova",
    label: "Bossa Nova / Brazilian",
    genre_frame: "Brazilian bossa nova tradition, Rio vocal style",
    negative_gates: "not flamenco, not tango, not American country, not rock",
    phonetic_descriptors: "soft sibilant S, open vowels, nasal resonance on final syllables, gentle rhythmic lilt, intimate breathy tone, minimal vibrato, close-mic warmth",
    reinforcement_descriptors: "soft sibilant S, open vowels, nasal resonance, gentle rhythmic lilt, intimate breathy tone",
    summary: "Bossa Nova/Brazilian — soft sibilants, nasal resonance, gentle rhythmic lilt",
    dialect_substitutions: [
      { from: /\blove\b/gi, to: "amor" },
      { from: /\bheart\b/gi, to: "coração" },
      { from: /\bnight\b/gi, to: "noite" },
      { from: /\bday\b/gi, to: "dia" },
      { from: /\bsea\b/gi, to: "mar" },
      { from: /\bsky\b/gi, to: "céu" },
      { from: /\bsun\b/gi, to: "sol" },
      { from: /\bbeautiful\b/gi, to: "linda" },
      { from: /\byes\b/gi, to: "sim" },
    ],
  },
  "jazz-american": {
    id: "jazz-american",
    label: "Jazz (American)",
    genre_frame: "American jazz vocal tradition, intimate club style",
    negative_gates: "not country, not rock, not gospel choir, not pop",
    phonetic_descriptors: "behind-the-beat phrasing, scooped note entries, breathy tone with chest resonance, subtle pitch bends, conversational delivery, close-mic intimacy, minimal vibrato except on sustained notes",
    reinforcement_descriptors: "behind-the-beat phrasing, scooped note entries, breathy chest tone, subtle pitch bends, conversational delivery",
    summary: "Jazz American — behind-the-beat phrasing, scooped entries, conversational intimacy",
    dialect_substitutions: [
      { from: /\bsomething\b/gi, to: "somethin'" },
      { from: /\bnothing\b/gi, to: "nothin'" },
      { from: /\bsinging\b/gi, to: "singin'" },
      { from: /\bswinging\b/gi, to: "swingin'" },
      { from: /\bwalking\b/gi, to: "walkin'" },
      { from: /\btalking\b/gi, to: "talkin'" },
    ],
  },
  "country-americana": {
    id: "country-americana",
    label: "Country / Americana",
    genre_frame: "American country and Americana tradition, heartland vocal style",
    negative_gates: "not Celtic, not British, not jazz, not bossa nova",
    phonetic_descriptors: "Southern vowel shift, twangy nasal resonance, dropped final G's, melismatic country bends, chest-forward tone, conversational storytelling delivery",
    reinforcement_descriptors: "Southern vowel shift, twangy nasal resonance, dropped final G's, country bends, chest-forward storytelling",
    summary: "Country/Americana — Southern twang, dropped G's, storytelling delivery",
    dialect_substitutions: [
      { from: /\bgoing\b/gi, to: "goin'" },
      { from: /\bsinging\b/gi, to: "singin'" },
      { from: /\brunning\b/gi, to: "runnin'" },
      { from: /\bsomething\b/gi, to: "somethin'" },
      { from: /\bnothing\b/gi, to: "nothin'" },
      { from: /\byou all\b/gi, to: "y'all" },
      { from: /\bwant to\b/gi, to: "wanna" },
      { from: /\bgoing to\b/gi, to: "gonna" },
    ],
  },
};

const REGISTER_LABEL: Record<AccentVocalPromptOptions["register"], string> = {
  "bass-male": "bass male Vocal",
  "mezzo-soprano-female": "mezzo-soprano female Vocal",
  "tenor-male": "tenor male Vocal",
  "soprano-female": "soprano female Vocal",
};

// ─── Structural Fingerprint Utilities ────────────────────────────────────────

export function parseStructureBlock(structureBlock: string, bpm = 120): StructureFingerprint {
  const sections: StructureSection[] = [];
  const labelMap: Record<string, string> = {
    intro: "intro", verse: "verse", chorus: "chorus",
    bridge: "bridge", outro: "outro", "pre-chorus": "pre-chorus",
    hook: "chorus", refrain: "chorus",
  };
  const sectionPattern = /([A-Za-z][A-Za-z\s]*?)\s+(\d+)\s+bars?/gi;
  let match;
  while ((match = sectionPattern.exec(structureBlock)) !== null) {
    const rawLabel = match[1].trim().toLowerCase().replace(/\s*\d+$/, "").trim();
    const bars = parseInt(match[2], 10);
    const label = labelMap[rawLabel] ?? rawLabel;
    sections.push({ label, bars });
  }
  if (sections.length === 0) {
    sections.push(
      { label: "intro", bars: 8 }, { label: "verse", bars: 16 },
      { label: "chorus", bars: 16 }, { label: "verse", bars: 16 },
      { label: "chorus", bars: 16 }, { label: "outro", bars: 8 }
    );
  }
  const total_bars = sections.reduce((sum, s) => sum + s.bars, 0);
  const section_sequence = sections.map(s => s.label).join("-");
  const shape_hash = sections.map(s => `${s.label[0].toUpperCase()}${s.bars}`).join("-");
  return { bpm, time_signature: "4/4", total_bars, sections, section_sequence, shape_hash };
}

export function buildStructureBlockFromFingerprint(fp: StructureFingerprint): string {
  return fp.sections
    .map((s, i) => {
      const label = s.label.charAt(0).toUpperCase() + s.label.slice(1);
      const sameLabel = fp.sections.filter((x, j) => x.label === s.label && j < i).length;
      const suffix = fp.sections.filter(x => x.label === s.label).length > 1 ? ` ${sameLabel + 1}` : "";
      return `${label}${suffix} ${s.bars} bars`;
    })
    .join(", ");
}

// ─── Dialect Substitution ─────────────────────────────────────────────────────

export function applyDialectSubstitutions(lyrics: string, accentProfileId: string): string {
  const profile = ACCENT_PROFILES[accentProfileId];
  if (!profile) return lyrics;
  let result = lyrics;
  for (const sub of profile.dialect_substitutions) {
    result = result.replace(sub.from as RegExp, sub.to);
  }
  return result;
}

export function getAccentSummary(accentProfileId: string): string | null {
  return ACCENT_PROFILES[accentProfileId]?.summary ?? null;
}

export function getAccentProfiles() {
  return Object.values(ACCENT_PROFILES).map(p => ({
    id: p.id,
    label: p.label,
    summary: p.summary,
    genre_frame: p.genre_frame,
  }));
}

// ─── Three-Signal Prompt Assembler ───────────────────────────────────────────

export function buildAccentVocalPrompt(
  options: AccentVocalPromptOptions
): { prompt: string; structureBlock: string } {
  const profile = ACCENT_PROFILES[options.accentProfileId];
  if (!profile) throw new Error(`Unknown accent profile: ${options.accentProfileId}`);

  const registerLabel = REGISTER_LABEL[options.register];
  const bpm = options.bpm ?? 108;
  const atmosphere = options.atmosphere ?? "intimate studio atmosphere";

  let structureBlock: string;
  if (options.structureFingerprint) {
    structureBlock = buildStructureBlockFromFingerprint(options.structureFingerprint);
  } else {
    structureBlock = "Intro 8 bars sparse, Verse 1 16 bars melodic phrasing, Chorus 16 bars full energy, Verse 2 16 bars variation, Chorus 16 bars repeat, Bridge 8 bars dynamic build, Outro 8 bars fade";
  }

  const prompt = [
    `${profile.genre_frame}, ${profile.negative_gates}.`,
    `Lead Instrument: ${registerLabel} — ${profile.phonetic_descriptors}.`,
    `Role: primary melodic carrier over ${bpm} BPM rhythm, ${atmosphere}.`,
    `Strict structure: ${structureBlock}.`,
    `${registerLabel}: ${profile.reinforcement_descriptors}.`,
  ].join(" ");

  return { prompt, structureBlock };
}
