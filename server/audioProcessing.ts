/**
 * Audio Processing Utilities for Web Audio API operations
 * Handles EQ, trimming, and other audio transformations
 */

/**
 * EQ Settings for 3-band equalizer
 * Values are in dB (decibels), range: -12 to +12
 */
export interface EQSettings {
  bass: number;    // Low frequencies (~100 Hz)
  mid: number;     // Mid frequencies (~1 kHz)
  treble: number;  // High frequencies (~10 kHz)
}

/**
 * Trim Settings for audio trimming
 */
export interface TrimSettings {
  startTime: number;  // Start trim in seconds
  endTime: number;    // End trim in seconds
  fadeInDuration?: number;  // Fade in duration in seconds (optional)
  fadeOutDuration?: number; // Fade out duration in seconds (optional)
}

/**
 * Audio Processing Result
 */
export interface AudioProcessingResult {
  audioBuffer: ArrayBuffer;
  duration: number;
  sampleRate: number;
}

/**
 * Apply 3-band EQ to audio data
 * Uses Web Audio API BiquadFilterNode parameters
 * 
 * Note: This is a server-side reference. Actual processing happens on client
 * via Web Audio API for real-time preview. Server stores settings and
 * can re-apply them when exporting.
 */
export function getEQFilterParams(settings: EQSettings) {
  return {
    bass: {
      type: "lowshelf",
      frequency: 100,
      gain: settings.bass,
    },
    mid: {
      type: "peaking",
      frequency: 1000,
      gain: settings.mid,
      Q: 1,
    },
    treble: {
      type: "highshelf",
      frequency: 10000,
      gain: settings.treble,
    },
  };
}

/**
 * Validate EQ settings
 */
export function validateEQSettings(settings: Partial<EQSettings>): boolean {
  const bass = settings.bass ?? 0;
  const mid = settings.mid ?? 0;
  const treble = settings.treble ?? 0;

  return (
    typeof bass === "number" &&
    typeof mid === "number" &&
    typeof treble === "number" &&
    bass >= -12 &&
    bass <= 12 &&
    mid >= -12 &&
    mid <= 12 &&
    treble >= -12 &&
    treble <= 12
  );
}

/**
 * Validate trim settings
 */
export function validateTrimSettings(
  settings: TrimSettings,
  totalDuration: number
): boolean {
  return (
    typeof settings.startTime === "number" &&
    typeof settings.endTime === "number" &&
    settings.startTime >= 0 &&
    settings.endTime <= totalDuration &&
    settings.startTime < settings.endTime
  );
}

/**
 * Calculate fade envelope values for audio processing
 * Returns an array of gain multipliers for each sample
 */
export function calculateFadeEnvelope(
  totalSamples: number,
  sampleRate: number,
  fadeInDuration: number = 0,
  fadeOutDuration: number = 0
): Float32Array {
  const envelope = new Float32Array(totalSamples);
  const fadeInSamples = Math.floor(fadeInDuration * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutDuration * sampleRate);

  for (let i = 0; i < totalSamples; i++) {
    let gain = 1;

    // Fade in
    if (i < fadeInSamples && fadeInSamples > 0) {
      gain = i / fadeInSamples;
    }

    // Fade out
    if (i >= totalSamples - fadeOutSamples && fadeOutSamples > 0) {
      gain = (totalSamples - i) / fadeOutSamples;
    }

    envelope[i] = gain;
  }

  return envelope;
}

/**
 * Serialize EQ settings to JSON for storage
 */
export function serializeEQSettings(settings: EQSettings): string {
  return JSON.stringify({
    bass: Math.round(settings.bass * 100) / 100,
    mid: Math.round(settings.mid * 100) / 100,
    treble: Math.round(settings.treble * 100) / 100,
  });
}

/**
 * Deserialize EQ settings from JSON
 */
export function deserializeEQSettings(json: string): EQSettings {
  const parsed = JSON.parse(json);
  return {
    bass: parsed.bass ?? 0,
    mid: parsed.mid ?? 0,
    treble: parsed.treble ?? 0,
  };
}

/**
 * Serialize trim settings to JSON for storage
 */
export function serializeTrimSettings(settings: TrimSettings): string {
  return JSON.stringify({
    startTime: Math.round(settings.startTime * 1000) / 1000,
    endTime: Math.round(settings.endTime * 1000) / 1000,
    fadeInDuration: settings.fadeInDuration ?? 0,
    fadeOutDuration: settings.fadeOutDuration ?? 0,
  });
}

/**
 * Deserialize trim settings from JSON
 */
export function deserializeTrimSettings(json: string): TrimSettings {
  const parsed = JSON.parse(json);
  return {
    startTime: parsed.startTime ?? 0,
    endTime: parsed.endTime ?? 0,
    fadeInDuration: parsed.fadeInDuration ?? 0,
    fadeOutDuration: parsed.fadeOutDuration ?? 0,
  };
}
