import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  FUSIONS,
  WILDCARD_GENERATOR,
  getRandomFusion,
  generateRandomWildcard,
  findFusionByName,
} from "./fusionLibrary";

describe("Fusion Library", () => {
  describe("FUSIONS array", () => {
    it("should contain exactly 47 fusions", () => {
      expect(FUSIONS).toHaveLength(47);
    });

    it("should have all required fields for each fusion", () => {
      FUSIONS.forEach((fusion) => {
        expect(fusion).toHaveProperty("name");
        expect(fusion).toHaveProperty("tier");
        expect(fusion).toHaveProperty("promptCore");
        expect(typeof fusion.name).toBe("string");
        expect(typeof fusion.promptCore).toBe("string");
        expect(fusion.name.length).toBeGreaterThan(0);
        expect(fusion.promptCore.length).toBeGreaterThan(0);
      });
    });

    it("should have valid tier values", () => {
      const validTiers = ["safe", "medium", "experimental", "global", "wildcard"];
      FUSIONS.forEach((fusion) => {
        expect(validTiers).toContain(fusion.tier);
      });
    });

    it("should have correct tier distribution", () => {
      const tierCounts = FUSIONS.reduce(
        (acc, f) => {
          acc[f.tier] = (acc[f.tier] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(tierCounts["safe"]).toBe(5);
      expect(tierCounts["medium"]).toBe(10);
      expect(tierCounts["experimental"]).toBe(10);
      expect(tierCounts["global"]).toBe(10);
      expect(tierCounts["wildcard"]).toBe(12);
    });

    it("should have unique fusion names", () => {
      const names = FUSIONS.map((f) => f.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("should have prompt cores under 1000 characters", () => {
      FUSIONS.forEach((fusion) => {
        expect(fusion.promptCore.length).toBeLessThanOrEqual(1000);
      });
    });
  });

  describe("WILDCARD_GENERATOR", () => {
    it("should have columnA with 15 base genres", () => {
      expect(WILDCARD_GENERATOR.columnA).toHaveLength(15);
    });

    it("should have columnB with 15 twist genres", () => {
      expect(WILDCARD_GENERATOR.columnB).toHaveLength(15);
    });

    it("should have no empty strings in columns", () => {
      WILDCARD_GENERATOR.columnA.forEach((genre) => {
        expect(genre.length).toBeGreaterThan(0);
      });
      WILDCARD_GENERATOR.columnB.forEach((genre) => {
        expect(genre.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getRandomFusion()", () => {
    it("should return a fusion object", () => {
      const fusion = getRandomFusion();
      expect(fusion).toHaveProperty("name");
      expect(fusion).toHaveProperty("tier");
      expect(fusion).toHaveProperty("promptCore");
    });

    it("should return a fusion from the FUSIONS array", () => {
      const fusion = getRandomFusion();
      expect(FUSIONS).toContainEqual(fusion);
    });

    it("should return different fusions on multiple calls (with high probability)", () => {
      const fusions = Array.from({ length: 20 }, () => getRandomFusion());
      const uniqueFusions = new Set(fusions.map((f) => f.name));
      // With 47 fusions and 20 calls, we should get at least 5 different ones
      expect(uniqueFusions.size).toBeGreaterThanOrEqual(5);
    });

    it("should have a valid promptCore", () => {
      const fusion = getRandomFusion();
      expect(fusion.promptCore.length).toBeGreaterThan(0);
      expect(fusion.promptCore.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("generateRandomWildcard()", () => {
    it("should return a string with the format 'Base + Twist'", () => {
      const wildcard = generateRandomWildcard();
      expect(wildcard).toMatch(/^.+\s\+\s.+$/);
    });

    it("should return a combination from the wildcard columns", () => {
      const wildcard = generateRandomWildcard();
      const [base, twist] = wildcard.split(" + ");

      expect(WILDCARD_GENERATOR.columnA).toContain(base);
      expect(WILDCARD_GENERATOR.columnB).toContain(twist);
    });

    it("should generate different combinations on multiple calls (with high probability)", () => {
      const wildcards = Array.from({ length: 30 }, () =>
        generateRandomWildcard()
      );
      const uniqueWildcards = new Set(wildcards);
      // With 15x15 possible combinations and 30 calls, we should get at least 10 different ones
      expect(uniqueWildcards.size).toBeGreaterThanOrEqual(10);
    });
  });

  describe("findFusionByName()", () => {
    it("should find a fusion by exact name", () => {
      const fusion = findFusionByName("Lo-fi Hip Hop + Dreamy Jazz");
      expect(fusion).toBeDefined();
      expect(fusion?.name).toBe("Lo-fi Hip Hop + Dreamy Jazz");
    });

    it("should find a fusion by partial name (case-insensitive)", () => {
      const fusion = findFusionByName("lo-fi");
      expect(fusion).toBeDefined();
      expect(fusion?.name).toContain("Lo-fi");
    });

    it("should return undefined for non-existent fusion", () => {
      const fusion = findFusionByName("Nonexistent Fusion");
      expect(fusion).toBeUndefined();
    });

    it("should be case-insensitive", () => {
      const fusion1 = findFusionByName("BAROQUE");
      const fusion2 = findFusionByName("baroque");
      expect(fusion1).toBeDefined();
      expect(fusion2).toBeDefined();
      expect(fusion1?.name).toBe(fusion2?.name);
    });

    it("should find fusions with special characters", () => {
      const fusion = findFusionByName("K-Pop");
      expect(fusion).toBeDefined();
      expect(fusion?.name).toContain("K-Pop");
    });
  });

  describe("Fusion data integrity", () => {
    it("should have at least one fusion with whyItWorks in safe tier", () => {
      const safeFusions = FUSIONS.filter((f) => f.tier === "safe");
      const withExplanation = safeFusions.filter((f) => f.whyItWorks);
      expect(withExplanation.length).toBeGreaterThan(0);
    });

    it("should have at least one fusion with visualSynergy in medium tier", () => {
      const mediumFusions = FUSIONS.filter((f) => f.tier === "medium");
      const withVisuals = mediumFusions.filter((f) => f.visualSynergy);
      expect(withVisuals.length).toBeGreaterThan(0);
    });

    it("should not have duplicate prompt cores", () => {
      const promptCores = FUSIONS.map((f) => f.promptCore);
      const uniquePrompts = new Set(promptCores);
      expect(uniquePrompts.size).toBe(promptCores.length);
    });
  });
});
