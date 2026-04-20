import { describe, it, expect } from "vitest";
import {
  getIntensityGuidance,
  getRefinementGuidance,
  buildSystemMessage,
  getIntensityLevels,
  getRefinementOptions,
} from "./promptTemplates";

describe("promptTemplates", () => {
  describe("getIntensityGuidance", () => {
    it("should return subtle intensity guidance", () => {
      const guidance = getIntensityGuidance("subtle");
      expect(guidance).toContain("Gentle");
      expect(guidance).toContain("minimal");
    });

    it("should return balanced intensity guidance", () => {
      const guidance = getIntensityGuidance("balanced");
      expect(guidance).toContain("Clear vocals");
      expect(guidance).toContain("steady rhythm");
    });

    it("should return aggressive intensity guidance", () => {
      const guidance = getIntensityGuidance("aggressive");
      expect(guidance).toContain("Bold");
      expect(guidance).toContain("energetic");
    });
  });

  describe("getRefinementGuidance", () => {
    it("should return more_aggressive refinement guidance", () => {
      const guidance = getRefinementGuidance("more_aggressive");
      expect(guidance).toContain("heavier drums");
      expect(guidance).toContain("prominent bass");
    });

    it("should return less_busy refinement guidance", () => {
      const guidance = getRefinementGuidance("less_busy");
      expect(guidance).toContain("Simplify");
      expect(guidance).toContain("vocals");
    });

    it("should return different_vibe refinement guidance", () => {
      const guidance = getRefinementGuidance("different_vibe");
      expect(guidance).toContain("Completely different");
      expect(guidance).toContain("fresh approach");
    });
  });

  describe("buildSystemMessage", () => {
    it("should build system message with intensity only", () => {
      const message = buildSystemMessage("subtle");
      expect(message).toContain("You are a music generation AI");
      expect(message).toContain("Intensity:");
      expect(message).toContain("Gentle");
      expect(message).not.toContain("Refinement:");
    });

    it("should build system message with intensity and refinement", () => {
      const message = buildSystemMessage("balanced", "more_aggressive");
      expect(message).toContain("You are a music generation AI");
      expect(message).toContain("Intensity:");
      expect(message).toContain("Clear vocals");
      expect(message).toContain("Refinement:");
      expect(message).toContain("heavier drums");
    });

    it("should not concatenate guidance to user prompt", () => {
      const message = buildSystemMessage("aggressive", "less_busy");
      // System message should be separate, not part of user prompt
      expect(message).toContain("You are a music generation AI");
      expect(message.length).toBeLessThan(500); // Guidance should be concise
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
