/**
 * Prompt template system for MiniMax Music 2.5
 * Provides intensity levels and refinement modifiers as SEPARATE guidance,
 * not concatenated to the prompt (to avoid exceeding 1000 char limit).
 */

export type IntensityLevel = "subtle" | "balanced" | "aggressive";
export type RefinementType = "more_aggressive" | "less_busy" | "different_vibe";

// Intensity level guidance (used as system context, not appended to prompt)
const INTENSITY_GUIDANCE: Record<IntensityLevel, string> = {
  subtle:
    "Gentle and minimal arrangement, focus on vocals and melody, sparse instrumentation, intimate feel",
  balanced:
    "Clear vocals with steady rhythm, balanced mix of instruments, moderate energy, well-structured arrangement",
  aggressive:
    "Bold and prominent arrangement, energetic drums and bass, powerful vocals, dynamic instrumentation",
};

// Refinement guidance (used as system context, not appended to prompt)
const REFINEMENT_GUIDANCE: Record<RefinementType, string> = {
  more_aggressive:
    "Increase intensity with heavier drums, prominent bass, and bolder arrangement",
  less_busy:
    "Simplify the arrangement, reduce instrumentation, focus on vocals and core melody",
  different_vibe:
    "Completely different mood and style, fresh approach to the arrangement",
};

/**
 * Get intensity guidance for system message
 * This is passed separately, not concatenated to the user prompt
 */
export function getIntensityGuidance(intensity: IntensityLevel): string {
  return INTENSITY_GUIDANCE[intensity];
}

/**
 * Get refinement guidance for system message
 * This is passed separately, not concatenated to the user prompt
 */
export function getRefinementGuidance(refinement: RefinementType): string {
  return REFINEMENT_GUIDANCE[refinement];
}

/**
 * Build a system message that combines intensity and optional refinement
 * This is sent as context to the AI, not as part of the user prompt
 */
export function buildSystemMessage(
  intensity: IntensityLevel,
  refinement?: RefinementType
): string {
  let message = `You are a music generation AI. Generate music with the following guidance:\n\nIntensity: ${getIntensityGuidance(intensity)}`;

  if (refinement) {
    message += `\n\nRefinement: ${getRefinementGuidance(refinement)}`;
  }

  return message;
}

/**
 * Get all available intensity levels for UI dropdown
 */
export function getIntensityLevels(): Array<{
  value: IntensityLevel;
  label: string;
  description: string;
}> {
  return [
    {
      value: "subtle",
      label: "Subtle",
      description: "Gentle, minimal, intimate",
    },
    {
      value: "balanced",
      label: "Balanced",
      description: "Clear, steady, well-structured",
    },
    {
      value: "aggressive",
      label: "Aggressive",
      description: "Bold, energetic, dynamic",
    },
  ];
}

/**
 * Get all available refinement options for UI buttons
 */
export function getRefinementOptions(): Array<{
  type: RefinementType;
  label: string;
  icon: string;
}> {
  return [
    { type: "more_aggressive", label: "More Aggressive", icon: "⚡" },
    { type: "less_busy", label: "Less Busy", icon: "🎯" },
    { type: "different_vibe", label: "Different Vibe", icon: "🔄" },
  ];
}
