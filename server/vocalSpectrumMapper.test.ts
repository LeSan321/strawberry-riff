import { describe, it, expect } from "vitest";
import {
  mapSpectrumToGuidance,
  getSpectrumAxis,
  getAllSpectrumAxes,
  isValidSpectrumValue,
  vocalSpectrumAxes,
} from "./vocalSpectrumMapper";

describe("Vocal Spectrum Mapper", () => {
  describe("mapSpectrumToGuidance", () => {
    it("should return left endpoint guidance for values 0-25", () => {
      const guidance = mapSpectrumToGuidance("powerful-anthem", 0);
      expect(guidance.toLowerCase()).toContain("smooth");
      expect(guidance.toLowerCase()).toContain("lean");
    });

    it("should return slightly favor left for values 25-50", () => {
      const guidance = mapSpectrumToGuidance("powerful-anthem", 40);
      expect(guidance.toLowerCase()).toContain("smooth");
      expect(guidance.toLowerCase()).toContain("slightly");
    });

    it("should return balance guidance for value 50", () => {
      const guidance = mapSpectrumToGuidance("powerful-anthem", 50);
      expect(guidance).toContain("Balance");
      expect(guidance.toLowerCase()).toContain("smooth");
      expect(guidance.toLowerCase()).toContain("gritty");
    });

    it("should return slightly favor right for values 50-75", () => {
      const guidance = mapSpectrumToGuidance("powerful-anthem", 60);
      expect(guidance.toLowerCase()).toContain("gritty");
      expect(guidance.toLowerCase()).toContain("slightly");
    });

    it("should return right endpoint guidance for values 75-100", () => {
      const guidance = mapSpectrumToGuidance("powerful-anthem", 100);
      expect(guidance.toLowerCase()).toContain("gritty");
      expect(guidance.toLowerCase()).toContain("lean");
    });

    it("should clamp values outside 0-100 range", () => {
      const guidanceNegative = mapSpectrumToGuidance("powerful-anthem", -10);
      const guidance0 = mapSpectrumToGuidance("powerful-anthem", 0);
      expect(guidanceNegative).toBe(guidance0);

      const guidance101 = mapSpectrumToGuidance("powerful-anthem", 101);
      const guidance100 = mapSpectrumToGuidance("powerful-anthem", 100);
      expect(guidance101).toBe(guidance100);
    });

    it("should work with all vocal archetypes", () => {
      const archetypes = Object.keys(vocalSpectrumAxes);
      archetypes.forEach((archetype) => {
        const guidance = mapSpectrumToGuidance(archetype as any, 50);
        expect(guidance).toBeTruthy();
        expect(guidance.length).toBeGreaterThan(0);
      });
    });

    it("should return empty string for invalid archetype", () => {
      const guidance = mapSpectrumToGuidance("invalid-archetype" as any, 50);
      expect(guidance).toBe("");
    });
  });

  describe("getSpectrumAxis", () => {
    it("should return the correct spectrum axis for a vocal archetype", () => {
      const axis = getSpectrumAxis("powerful-anthem");
      expect(axis).toBeDefined();
      expect(axis.leftEndpoint).toBe("Smooth Soaring");
      expect(axis.rightEndpoint).toBe("Gritty Belting");
      expect(axis.description).toContain("Steve Perry");
      expect(axis.description).toContain("Robert Plant");
    });

    it("should return all spectrum axes", () => {
      const axes = getSpectrumAxis("soulful-belter");
      expect(axes.leftEndpoint).toBe("Controlled Runs");
      expect(axes.rightEndpoint).toBe("Raw Emotional");
    });

    it("should return undefined for invalid archetype", () => {
      const axis = getSpectrumAxis("invalid-archetype" as any);
      expect(axis).toBeUndefined();
    });
  });

  describe("getAllSpectrumAxes", () => {
    it("should return all spectrum axes", () => {
      const allAxes = getAllSpectrumAxes();
      expect(Object.keys(allAxes).length).toBeGreaterThan(0);
      expect(allAxes["powerful-anthem"]).toBeDefined();
      expect(allAxes["intimate-bedroom"]).toBeDefined();
    });

    it("should have all required archetype axes", () => {
      const allAxes = getAllSpectrumAxes();
      const requiredArchetypes = [
        "intimate-bedroom",
        "raw-emotional",
        "soulful-belter",
        "gritty-rock",
        "confident-pop",
        "lo-fi-whisper",
        "powerful-anthem",
        "storyteller-folk",
      ];
      requiredArchetypes.forEach((archetype) => {
        expect(allAxes[archetype as any]).toBeDefined();
        expect(allAxes[archetype as any].leftEndpoint).toBeTruthy();
        expect(allAxes[archetype as any].rightEndpoint).toBeTruthy();
        expect(allAxes[archetype as any].description).toBeTruthy();
      });
    });
  });

  describe("isValidSpectrumValue", () => {
    it("should return true for valid spectrum values", () => {
      expect(isValidSpectrumValue(0)).toBe(true);
      expect(isValidSpectrumValue(50)).toBe(true);
      expect(isValidSpectrumValue(100)).toBe(true);
      expect(isValidSpectrumValue(25.5)).toBe(true);
    });

    it("should return false for invalid spectrum values", () => {
      expect(isValidSpectrumValue(-1)).toBe(false);
      expect(isValidSpectrumValue(101)).toBe(false);
      expect(isValidSpectrumValue("50")).toBe(false);
      expect(isValidSpectrumValue(null)).toBe(false);
      expect(isValidSpectrumValue(undefined)).toBe(false);
    });
  });

  describe("Spectrum axis consistency", () => {
    it("should have endpoints for all archetypes", () => {
      Object.entries(vocalSpectrumAxes).forEach(([archetype, axis]) => {
        expect(axis.leftEndpoint).toBeTruthy();
        expect(axis.rightEndpoint).toBeTruthy();
        expect(axis.description).toBeTruthy();
        expect(axis.leftEndpoint).not.toBe(axis.rightEndpoint);
      });
    });

    it("should have meaningful descriptions with examples", () => {
      const axis = vocalSpectrumAxes["powerful-anthem"];
      expect(axis.description).toContain("Steve Perry");
      expect(axis.description).toContain("Robert Plant");
    });
  });
});
