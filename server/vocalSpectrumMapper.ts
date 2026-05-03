/**
 * Vocal Spectrum Mapper
 * Maps vocal archetype presets to spectrum axes with left/right endpoints
 * Spectrum value ranges from 0-100:
 *   0 = left endpoint (e.g., "Smooth Soaring")
 *   50 = middle (balanced)
 *   100 = right endpoint (e.g., "Gritty Belting")
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

export interface SpectrumAxis {
  leftEndpoint: string;
  rightEndpoint: string;
  description: string;
}

export const vocalSpectrumAxes: Record<VocalArchetype, SpectrumAxis> = {
  "intimate-bedroom": {
    leftEndpoint: "Breathy Vulnerable",
    rightEndpoint: "Raspy Intimate",
    description:
      "From delicate, breathy vulnerability (Bon Iver) to raw, intimate rasp (early Jeff Buckley)",
  },
  "raw-emotional": {
    leftEndpoint: "Controlled Vulnerability",
    rightEndpoint: "Unfiltered Raw",
    description:
      "From controlled emotional delivery to completely unpolished, honest rawness",
  },
  "soulful-belter": {
    leftEndpoint: "Controlled Runs",
    rightEndpoint: "Raw Emotional",
    description:
      "From precise, controlled runs (Aretha Franklin) to raw, emotional delivery (Amy Winehouse)",
  },
  "gritty-rock": {
    leftEndpoint: "Strained Energy",
    rightEndpoint: "Aggressive Growl",
    description:
      "From strained, energetic delivery to full aggressive growl and distortion",
  },
  "confident-pop": {
    leftEndpoint: "Polished Smooth",
    rightEndpoint: "Attitude Swagger",
    description:
      "From polished, produced smoothness to confident swagger and attitude",
  },
  "lo-fi-whisper": {
    leftEndpoint: "Intimate Whisper",
    rightEndpoint: "Textured Imperfect",
    description:
      "From intimate, barely-there whisper to textured, imperfect pitch character",
  },
  "powerful-anthem": {
    leftEndpoint: "Smooth Soaring",
    rightEndpoint: "Gritty Belting",
    description:
      "From smooth, soaring stadium voice (Steve Perry) to gritty, belting power (Robert Plant)",
  },
  "storyteller-folk": {
    leftEndpoint: "Conversational Natural",
    rightEndpoint: "Dramatic Storyteller",
    description:
      "From conversational, natural phrasing to dramatic, theatrical storytelling",
  },
};

/**
 * Map spectrum value (0-100) to vocal guidance text
 * 0 = left endpoint, 50 = middle, 100 = right endpoint
 */
export function mapSpectrumToGuidance(
  archetype: VocalArchetype,
  spectrumValue: number
): string {
  const axis = vocalSpectrumAxes[archetype];
  if (!axis) return "";

  // Clamp value to 0-100
  const clamped = Math.max(0, Math.min(100, spectrumValue));

  // Generate guidance based on position on spectrum
  if (clamped < 25) {
    return `Lean toward ${axis.leftEndpoint.toLowerCase()}`;
  } else if (clamped < 50) {
    return `Slightly favor ${axis.leftEndpoint.toLowerCase()}`;
  } else if (clamped === 50) {
    return `Balance between ${axis.leftEndpoint.toLowerCase()} and ${axis.rightEndpoint.toLowerCase()}`;
  } else if (clamped < 75) {
    return `Slightly favor ${axis.rightEndpoint.toLowerCase()}`;
  } else {
    return `Lean toward ${axis.rightEndpoint.toLowerCase()}`;
  }
}

/**
 * Get spectrum axis for a vocal archetype
 */
export function getSpectrumAxis(archetype: VocalArchetype): SpectrumAxis {
  return vocalSpectrumAxes[archetype];
}

/**
 * Get all spectrum axes (for UI rendering)
 */
export function getAllSpectrumAxes(): Record<VocalArchetype, SpectrumAxis> {
  return vocalSpectrumAxes;
}

/**
 * Validate spectrum value is in valid range
 */
export function isValidSpectrumValue(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 100;
}
