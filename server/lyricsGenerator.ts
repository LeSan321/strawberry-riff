/**
 * Strawberry Riff Lyrics Generator
 * Powered by the Writer's Bible — Version 1.0
 * Uses the 5-Layer Writer's Formula to construct prompts for invokeLLM
 */

import { invokeLLM } from "./_core/llm";

// ─── Writer's Bible System Prompt ─────────────────────────────────────────────
export const WRITERS_BIBLE_SYSTEM_PROMPT = `You are the Strawberry Riff Lyrics Generator, a masterful AI songwriter powered by MiniMax Music 2.5. Your core mission is to create sticky, earworm lyrics that make users say "whoa, listen to this" — infusing every song with replayability, emotional depth, and fusion-genre freshness.

STICKINESS PRINCIPLES (apply to every generation):
- Use Zeigarnik tension for cognitive loops: set up questions in verses, resolve in chorus
- Use sensory specifics over abstracts: "salt in the cut" not "pain"; "dusty boots on gravel" not "sadness"
- Use strategic repetition for mere-exposure: 3–4 varied chorus loops with subtle evolution
- Engineer semantic surprises in hooks for dopamine hits: puns, subverted expectations, double meanings
- Build tension-release arcs for catharsis: small intimate verses, explosive anthemic choruses

SINGABILITY RULES (critical for AI vocal synthesis):
- Favor open vowels (ah, oh, ay, ee) in stressed syllables
- Avoid consonant clusters of 3+ consonants (e.g., "strengths," "twelfths," "this thistle")
- Maintain even syllable flow: 6–10 syllables per line for verses, 8–12 for choruses
- Avoid plosive-heavy starts on high notes (b, p, d, t at phrase starts)
- Never end lines with voiced fricatives (z, v) — they blur in AI synthesis

STRUCTURE RULES:
- Use reliable tags: [Verse 1], [Chorus], [Bridge], [Outro] as minimum
- Dynamic contrast: verses are small/intimate, choruses are big/anthemic
- Bridge must reframe the narrative (Revelation, Escalation, Contrast, or Philosophical)
- Outro must be intentional: callback, open question, or transformation — never abrupt cut
- Advanced tags ([Build], [Drop], [Vamp], [Coda], [Refrain], [Tag]) only when genre-appropriate, always with descriptive reinforcement

CRAFT TECHNIQUES (use at least 2 per generation):
- Motif development: plant a word/image in Verse 1, transform it through Bridge, resolve in Outro
- Perspective shifts: first-person verse → second-person chorus for empathetic reframing
- Callback and payoff: set up in Verse 1, pay off in final chorus or Outro
- Metaphor chains: sustain a single metaphor across sections, evolving not repeating
- Dynamic contrast: sparse verse lines (6 syllables) vs. dense chorus lines (12 syllables)

FAILURE MODES TO AVOID:
- Generic emotion trap: never use "love," "pain," "heart," "soul" without sensory grounding
- Forced rhymes: never use filler like "from the start," "deep in my heart," "know it's true"
- AI robot tells: avoid perfect grammar, over-explaining, too-neat rhymes — add fragments, slang, ellipses
- Energy mismatch: always match lyric energy to the specified mood
- Phonetic traps: avoid "strengths," "sixths," "twelfths," "this thistle," "rural," "squirrel"

OUTPUT FORMAT:
1. Full lyrics with structure tags (e.g., [Verse 1], [Chorus], [Bridge], [Outro])
2. A brief "Stickiness Analysis" (3–5 sentences) explaining what makes these lyrics work
3. Optional refinement suggestions (1–2 specific improvements the user could request)

Keep total lyrics to 200–300 words unless the user specifies otherwise. Be creative, specific, and fusion-authentic — every lyric should feel like it could only exist in this genre blend.`;

// ─── Writing Team Personas ─────────────────────────────────────────────────────
export const WRITING_TEAM = {
  "Hook Master": "Act as the Hook Master: Generate a sticky chorus with multisyllabic rhymes and semantic surprise for unapologetic replay value. Prioritize the hook above all else.",
  "Story Weaver": "Act as the Story Weaver: Develop a verse narrative with perspective shifts and callback setup. Build a folk tale with specific characters, places, and moments.",
  "Poet Visionary": "Act as the Poet Visionary: Layer sensory metaphors and vivid introspection, balancing specific imagery with universal appeal. Prioritize beauty of language.",
  "Tone Shifter": "Act as the Tone Shifter: Engineer dynamic contrast and emotional pivots. Make verses feel intimate and choruses feel explosive. Master the tension-release arc.",
  "Polish Editor": "Act as the Polish Editor: Refine for singability, flow, and phonetic smoothness. Kill forced rhymes, ensure even syllable counts, and eliminate AI robot tells.",
} as const;

export type WritingTeamMember = keyof typeof WRITING_TEAM;

// ─── Structure Templates ───────────────────────────────────────────────────────
export const STRUCTURE_TEMPLATES = {
  "Standard Pop": "[Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Pre-Chorus] [Chorus] [Bridge] [Chorus] [Outro]",
  "Verse-Chorus-Bridge": "[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus] [Outro]",
  "AABA (Tin Pan Alley)": "[Verse 1] [Verse 2] [Bridge] [Verse 3] [Outro]",
  "Electronic/Dance": "[Intro] [Build] [Drop] [Verse] [Build] [Drop] [Outro]",
  "Folk/Narrative": "[Verse 1] [Refrain] [Verse 2] [Refrain] [Bridge] [Verse 3] [Coda]",
  "Jazz/Soul": "[Intro] [Verse 1] [Chorus] [Verse 2] [Chorus] [Vamp] [Outro]",
  "Ballad": "[Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Chorus] [Outro]",
  "Through-Composed": "[Verse 1] [Verse 2] [Verse 3] [Bridge] [Verse 4] [Coda]",
} as const;

export type StructureTemplate = keyof typeof STRUCTURE_TEMPLATES;

// ─── 5-Layer Writer's Formula Input ───────────────────────────────────────────
export interface LyricsGenerationInput {
  // Layer 1 — Fusion and Theme
  fusion: string;          // e.g., "Velvet Strawberry Club (Jazz + Lo-fi + Soul)"
  topic: string;           // e.g., "midnight longing" or "self-discovery after heartbreak"

  // Layer 2 — Mood and Emotion
  mood: string;            // e.g., "smoky introspective" or "euphoric chaotic"
  emotionalFeeling?: string; // e.g., "sultry vulnerability" or "explosive joy"

  // Layer 3 — Structure and Flow
  structure: string;       // e.g., "[Verse 1] [Chorus] [Bridge] [Outro]"
  flowStyle?: string;      // e.g., "melismatic glide" or "dense rhythmic"

  // Layer 4 — Craft Technique
  writingTeam?: WritingTeamMember;
  craftNotes?: string;     // e.g., "motif development: transform 'winding road'"

  // Layer 5 — Constraints and Refinement
  perspective?: string;    // e.g., "first-person" or "second-person"
  hookSeed?: string;       // e.g., "something about chasing neon lights"
  constraints?: string;    // e.g., "avoid 'blue moon'; more tender tone; 200 words"
}

// ─── Build the user prompt from 5-Layer Formula ───────────────────────────────
export function buildLyricsPrompt(input: LyricsGenerationInput): string {
  const parts: string[] = [];

  // Layer 1
  parts.push(`Generate lyrics for a ${input.fusion} song about ${input.topic}.`);

  // Layer 3 — Structure first (broad to narrow)
  parts.push(`Structure as: ${input.structure}.`);

  // Layer 2 — Mood and emotion
  const emotionDesc = input.emotionalFeeling
    ? `${input.mood} mood with ${input.emotionalFeeling} emotional feeling`
    : `${input.mood} mood`;
  parts.push(`Tone: ${emotionDesc}.`);

  // Layer 3 — Flow style
  if (input.flowStyle) {
    parts.push(`Flow style: ${input.flowStyle}.`);
  }

  // Layer 4 — Craft techniques
  if (input.craftNotes) {
    parts.push(`Craft techniques: ${input.craftNotes}.`);
  }

  // Layer 4 — Writing team persona
  if (input.writingTeam && WRITING_TEAM[input.writingTeam]) {
    parts.push(WRITING_TEAM[input.writingTeam]);
  }

  // Layer 5 — Perspective
  if (input.perspective) {
    parts.push(`Narrative perspective: ${input.perspective}.`);
  }

  // Layer 5 — Hook seed
  if (input.hookSeed) {
    parts.push(`Hook seed / title anchor: "${input.hookSeed}".`);
  }

  // Layer 5 — Constraints
  if (input.constraints) {
    parts.push(`Constraints: ${input.constraints}.`);
  }

  // Stickiness signals (always included)
  parts.push(
    "Incorporate earworm repetition with 3–4 varied chorus loops. " +
    "Engineer semantic surprise in the hook. " +
    "Use motif callbacks in the Outro for Zeigarnik resolution. " +
    "Avoid generic emotions — use sensory specifics throughout."
  );

  return parts.join(" ");
}

// ─── Strip AI conversational preamble ────────────────────────────────────────
/**
 * Remove any conversational intro the LLM prepends before the actual lyrics,
 * e.g. "Here are your hip-hop lyrics with a funky beat:\n\n[Verse 1]..."
 * Strategy: if the text contains a section marker like [Verse], [Chorus] etc.
 * strip everything before the first such marker.
 * If no section markers exist, strip leading prose lines that look like
 * AI commentary (ending with colon, or starting with known preamble phrases).
 */
export function stripAIPreamble(text: string): string {
  const sectionMarkerRe = /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Hook|Drop|Build|Refrain|Coda|Vamp|Interlude|Tag)/i;
  const markerIndex = text.search(sectionMarkerRe);
  if (markerIndex > 0) {
    return text.slice(markerIndex).trim();
  }
  // No section markers — strip leading prose lines
  const lines = text.split("\n");
  let startIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { startIdx = i + 1; continue; }
    const isProse = /[:]$/.test(line) ||
      /^(here are|here'?s|below (are|is)|sure[,!]|of course|certainly|i'?ve (written|created|crafted)|these are|the following|absolutely|great choice|let me)/i.test(line);
    if (isProse) { startIdx = i + 1; continue; }
    break;
  }
  return lines.slice(startIdx).join("\n").trim();
}

// ─── Main generation function ─────────────────────────────────────────────────
export async function generateLyrics(input: LyricsGenerationInput): Promise<{
  lyrics: string;
  stickinessAnalysis: string;
  fullResponse: string;
}> {
  const userPrompt = buildLyricsPrompt(input);

  const response = await invokeLLM({
    messages: [
      { role: "system", content: WRITERS_BIBLE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const fullResponse: string =
    typeof response.choices[0]?.message?.content === "string"
      ? response.choices[0].message.content
      : "";

  // Parse out the stickiness analysis section if present
  const stickinessMatch = fullResponse.match(
    /\*{0,2}Stickiness Analysis\*{0,2}[:\s]+([\s\S]+?)(?:\n\n|\*{0,2}Refinement|$)/i
  );
  const stickinessAnalysis = stickinessMatch
    ? stickinessMatch[1].trim()
    : "";

  // Extract just the lyrics (everything before "Stickiness Analysis")
  const lyricsMatch = fullResponse.match(
    /^([\s\S]+?)(?:\n\n\*{0,2}Stickiness Analysis|\n\n---)/i
  );
  const rawLyrics = lyricsMatch
    ? lyricsMatch[1].trim()
    : fullResponse.trim();

  // Strip any AI conversational preamble before the actual lyrics
  const lyrics = stripAIPreamble(rawLyrics);

  return { lyrics, stickinessAnalysis, fullResponse };
}
