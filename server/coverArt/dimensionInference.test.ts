import { describe, it, expect } from 'vitest';
import { 
  inferDimensions, 
  serializeDimensions, 
  deserializeDimensions,
  type MusicGenerationMetadata,
  type DimensionAnswers 
} from './dimensionInference';

describe('Dimension Inference Engine', () => {
  describe('inferDimensions', () => {
    it('should infer dimensions from minimal metadata', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'upbeat pop song',
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
      expect(dimensions.energyDirection).toBeDefined();
      expect(dimensions.emotionStance).toBeDefined();
      expect(dimensions.culturePosition).toBeDefined();
      expect(dimensions.synthesisFingerprint).toBeDefined();
      expect(dimensions.confidenceScores).toBeDefined();
    });

    it('should infer expansive energy from upbeat keywords', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 75,
        prompt: 'energetic upbeat dance',
        moodTags: ['energetic', 'uplifting', 'bright'],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions.energyDirection).toBe('expansive');
    });

    it('should infer compressive energy from intimate keywords', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 25,
        prompt: 'intimate acoustic',
        moodTags: ['intimate', 'introspective'],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions.energyDirection).toBe('compressive');
    });

    it('should infer balanced energy by default', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'song',
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions.energyDirection).toBe('balanced');
    });

    it('should infer energy shape from keywords', () => {
      const buildMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'build up crescendo',
      };

      const releaseMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'release fade out',
      };

      const buildDims = inferDimensions(buildMetadata);
      const releaseDims = inferDimensions(releaseMetadata);

      expect(buildDims.energyShape).toBe('build');
      expect(releaseDims.energyShape).toBe('release');
    });

    it('should infer energy texture from genre', () => {
      const electronicMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'electronic',
        genre: 'electronic',
      };

      const acousticMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'acoustic',
        genre: 'acoustic',
      };

      const electronicDims = inferDimensions(electronicMetadata);
      const acousticDims = inferDimensions(acousticMetadata);

      expect(electronicDims.energyTexture).toBe('mechanical');
      expect(acousticDims.energyTexture).toBe('organic');
    });

    it('should infer energy weight from spectrum and genre', () => {
      const heavyMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 15,
        prompt: 'heavy',
        genre: 'metal',
      };

      const lightMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 85,
        prompt: 'ethereal',
      };

      const heavyDims = inferDimensions(heavyMetadata);
      const lightDims = inferDimensions(lightMetadata);

      expect(heavyDims.energyWeight).toBe('heavy');
      expect(lightDims.energyWeight).toBe('suspended');
    });

    it('should infer energy pace from keywords', () => {
      const urgentMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'urgent fast paced',
      };

      const meditativeMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'meditative slow ambient',
      };

      const urgentDims = inferDimensions(urgentMetadata);
      const meditativeDims = inferDimensions(meditativeMetadata);

      expect(urgentDims.energyPace).toBe('urgent');
      expect(meditativeDims.energyPace).toBe('meditative');
    });

    it('should infer emotion stance from keywords', () => {
      const joyMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'happy joyful celebration',
      };

      const griefMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'sad melancholic grief',
      };

      const joyDims = inferDimensions(joyMetadata);
      const griefDims = inferDimensions(griefMetadata);

      expect(joyDims.emotionStance).toBe('joy');
      expect(griefDims.emotionStance).toBe('grief');
    });

    it('should infer emotion resolution from keywords', () => {
      const resolvedMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'resolved conclusive ending',
      };

      const openMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'open ended ambiguous',
      };

      const resolvedDims = inferDimensions(resolvedMetadata);
      const openDims = inferDimensions(openMetadata);

      expect(resolvedDims.emotionResolution).toBe('resolved');
      expect(openDims.emotionResolution).toBe('open');
    });

    it('should infer emotion intensity from keywords', () => {
      const subtleMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'subtle gentle quiet',
      };

      const intenseMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'intense powerful overwhelming',
      };

      const subtleDims = inferDimensions(subtleMetadata);
      const intenseDims = inferDimensions(intenseMetadata);

      expect(subtleDims.emotionIntensity).toBe('subtle');
      expect(intenseDims.emotionIntensity).toBe('intense');
    });

    it('should infer emotion tone from keywords', () => {
      const warmMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'warm cozy golden',
      };

      const coolMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'cool cold icy',
      };

      const warmDims = inferDimensions(warmMetadata);
      const coolDims = inferDimensions(coolMetadata);

      expect(warmDims.emotionTone).toBe('warm');
      expect(coolDims.emotionTone).toBe('cool');
    });

    it('should infer emotion movement from keywords', () => {
      const ascendingMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'ascending rising uplifting',
      };

      const descendingMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'descending falling sinking',
      };

      const ascendingDims = inferDimensions(ascendingMetadata);
      const descendingDims = inferDimensions(descendingMetadata);

      expect(ascendingDims.emotionMovement).toBe('ascending');
      expect(descendingDims.emotionMovement).toBe('descending');
    });

    it('should infer culture position from keywords', () => {
      const aheadMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'futuristic ahead experimental',
      };

      const behindMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'retro vintage behind',
      };

      const aheadDims = inferDimensions(aheadMetadata);
      const behindDims = inferDimensions(behindMetadata);

      expect(aheadDims.culturePosition).toBe('ahead');
      expect(behindDims.culturePosition).toBe('behind');
    });

    it('should infer culture authenticity from keywords', () => {
      const rawMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'raw unpolished authentic',
      };

      const polishedMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'polished refined produced',
      };

      const rawDims = inferDimensions(rawMetadata);
      const polishedDims = inferDimensions(polishedMetadata);

      expect(rawDims.cultureAuthenticity).toBe('raw');
      expect(polishedDims.cultureAuthenticity).toBe('polished');
    });

    it('should infer culture density from keywords', () => {
      const sparseMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'sparse minimal empty',
      };

      const denseMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'dense layered complex',
      };

      const sparseDims = inferDimensions(sparseMetadata);
      const denseDims = inferDimensions(denseMetadata);

      expect(sparseDims.cultureDensity).toBe('sparse');
      expect(denseDims.cultureDensity).toBe('dense');
    });

    it('should infer culture temporality from keywords', () => {
      const timelessMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'timeless eternal universal',
      };

      const retroMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'retro vintage 80s',
      };

      const timelessDims = inferDimensions(timelessMetadata);
      const retroDims = inferDimensions(retroMetadata);

      expect(timelessDims.cultureTemporality).toBe('timeless');
      expect(retroDims.cultureTemporality).toBe('retro');
    });

    it('should infer culture reference from keywords', () => {
      const universalMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'universal global mainstream',
      };

      const personalMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'personal intimate autobiographical',
      };

      const universalDims = inferDimensions(universalMetadata);
      const personalDims = inferDimensions(personalMetadata);

      expect(universalDims.cultureReference).toBe('universal');
      expect(personalDims.cultureReference).toBe('personal');
    });

    it('should handle all 15 dimensions', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'energetic happy warm reggae',
        genre: 'reggae',
        duration: 180,
        moodTags: ['upbeat', 'tropical'],
      };

      const dimensions = inferDimensions(metadata);

      // Check all 15 dimensions exist
      expect(dimensions.energyDirection).toBeDefined();
      expect(dimensions.energyShape).toBeDefined();
      expect(dimensions.energyTexture).toBeDefined();
      expect(dimensions.energyWeight).toBeDefined();
      expect(dimensions.energyPace).toBeDefined();
      expect(dimensions.emotionStance).toBeDefined();
      expect(dimensions.emotionResolution).toBeDefined();
      expect(dimensions.emotionIntensity).toBeDefined();
      expect(dimensions.emotionTone).toBeDefined();
      expect(dimensions.emotionMovement).toBeDefined();
      expect(dimensions.culturePosition).toBeDefined();
      expect(dimensions.cultureAuthenticity).toBeDefined();
      expect(dimensions.cultureDensity).toBeDefined();
      expect(dimensions.cultureTemporality).toBeDefined();
      expect(dimensions.cultureReference).toBeDefined();
    });

    it('should handle undefined optional fields gracefully', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'song',
      };

      const dimensions = inferDimensions(metadata);

      // Should not throw and should return valid dimensions
      expect(dimensions).toBeDefined();
      expect(dimensions.energyDirection).toBeDefined();
      expect(dimensions.synthesisFingerprint).toBeDefined();
    });
  });

  describe('Serialization and Deserialization', () => {
    it('should serialize dimensions to JSON string', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test song',
      };

      const dimensions = inferDimensions(metadata);
      const serialized = serializeDimensions(dimensions);

      expect(typeof serialized).toBe('string');
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    it('should deserialize JSON string back to dimensions', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test song',
      };

      const original = inferDimensions(metadata);
      const serialized = serializeDimensions(original);
      const deserialized = deserializeDimensions(serialized);

      expect(deserialized.energyDirection).toBe(original.energyDirection);
      expect(deserialized.emotionStance).toBe(original.emotionStance);
      expect(deserialized.culturePosition).toBe(original.culturePosition);
    });

    it('should preserve all 15 dimensions through serialization', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 75,
        prompt: 'energetic happy warm reggae',
        genre: 'reggae',
        duration: 240,
        moodTags: ['upbeat', 'tropical', 'sunny'],
      };

      const original = inferDimensions(metadata);
      const serialized = serializeDimensions(original);
      const deserialized = deserializeDimensions(serialized);

      expect(deserialized.energyDirection).toBe(original.energyDirection);
      expect(deserialized.energyShape).toBe(original.energyShape);
      expect(deserialized.energyTexture).toBe(original.energyTexture);
      expect(deserialized.energyWeight).toBe(original.energyWeight);
      expect(deserialized.energyPace).toBe(original.energyPace);
      expect(deserialized.emotionStance).toBe(original.emotionStance);
      expect(deserialized.emotionResolution).toBe(original.emotionResolution);
      expect(deserialized.emotionIntensity).toBe(original.emotionIntensity);
      expect(deserialized.emotionTone).toBe(original.emotionTone);
      expect(deserialized.emotionMovement).toBe(original.emotionMovement);
      expect(deserialized.culturePosition).toBe(original.culturePosition);
      expect(deserialized.cultureAuthenticity).toBe(original.cultureAuthenticity);
      expect(deserialized.cultureDensity).toBe(original.cultureDensity);
      expect(deserialized.cultureTemporality).toBe(original.cultureTemporality);
      expect(deserialized.cultureReference).toBe(original.cultureReference);
      expect(deserialized.synthesisFingerprint).toBe(original.synthesisFingerprint);
    });

    it('should preserve confidence scores through serialization', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test song',
      };

      const original = inferDimensions(metadata);
      const serialized = serializeDimensions(original);
      const deserialized = deserializeDimensions(serialized);

      expect(deserialized.confidenceScores).toBeDefined();
      expect(Object.keys(deserialized.confidenceScores).length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: '',
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
      expect(dimensions.energyDirection).toBeDefined();
    });

    it('should handle very long prompt', () => {
      const longPrompt = 'energetic '.repeat(100);
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 75,
        prompt: longPrompt,
        moodTags: ['energetic', 'uplifting'],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
      expect(dimensions.energyDirection).toBe('expansive');
    });

    it('should handle extreme vocal spectrum values', () => {
      const metadata1: MusicGenerationMetadata = {
        vocalSpectrum: 0,
        prompt: 'test',
      };

      const metadata2: MusicGenerationMetadata = {
        vocalSpectrum: 100,
        prompt: 'test',
      };

      const dims1 = inferDimensions(metadata1);
      const dims2 = inferDimensions(metadata2);

      expect(dims1).toBeDefined();
      expect(dims2).toBeDefined();
    });

    it('should handle very short duration', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test',
        duration: 10, // 10 seconds
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
    });

    it('should handle very long duration', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test',
        duration: 3600, // 1 hour
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
    });

    it('should handle empty mood tags array', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test',
        moodTags: [],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
    });

    it('should handle multiple mood tags', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'test',
        moodTags: ['happy', 'energetic', 'tropical', 'upbeat', 'sunny'],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions).toBeDefined();
      expect(dimensions.emotionStance).toBe('joy');
    });
  });

  describe('Cinématique Philosophy', () => {
    it('should reveal music energy through visual dimensions', () => {
      const quietMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'ambient peaceful quiet meditative',
        genre: 'ambient',
      };

      const energeticMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'energetic intense powerful driven',
      };

      const quietDims = inferDimensions(quietMetadata);
      const energeticDims = inferDimensions(energeticMetadata);

      // Quiet music should have meditative pace
      expect(quietDims.energyPace).toBe('meditative');
      
      // Energetic music should have driven pace
      expect(energeticDims.energyPace).toBe('driven');
    });

    it('should infer warm vs cool based on emotional tone', () => {
      const warmMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'warm cozy intimate golden sunset',
      };

      const coolMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'cool cold icy crisp blue',
      };

      const warmDims = inferDimensions(warmMetadata);
      const coolDims = inferDimensions(coolMetadata);

      // Warm should have warm tone
      expect(warmDims.emotionTone).toBe('warm');
      
      // Cool should have cool tone
      expect(coolDims.emotionTone).toBe('cool');
    });

    it('should map cultural context to visual language', () => {
      const reggaeMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'reggae',
        genre: 'reggae',
      };

      const jazzMetadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'jazz',
        genre: 'jazz',
      };

      const reggaeDims = inferDimensions(reggaeMetadata);
      const jazzDims = inferDimensions(jazzMetadata);

      // Both should have defined culture dimensions
      expect(reggaeDims.culturePosition).toBeDefined();
      expect(jazzDims.culturePosition).toBeDefined();
    });

    it('should generate synthesis fingerprint that describes the music', () => {
      const metadata: MusicGenerationMetadata = {
        vocalSpectrum: 50,
        prompt: 'energetic happy reggae',
        genre: 'reggae',
        moodTags: ['upbeat', 'tropical'],
      };

      const dimensions = inferDimensions(metadata);

      expect(dimensions.synthesisFingerprint).toBeDefined();
      expect(dimensions.synthesisFingerprint.length).toBeGreaterThan(0);
      // Should be a descriptive paragraph
      expect(dimensions.synthesisFingerprint.length).toBeGreaterThan(50);
    });
  });
});
