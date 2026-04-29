import { describe, it, expect } from "vitest";
import {
  getEQFilterParams,
  validateEQSettings,
  validateTrimSettings,
  serializeEQSettings,
  deserializeEQSettings,
  serializeTrimSettings,
  deserializeTrimSettings,
  calculateFadeEnvelope,
  type EQSettings,
  type TrimSettings,
} from "./audioProcessing";

describe("Audio Processing Utilities", () => {
  describe("EQ Settings", () => {
    it("should validate correct EQ settings", () => {
      const settings: EQSettings = { bass: 6, mid: -3, treble: 0 };
      expect(validateEQSettings(settings)).toBe(true);
    });

    it("should reject EQ settings with out-of-range values", () => {
      expect(validateEQSettings({ bass: 15, mid: 0, treble: 0 })).toBe(false);
      expect(validateEQSettings({ bass: -15, mid: 0, treble: 0 })).toBe(false);
      expect(validateEQSettings({ bass: 0, mid: 20, treble: 0 })).toBe(false);
    });

    it("should generate correct EQ filter parameters", () => {
      const settings: EQSettings = { bass: 6, mid: -3, treble: 9 };
      const params = getEQFilterParams(settings);

      expect(params.bass.type).toBe("lowshelf");
      expect(params.bass.frequency).toBe(100);
      expect(params.bass.gain).toBe(6);

      expect(params.mid.type).toBe("peaking");
      expect(params.mid.frequency).toBe(1000);
      expect(params.mid.gain).toBe(-3);

      expect(params.treble.type).toBe("highshelf");
      expect(params.treble.frequency).toBe(10000);
      expect(params.treble.gain).toBe(9);
    });

    it("should serialize and deserialize EQ settings", () => {
      const original: EQSettings = { bass: 6.5, mid: -3.2, treble: 1.8 };
      const serialized = serializeEQSettings(original);
      const deserialized = deserializeEQSettings(serialized);

      expect(deserialized.bass).toBeCloseTo(6.5, 1);
      expect(deserialized.mid).toBeCloseTo(-3.2, 1);
      expect(deserialized.treble).toBeCloseTo(1.8, 1);
    });
  });

  describe("Trim Settings", () => {
    it("should validate correct trim settings", () => {
      const settings: TrimSettings = {
        startTime: 1,
        endTime: 30,
        fadeInDuration: 0.5,
        fadeOutDuration: 0.5,
      };
      expect(validateTrimSettings(settings, 60)).toBe(true);
    });

    it("should reject trim settings with invalid times", () => {
      expect(
        validateTrimSettings(
          { startTime: 30, endTime: 1, fadeInDuration: 0, fadeOutDuration: 0 },
          60
        )
      ).toBe(false);
      expect(
        validateTrimSettings(
          { startTime: -1, endTime: 30, fadeInDuration: 0, fadeOutDuration: 0 },
          60
        )
      ).toBe(false);
      expect(
        validateTrimSettings(
          { startTime: 1, endTime: 70, fadeInDuration: 0, fadeOutDuration: 0 },
          60
        )
      ).toBe(false);
    });

    it("should serialize and deserialize trim settings", () => {
      const original: TrimSettings = {
        startTime: 1.234,
        endTime: 29.876,
        fadeInDuration: 0.5,
        fadeOutDuration: 1.2,
      };
      const serialized = serializeTrimSettings(original);
      const deserialized = deserializeTrimSettings(serialized);

      expect(deserialized.startTime).toBeCloseTo(1.234, 2);
      expect(deserialized.endTime).toBeCloseTo(29.876, 2);
      expect(deserialized.fadeInDuration).toBe(0.5);
      expect(deserialized.fadeOutDuration).toBe(1.2);
    });
  });

  describe("Fade Envelope", () => {
    it("should calculate fade-in envelope", () => {
      const sampleRate = 44100;
      const fadeInDuration = 1; // 1 second
      const totalSamples = 44100; // 1 second at 44.1kHz

      const envelope = calculateFadeEnvelope(
        totalSamples,
        sampleRate,
        fadeInDuration,
        0
      );

      // First sample should be 0
      expect(envelope[0]).toBeCloseTo(0, 2);

      // Middle of fade-in should be ~0.5
      expect(envelope[22050]).toBeCloseTo(0.5, 1);

      // After fade-in should be 1
      expect(envelope[44099]).toBeCloseTo(1, 2);
    });

    it("should calculate fade-out envelope", () => {
      const sampleRate = 44100;
      const fadeOutDuration = 1; // 1 second
      const totalSamples = 44100; // 1 second at 44.1kHz

      const envelope = calculateFadeEnvelope(
        totalSamples,
        sampleRate,
        0,
        fadeOutDuration
      );

      // Before fade-out should be 1
      expect(envelope[0]).toBe(1);

      // Middle of fade-out should be ~0.5
      expect(envelope[22050]).toBeCloseTo(0.5, 1);

      // Last sample should be ~0
      expect(envelope[44099]).toBeCloseTo(0, 2);
    });

    it("should calculate both fade-in and fade-out", () => {
      const sampleRate = 44100;
      const fadeInDuration = 0.5;
      const fadeOutDuration = 0.5;
      const totalSamples = 44100; // 1 second

      const envelope = calculateFadeEnvelope(
        totalSamples,
        sampleRate,
        fadeInDuration,
        fadeOutDuration
      );

      // Start should fade in
      expect(envelope[0]).toBeCloseTo(0, 2);
      expect(envelope[11025]).toBeCloseTo(0.5, 1);

      // Middle should be 1
      expect(envelope[22050]).toBe(1);

      // End should fade out
      expect(envelope[33075]).toBeCloseTo(0.5, 1);
      expect(envelope[44099]).toBeCloseTo(0, 2);
    });
  });

  describe("Default Values", () => {
    it("should handle missing optional EQ values", () => {
      const settings = deserializeEQSettings(JSON.stringify({}));
      expect(settings.bass).toBe(0);
      expect(settings.mid).toBe(0);
      expect(settings.treble).toBe(0);
    });

    it("should handle missing optional trim values", () => {
      const settings = deserializeTrimSettings(
        JSON.stringify({ startTime: 0, endTime: 10 })
      );
      expect(settings.fadeInDuration).toBe(0);
      expect(settings.fadeOutDuration).toBe(0);
    });
  });
});
