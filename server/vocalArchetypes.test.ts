import { describe, it, expect } from "vitest";
import {
  VOCAL_ARCHETYPES,
  MASTER_NEGATIVE_PROMPTS,
  getVocalArchetypes,
  buildVocalPrompt,
  getArchetypeProfile,
  VocalArchetype,
} from "./vocalArchetypes";

describe("vocalArchetypes", () => {
  describe("VOCAL_ARCHETYPES", () => {
    it("should have 8 core archetypes", () => {
      expect(Object.keys(VOCAL_ARCHETYPES)).toHaveLength(8);
    });

    it("should have all required fields for each archetype", () => {
      Object.values(VOCAL_ARCHETYPES).forEach((arch) => {
        expect(arch).toHaveProperty("id");
        expect(arch).toHaveProperty("name");
        expect(arch).toHaveProperty("description");
        expect(arch).toHaveProperty("promptCore");
        expect(arch).toHaveProperty("emotionalGuidance");
        expect(arch).toHaveProperty("productionTips");
        expect(arch).toHaveProperty("negativePrompts");
        expect(arch).toHaveProperty("whyItWorks");
      });
    });

    it("should have non-empty prompt cores", () => {
      Object.values(VOCAL_ARCHETYPES).forEach((arch) => {
        expect(arch.promptCore.length).toBeGreaterThan(0);
      });
    });

    it("should have production tips for each archetype", () => {
      Object.values(VOCAL_ARCHETYPES).forEach((arch) => {
        expect(arch.productionTips.length).toBeGreaterThan(0);
      });
    });

    it("should have negative prompts for each archetype", () => {
      Object.values(VOCAL_ARCHETYPES).forEach((arch) => {
        expect(arch.negativePrompts.length).toBeGreaterThan(0);
      });
    });
  });

  describe("MASTER_NEGATIVE_PROMPTS", () => {
    it("should have a list of negative prompts", () => {
      expect(MASTER_NEGATIVE_PROMPTS.length).toBeGreaterThan(0);
    });

    it("should include common anti-polish patterns", () => {
      expect(MASTER_NEGATIVE_PROMPTS).toContain("overly polished");
      expect(MASTER_NEGATIVE_PROMPTS).toContain("robotic");
      expect(MASTER_NEGATIVE_PROMPTS).toContain("perfect pitch");
    });
  });

  describe("getVocalArchetypes", () => {
    it("should return all 8 archetypes", () => {
      const archetypes = getVocalArchetypes();
      expect(archetypes).toHaveLength(8);
    });

    it("should return archetype metadata", () => {
      const archetypes = getVocalArchetypes();
      archetypes.forEach((arch) => {
        expect(arch).toHaveProperty("id");
        expect(arch).toHaveProperty("name");
        expect(arch).toHaveProperty("description");
      });
    });

    it("should include intimate-bedroom archetype", () => {
      const archetypes = getVocalArchetypes();
      const intimate = archetypes.find((a) => a.id === "intimate-bedroom");
      expect(intimate).toBeDefined();
      expect(intimate?.name).toBe("Intimate Bedroom");
    });
  });

  describe("buildVocalPrompt", () => {
    it("should combine archetype core with user prompt", () => {
      const userPrompt = "sad love song";
      const result = buildVocalPrompt(userPrompt, "intimate-bedroom");
      expect(result).toContain("breathy");
      expect(result).toContain("sad love song");
    });

    it("should include negative prompts by default", () => {
      const userPrompt = "happy upbeat song";
      const result = buildVocalPrompt(userPrompt, "confident-pop");
      expect(result).toContain("[avoid:");
      expect(result).toContain("overly polished");
    });

    it("should exclude negative prompts when requested", () => {
      const userPrompt = "experimental vocal";
      const result = buildVocalPrompt(userPrompt, "raw-emotional", false);
      expect(result).not.toContain("[avoid:");
      expect(result).toContain("raw emotional");
    });

    it("should work with all archetypes", () => {
      const archetypeIds: VocalArchetype[] = [
        "intimate-bedroom",
        "raw-emotional",
        "soulful-belter",
        "gritty-rock",
        "confident-pop",
        "lo-fi-whisper",
        "powerful-anthem",
        "storyteller-folk",
      ];

      archetypeIds.forEach((id) => {
        const result = buildVocalPrompt("test song", id);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toContain("test song");
      });
    });
  });

  describe("getArchetypeProfile", () => {
    it("should return full profile for valid archetype", () => {
      const profile = getArchetypeProfile("soulful-belter");
      expect(profile.id).toBe("soulful-belter");
      expect(profile.name).toBe("Soulful Belter");
      expect(profile.promptCore).toContain("soulful");
    });

    it("should throw error for invalid archetype", () => {
      expect(() => {
        getArchetypeProfile("invalid-archetype" as VocalArchetype);
      }).toThrow("Unknown vocal archetype");
    });

    it("should return all required fields", () => {
      const profile = getArchetypeProfile("lo-fi-whisper");
      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("name");
      expect(profile).toHaveProperty("description");
      expect(profile).toHaveProperty("promptCore");
      expect(profile).toHaveProperty("emotionalGuidance");
      expect(profile).toHaveProperty("productionTips");
      expect(profile).toHaveProperty("negativePrompts");
      expect(profile).toHaveProperty("whyItWorks");
    });
  });

  describe("Vocal Archetype Specifics", () => {
    it("intimate-bedroom should emphasize breath and vulnerability", () => {
      const profile = getArchetypeProfile("intimate-bedroom");
      expect(profile.promptCore).toContain("breath");
      expect(profile.promptCore).toContain("vulnerable");
    });

    it("soulful-belter should emphasize runs and dynamic range", () => {
      const profile = getArchetypeProfile("soulful-belter");
      expect(profile.promptCore).toContain("runs");
      expect(profile.promptCore).toContain("dynamic");
    });

    it("gritty-rock should emphasize rasp and power", () => {
      const profile = getArchetypeProfile("gritty-rock");
      expect(profile.promptCore).toContain("rasp");
      expect(profile.promptCore).toContain("power");
    });

    it("lo-fi-whisper should emphasize room tone and warmth", () => {
      const profile = getArchetypeProfile("lo-fi-whisper");
      expect(profile.promptCore).toContain("room tone");
      expect(profile.promptCore).toContain("warm");
    });

    it("powerful-anthem should emphasize soaring and emotional build", () => {
      const profile = getArchetypeProfile("powerful-anthem");
      expect(profile.promptCore).toContain("soaring");
      expect(profile.promptCore).toContain("emotional");
    });
  });
});
