import { describe, it, expect } from "vitest";
import {
  buildPromptWithIntensity,
  buildPromptWithRefinement,
  getIntensityLevels,
  getRefinementOptions,
} from "./promptTemplates";

describe("promptTemplates", () => {
  describe("buildPromptWithIntensity", () => {
    it("should prepend subtle prefix to prompt", () => {
      const result = buildPromptWithIntensity("test prompt", "subtle");
      expect(result).toBe("[subtle] test prompt");
    });

    it("should prepend balanced prefix to prompt", () => {
      const result = buildPromptWithIntensity("test prompt", "balanced");
      expect(result).toBe("[balanced] test prompt");
    });

    it("should prepend aggressive prefix to prompt", () => {
      const result = buildPromptWithIntensity("test prompt", "aggressive");
      expect(result).toBe("[aggressive] test prompt");
    });

    it("should keep prompt under 1000 chars with prefix", () => {
      const longPrompt = "a".repeat(980);
      const result = buildPromptWithIntensity(longPrompt, "subtle");
      expect(result.length).toBeLessThan(1000);
    });
  });

  describe("buildPromptWithRefinement", () => {
    it("should prepend both intensity and refinement prefixes", () => {
      const result = buildPromptWithRefinement(
        "test prompt",
        "balanced",
        "more_aggressive"
      );
      expect(result).toBe("[balanced] [more-aggressive] test prompt");
    });

    it("should handle different refinement types", () => {
      const result1 = buildPromptWithRefinement(
        "test",
        "subtle",
        "less_busy"
      );
      expect(result1).toBe("[subtle] [less-busy] test");

      const result2 = buildPromptWithRefinement(
        "test",
        "aggressive",
        "different_vibe"
      );
      expect(result2).toBe("[aggressive] [different-vibe] test");
    });

    it("should keep prompt under 1000 chars even with multiple prefixes", () => {
      const longPrompt = "a".repeat(970);
      const result = buildPromptWithRefinement(
        longPrompt,
        "balanced",
        "more_aggressive"
      );
      expect(result.length).toBeLessThan(1000);
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
