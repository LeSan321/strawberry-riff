import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { users, musicGenerations, tracks } from '../drizzle/schema';

/**
 * Tests for auto-inference of cover art dimensions on track publish
 * 
 * This test suite verifies that when a track is published from a music generation,
 * the system automatically infers cover art dimensions and stores them in the database.
 */
describe('Music Generation Publish with Auto-Inference', () => {
  let db: any;
  let testUserId: number;
  let testGenerationId: number;

  beforeEach(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create a test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      role: 'user',
    });
    testUserId = (userResult[0] as any).insertId;

    // Create a completed music generation
    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Test Song for Dimension Inference',
      prompt: 'energetic upbeat dance electronic',
      lyrics: 'Test lyrics for dimension inference',
      duration: 180,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key',
      status: 'complete',
      vocalSpectrumValue: 75,
      visualBrief: 'Test visual brief',
    });
    testGenerationId = (genResult[0] as any).insertId;
  });

  afterEach(async () => {
    if (!db) return;

    // Clean up test data
    await db.delete(tracks).where(eq(tracks.userId, testUserId));
    await db.delete(musicGenerations).where(eq(musicGenerations.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should store musicGenerationId when publishing a track', async () => {
    if (!db) throw new Error('Database not available');

    // Create a track from the generation (simulating publish)
    const trackResult = await db.insert(tracks).values({
      userId: testUserId,
      musicGenerationId: testGenerationId,
      title: 'Test Song for Dimension Inference',
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key',
      duration: 180,
      visibility: 'private',
    });
    const trackId = (trackResult[0] as any).insertId;

    // Verify the track has the musicGenerationId
    const trackData = await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1);
    expect(trackData[0]).toBeDefined();
    expect(trackData[0].musicGenerationId).toBe(testGenerationId);
  });

  it('should infer expansive energy for upbeat music', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    // Create a generation with upbeat keywords
    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Upbeat Dance Track',
      prompt: 'energetic upbeat dance electronic bright',
      lyrics: 'Test lyrics',
      duration: 180,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key-2',
      status: 'complete',
      vocalSpectrumValue: 80,
    });
    const genId = (genResult[0] as any).insertId;

    // Get generation and infer dimensions
    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, genId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: ['energetic', 'uplifting'],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);

    // Verify expansive energy was inferred
    expect(dimensions.energyDirection).toBe('expansive');
  });

  it('should infer compressive energy for intimate music', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    // Create a generation with intimate keywords
    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Intimate Acoustic Track',
      prompt: 'intimate acoustic bedroom vulnerable',
      lyrics: 'Test lyrics',
      duration: 180,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key-3',
      status: 'complete',
      vocalSpectrumValue: 25,
    });
    const genId = (genResult[0] as any).insertId;

    // Get generation and infer dimensions
    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, genId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: ['intimate', 'introspective'],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);

    // Verify compressive energy was inferred
    expect(dimensions.energyDirection).toBe('compressive');
  });

  it('should generate synthesis fingerprint describing the music', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, testGenerationId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: [],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);

    // Verify synthesis fingerprint exists and is descriptive
    expect(dimensions.synthesisFingerprint).toBeDefined();
    expect(dimensions.synthesisFingerprint.length).toBeGreaterThan(50);
    expect(typeof dimensions.synthesisFingerprint).toBe('string');
  });

  it('should preserve all 15 dimensions through inference', async () => {
    const { inferDimensions, serializeDimensions, deserializeDimensions } = await import('./coverArt/dimensionInference');

    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, testGenerationId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: [],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);
    const serialized = serializeDimensions(dimensions);
    const deserialized = deserializeDimensions(serialized);

    // Check all 15 dimensions are preserved
    expect(deserialized.energyDirection).toBe(dimensions.energyDirection);
    expect(deserialized.energyShape).toBe(dimensions.energyShape);
    expect(deserialized.energyTexture).toBe(dimensions.energyTexture);
    expect(deserialized.energyWeight).toBe(dimensions.energyWeight);
    expect(deserialized.energyPace).toBe(dimensions.energyPace);
    expect(deserialized.emotionStance).toBe(dimensions.emotionStance);
    expect(deserialized.emotionResolution).toBe(dimensions.emotionResolution);
    expect(deserialized.emotionIntensity).toBe(dimensions.emotionIntensity);
    expect(deserialized.emotionTone).toBe(dimensions.emotionTone);
    expect(deserialized.emotionMovement).toBe(dimensions.emotionMovement);
    expect(deserialized.culturePosition).toBe(dimensions.culturePosition);
    expect(deserialized.cultureAuthenticity).toBe(dimensions.cultureAuthenticity);
    expect(deserialized.cultureDensity).toBe(dimensions.cultureDensity);
    expect(deserialized.cultureTemporality).toBe(dimensions.cultureTemporality);
    expect(deserialized.cultureReference).toBe(dimensions.cultureReference);
  });

  it('should handle missing or null generation fields gracefully', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    // Create a minimal generation with only required fields
    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Minimal Generation',
      prompt: 'song',
      lyrics: 'lyrics',
      duration: 120,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key-4',
      status: 'complete',
      // vocalSpectrumValue not set (will be null)
      // visualBrief not set (will be null)
    });
    const genId = (genResult[0] as any).insertId;

    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, genId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: [],
      genre: undefined,
      duration: 120,
      vocalGender: undefined,
    };

    // Should not throw
    const dimensions = inferDimensions(metadata);

    expect(dimensions).toBeDefined();
    expect(dimensions.energyDirection).toBeDefined();
    expect(dimensions.synthesisFingerprint).toBeDefined();
  });

  it('should infer warm tone for warm music keywords', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Warm Cozy Track',
      prompt: 'warm cozy intimate golden sunset',
      lyrics: 'lyrics',
      duration: 180,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key-5',
      status: 'complete',
    });
    const genId = (genResult[0] as any).insertId;

    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, genId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: [],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);

    expect(dimensions.emotionTone).toBe('warm');
  });

  it('should infer cool tone for cool music keywords', async () => {
    const { inferDimensions } = await import('./coverArt/dimensionInference');

    const genResult = await db.insert(musicGenerations).values({
      userId: testUserId,
      title: 'Cool Crisp Track',
      prompt: 'cool cold icy crisp blue',
      lyrics: 'lyrics',
      duration: 180,
      audioUrl: 'https://example.com/audio.mp3',
      audioKey: 'test-audio-key-6',
      status: 'complete',
    });
    const genId = (genResult[0] as any).insertId;

    const genData = await db.select().from(musicGenerations).where(eq(musicGenerations.id, genId)).limit(1);
    const gen = genData[0];

    const metadata = {
      vocalSpectrum: gen.vocalSpectrumValue ?? 50,
      visualBrief: gen.visualBrief ?? undefined,
      prompt: gen.prompt,
      moodTags: [],
      genre: undefined,
      duration: 180,
      vocalGender: undefined,
    };

    const dimensions = inferDimensions(metadata);

    expect(dimensions.emotionTone).toBe('cool');
  });
});
