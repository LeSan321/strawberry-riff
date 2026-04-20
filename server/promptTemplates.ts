/**
 * Prompt template system for MiniMax Music 2.5
 * Provides intensity levels and refinement modifiers to guide generation
 */

export type IntensityLevel = "subtle" | "balanced" | "aggressive";
export type RefinementType = "more_aggressive" | "less_busy" | "different_vibe";

// Intensity level base prompts
const INTENSITY_TEMPLATES: Record<IntensityLevel, string> = {
  subtle:
    "Gentle and minimal arrangement, focus on vocals and melody, sparse instrumentation, intimate feel",
  balanced:
    "Clear vocals with steady rhythm, balanced mix of instruments, moderate energy, well-structured arrangement",
  aggressive:
    "Bold and prominent arrangement, energetic drums and bass, powerful vocals, dynamic instrumentation",
};

// Refinement modifiers that can be appended to a prompt
const REFINEMENT_MODIFIERS: Record<RefinementType, string> = {
  more_aggressive:
    "Increase intensity with heavier drums, prominent bass, and bolder arrangement",
  less_busy:
    "Simplify the arrangement, reduce instrumentation, focus on vocals and core melody",
  different_vibe:
    "Completely different mood and style, fresh approach to the arrangement",
};

/**
 * Build a prompt from intensity level and optional base prompt
 * If basePrompt is provided, it's combined with the intensity template
 */
export function buildPromptFromIntensity(
  intensity: IntensityLevel,
  basePrompt?: string
): string {
  const template = INTENSITY_TEMPLATES[intensity];
  if (!basePrompt) return template;

  // Combine base prompt with intensity guidance
  return `${basePrompt}. ${template}`;
}

/**
 * Apply a refinement modifier to an existing prompt
 * Used when user clicks "More Aggressive", "Less Busy", etc.
 */
export function applyRefinement(
  originalPrompt: string,
  refinement: RefinementType
): string {
  const modifier = REFINEMENT_MODIFIERS[refinement];
  return `${originalPrompt}. ${modifier}`;
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
