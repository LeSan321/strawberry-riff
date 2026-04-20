import { describe, it, expect } from "vitest";
import {
  buildPromptFromIntensity,
  applyRefinement,
  getIntensityLevels,
  getRefinementOptions,
} from "./promptTemplates";

describe("promptTemplates", () => {
  describe("buildPromptFromIntensity", () => {
    it("should return just the template when no base prompt provided", () => {
      const result = buildPromptFromIntensity("subtle");
      expect(result).toContain("Gentle");
      expect(result).toContain("minimal");
    });

    it("should combine base prompt with subtle intensity", () => {
      const result = buildPromptFromIntensity("subtle", "jazz piano");
      expect(result).toContain("jazz piano");
      expect(result).toContain("Gentle");
      expect(result).toContain("minimal");
    });

    it("should combine base prompt with balanced intensity", () => {
      const result = buildPromptFromIntensity("balanced", "rock guitar");
      expect(result).toContain("rock guitar");
      expect(result).toContain("Clear vocals");
      expect(result).toContain("steady rhythm");
    });

    it("should combine base prompt with aggressive intensity", () => {
      const result = buildPromptFromIntensity("aggressive", "electronic drums");
      expect(result).toContain("electronic drums");
      expect(result).toContain("Bold");
      expect(result).toContain("energetic");
    });
  });

  describe("applyRefinement", () => {
    const basePrompt = "acoustic folk guitar, 90 BPM, melancholic";

    it("should apply more_aggressive refinement", () => {
      const result = applyRefinement(basePrompt, "more_aggressive");
      expect(result).toContain(basePrompt);
      expect(result).toContain("heavier drums");
      expect(result).toContain("prominent bass");
    });

    it("should apply less_busy refinement", () => {
      const result = applyRefinement(basePrompt, "less_busy");
      expect(result).toContain(basePrompt);
      expect(result).toContain("Simplify");
      expect(result).toContain("vocals");
    });

    it("should apply different_vibe refinement", () => {
      const result = applyRefinement(basePrompt, "different_vibe");
      expect(result).toContain(basePrompt);
      expect(result).toContain("Completely different");
      expect(result).toContain("fresh approach");
    });
  });

  describe("getIntensityLevels", () => {
    it("should return all three intensity levels", () => {
      const levels = getIntensityLevels();
      expect(levels).toHaveLength(3);
      expect(levels.map((l) => l.value)).toEqual(["subtle", "balanced", "aggressive"]);
    });

    it("should include descriptive labels for each level", () => {
      const levels = getIntensityLevels();
      const subtle = levels.find((l) => l.value === "subtle");
      expect(subtle?.label).toBe("Subtle");
      expect(subtle?.description).toContain("Gentle");
    });
  });

  describe("getRefinementOptions", () => {
    it("should return all three refinement options", () => {
      const options = getRefinementOptions();
      expect(options).toHaveLength(3);
      expect(options.map((o) => o.type)).toEqual([
        "more_aggressive",
        "less_busy",
        "different_vibe",
      ]);
    });

    it("should include icons and labels for each option", () => {
      const options = getRefinementOptions();
      const moreAggressive = options.find((o) => o.type === "more_aggressive");
      expect(moreAggressive?.label).toBe("More Aggressive");
      expect(moreAggressive?.icon).toBe("⚡");
    });
  });
});
