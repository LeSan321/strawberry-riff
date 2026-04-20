/**
 * Prompt template system for MiniMax Music 2.5
 * Uses brief prefixes to guide intensity and refinement.
 * MiniMax API does not support a separate system parameter,
 * so we prepend guidance as a short tag to keep prompts under 1000 chars.
 */

export type IntensityLevel = "subtle" | "balanced" | "aggressive";
export type RefinementType = "more_aggressive" | "less_busy" | "different_vibe";

// Brief prefixes to prepend to prompts (20-30 chars each)
const INTENSITY_PREFIXES: Record<IntensityLevel, string> = {
  subtle: "[subtle] ",
  balanced: "[balanced] ",
  aggressive: "[aggressive] ",
};

const REFINEMENT_PREFIXES: Record<RefinementType, string> = {
  more_aggressive: "[more-aggressive] ",
  less_busy: "[less-busy] ",
  different_vibe: "[different-vibe] ",
};

/**
 * Build a prompt with intensity prefix
 * Prepends a brief tag like "[subtle]" to guide the model
 */
export function buildPromptWithIntensity(
  userPrompt: string,
  intensity: IntensityLevel
): string {
  const prefix = INTENSITY_PREFIXES[intensity];
  return `${prefix}${userPrompt}`;
}

/**
 * Build a prompt with intensity and optional refinement prefixes
 * Used when regenerating with refinement
 */
export function buildPromptWithRefinement(
  userPrompt: string,
  intensity: IntensityLevel,
  refinement: RefinementType
): string {
  const intensityPrefix = INTENSITY_PREFIXES[intensity];
  const refinementPrefix = REFINEMENT_PREFIXES[refinement];
  return `${intensityPrefix}${refinementPrefix}${userPrompt}`;
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
