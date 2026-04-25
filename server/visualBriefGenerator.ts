/**
 * Visual Brief Generator
 *
 * Applies the Music + Visual Stickiness Master Formula (Chapter 9 of the
 * Strawberry Riff Music Prompt Bible) to derive a cinematic visual brief
 * from a completed music generation's prompt, lyrics, and metadata.
 *
 * Output is a structured JSON object suitable for display on generation cards
 * and for export to external video generation tools (Runway, Kling, Sora, etc.).
 */

import { invokeLLM } from "./_core/llm";

export interface VisualBrief {
  /** Camera movement and framing direction */
  camera: string;
  /** Lighting mood, key/fill balance, and beat-sync notes */
  lighting: string;
  /** 3–4 color palette descriptors with hex hints */
  colorPalette: string[];
  /** Avatar or performer emotional arc across song sections */
  emotionArc: string;
  /** Scene / environment suggestion */
  scene: string;
  /** One-line video director's note summarising the visual concept */
  directorNote: string;
  /** Recommended video pacing (e.g. "slow burn", "rapid-cut", "mid-tempo") */
  pacing: string;
}

const SYSTEM_PROMPT = `You are a cinematic music video director and visual strategist. 
You apply the Music + Visual Stickiness Master Formula to derive precise, actionable visual briefs from music descriptions.

Your output must be a JSON object with EXACTLY these fields:
{
  "camera": "string — specific camera movement, shot type, and framing (e.g. 'Slow dolly-in, medium close-up, shallow depth of field, slight Dutch tilt on chorus')",
  "lighting": "string — key light quality, fill ratio, color temperature, and beat-sync behaviour (e.g. 'Warm amber key at 45°, soft diffused fill, pulse on kick drum, cool rim light on chorus')",
  "colorPalette": ["3-4 strings, each a color descriptor with a hex code hint, e.g. 'Burnt sienna (#8B4513)', 'Deep teal (#008080)'"],
  "emotionArc": "string — avatar/performer emotional journey mapped to song sections (e.g. 'Verse: introspective, eyes down; Pre-chorus: building tension, slow head raise; Chorus: euphoric release, open arms')",
  "scene": "string — specific environment, time of day, textures, and props (e.g. 'Candlelit recording studio, 2am, rain on glass, vintage equipment, scattered lyric sheets')",
  "directorNote": "string — one punchy sentence summarising the overall visual concept (e.g. 'A late-night confessional bathed in amber warmth — intimacy over spectacle')",
  "pacing": "string — one of: slow burn | mid-tempo | rapid-cut | pulse-sync | freeform"
}

Rules:
- Be specific and cinematic, not generic. Avoid "upbeat" or "emotional" without concrete visual details.
- Derive everything from the music's genre, tempo feel, lyrical themes, and emotional arc.
- Color palette must have exactly 3-4 items, each with a descriptive name and hex hint.
- Keep each field concise but vivid — this is a working creative brief, not a poem.
- Return ONLY valid JSON, no markdown, no explanation.`;

export async function generateVisualBrief(params: {
  prompt: string;
  lyrics: string;
  title: string;
}): Promise<VisualBrief> {
  const userMessage = `Generate a visual brief for this music track:

TITLE: ${params.title}

MUSIC PROMPT (genre, style, instruments, mood):
${params.prompt}

LYRICS:
${params.lyrics.substring(0, 1500)}${params.lyrics.length > 1500 ? "\n[...truncated]" : ""}

Apply the Music + Visual Stickiness Master Formula to produce a precise cinematic visual brief.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "visual_brief",
        strict: true,
        schema: {
          type: "object",
          properties: {
            camera: { type: "string", description: "Camera movement and framing direction" },
            lighting: { type: "string", description: "Lighting mood and beat-sync notes" },
            colorPalette: {
              type: "array",
              items: { type: "string" },
              description: "3-4 color descriptors with hex hints",
            },
            emotionArc: { type: "string", description: "Avatar emotional arc across song sections" },
            scene: { type: "string", description: "Scene and environment suggestion" },
            directorNote: { type: "string", description: "One-line director's concept note" },
            pacing: { type: "string", description: "Video pacing style" },
          },
          required: ["camera", "lighting", "colorPalette", "emotionArc", "scene", "directorNote", "pacing"],
          additionalProperties: false,
        },
      },
    },
  });

  const rawContent = response.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error("LLM returned empty response for visual brief");
  }
  const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

  const parsed = JSON.parse(content) as VisualBrief;

  // Validate required fields
  if (!parsed.camera || !parsed.lighting || !parsed.colorPalette || !parsed.emotionArc || !parsed.scene || !parsed.directorNote || !parsed.pacing) {
    throw new Error("Visual brief response missing required fields");
  }

  // Ensure colorPalette is an array
  if (!Array.isArray(parsed.colorPalette)) {
    parsed.colorPalette = [String(parsed.colorPalette)];
  }

  return parsed;
}
