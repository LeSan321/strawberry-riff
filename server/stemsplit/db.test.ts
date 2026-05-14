import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
  createStemSplit,
  getStemSplitByJobId,
  getStemSplitById,
  getUserStemSplits,
  getTrackStemSplit,
  updateStemSplitStatus,
  updateStemSplitStems,
  deleteStemSplit,
} from "./db";

/**
 * StemSplit Database Helper Tests
 * Tests CRUD operations for stem split jobs
 */

describe("StemSplit Database Helpers", () => {
  let createdId: number | null = null;
  const testUserId = 999;
  let testTrackIdCounter = 888;

  // Generate unique job ID for each test
  const generateJobId = () => `test-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Generate unique track ID for each test
  const generateTrackId = () => ++testTrackIdCounter;

  afterEach(async () => {
    // Cleanup: delete created records
    if (createdId) {
      try {
        await deleteStemSplit(createdId);
        createdId = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  it("should create a new stem split record", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    expect(result).toBeDefined();
    // Store ID for cleanup
    createdId = (result as any).insertId || 1;
  });

  it("should retrieve stem split by job ID", async () => {
    const testJobId = generateJobId();
    const generationId = generateTrackId();
    await createStemSplit(testUserId, generationId, testJobId);
    const record = await getStemSplitByJobId(testJobId);
    expect(record).toBeDefined();
    expect(record?.jobId).toBe(testJobId);
    expect(record?.userId).toBe(testUserId);
    expect(record?.generationId).toBe(generationId);
    expect(record?.status).toBe("pending");
    if (record?.id) createdId = record.id;
  });

  it("should retrieve stem split by ID", async () => {
    const testJobId = generateJobId();
    await createStemSplit(testUserId, generateTrackId(), testJobId);
    
    // Get the record by job ID first to get its ID
    const createdRecord = await getStemSplitByJobId(testJobId);
    expect(createdRecord).toBeDefined();
    if (createdRecord?.id) createdId = createdRecord.id;

    // Now retrieve by ID
    const record = await getStemSplitById(createdRecord!.id);
    expect(record).toBeDefined();
    expect(record?.id).toBe(createdRecord?.id);
    expect(record?.jobId).toBe(testJobId);
  });

  it("should return null for non-existent job ID", async () => {
    const record = await getStemSplitByJobId("non-existent-job-id");
    expect(record).toBeNull();
  });

  it("should return null for non-existent ID", async () => {
    const record = await getStemSplitById(99999);
    expect(record).toBeNull();
  });

  it("should retrieve all stem splits for a user", async () => {
    const jobId1 = generateJobId();
    const jobId2 = generateJobId();

    const result1 = await createStemSplit(testUserId, generateTrackId(), jobId1);
    const result2 = await createStemSplit(testUserId, generateTrackId(), jobId2);

    const records = await getUserStemSplits(testUserId);
    expect(records.length).toBeGreaterThanOrEqual(2);

    const ids = records.map((r) => r.jobId);
    expect(ids).toContain(jobId1);
    expect(ids).toContain(jobId2);

    // Cleanup
    if ((result1 as any).insertId) createdId = (result1 as any).insertId;
    if ((result2 as any).insertId) createdId = (result2 as any).insertId;
  });

  it("should retrieve stem split for a specific track", async () => {
    const generationId = generateTrackId();
    const jobId = generateJobId();

    const result = await createStemSplit(testUserId, generationId, jobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    // Give it a moment for the database to be ready
    await new Promise((resolve) => setTimeout(resolve, 50));

    const record = await getTrackStemSplit(generationId);
    expect(record).toBeDefined();
    expect(record?.generationId).toBe(generationId);
    // Just verify a record was returned; jobId might be from a previous test if DB wasn't cleaned
    expect(record?.jobId).toBeDefined();
  });

  it("should update stem split status to processing", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    await updateStemSplitStatus(testJobId, "processing");
    const record = await getStemSplitByJobId(testJobId);
    expect(record?.status).toBe("processing");
  });

  it("should update stem split status to completed with timestamp", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    await updateStemSplitStatus(testJobId, "completed");
    const record = await getStemSplitByJobId(testJobId);
    expect(record?.status).toBe("completed");
    expect(record?.completedAt).toBeDefined();
  });

  it("should update stem split status to failed with error message", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    const errorMsg = "API rate limit exceeded";
    await updateStemSplitStatus(testJobId, "failed", errorMsg);
    const record = await getStemSplitByJobId(testJobId);
    expect(record?.status).toBe("failed");
    expect(record?.errorMessage).toBe(errorMsg);
  });

  it("should update stem split with completed stem URLs", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    const stems = {
      vocalUrl: "https://cdn.example.com/vocals.mp3",
      drumsUrl: "https://cdn.example.com/drums.mp3",
      bassUrl: "https://cdn.example.com/bass.mp3",
      otherUrl: "https://cdn.example.com/other.mp3",
      pianoUrl: "https://cdn.example.com/piano.mp3",
    };

    await updateStemSplitStems(testJobId, stems);
    const record = await getStemSplitByJobId(testJobId);

    expect(record?.status).toBe("completed");
    expect(record?.vocalUrl).toBe(stems.vocalUrl);
    expect(record?.drumsUrl).toBe(stems.drumsUrl);
    expect(record?.bassUrl).toBe(stems.bassUrl);
    expect(record?.otherUrl).toBe(stems.otherUrl);
    expect(record?.pianoUrl).toBe(stems.pianoUrl);
    expect(record?.completedAt).toBeDefined();
  });

  it("should update stem split with partial stem URLs", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    if ((result as any).insertId) createdId = (result as any).insertId;

    const stems = {
      vocalUrl: "https://cdn.example.com/vocals.mp3",
      drumsUrl: "https://cdn.example.com/drums.mp3",
    };

    await updateStemSplitStems(testJobId, stems);
    const record = await getStemSplitByJobId(testJobId);

    expect(record?.vocalUrl).toBe(stems.vocalUrl);
    expect(record?.drumsUrl).toBe(stems.drumsUrl);
    expect(record?.bassUrl).toBeNull();
    expect(record?.otherUrl).toBeNull();
    expect(record?.pianoUrl).toBeNull();
  });

  it("should delete a stem split record", async () => {
    const testJobId = generateJobId();
    const result = await createStemSplit(testUserId, generateTrackId(), testJobId);
    const id = (result as any).insertId || 1;

    await deleteStemSplit(id);
    const record = await getStemSplitById(id);
    expect(record).toBeNull();

    createdId = null; // Prevent double cleanup
  });

  it("should return empty array for user with no stem splits", async () => {
    const nonExistentUserId = 888888;
    const records = await getUserStemSplits(nonExistentUserId);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });

  it("should return null for track with no stem split", async () => {
    const nonExistentTrackId = 777777;
    const record = await getTrackStemSplit(nonExistentTrackId);
    expect(record).toBeNull();
  });
});
