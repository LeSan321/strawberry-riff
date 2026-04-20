import { describe, it, expect, vi, beforeEach } from "vitest";
import { toggleMusicGenerationFavorite } from "./db";

// Mock the database
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return {
    ...actual,
    toggleMusicGenerationFavorite: vi.fn(),
  };
});

describe("toggleMusicGenerationFavorite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should toggle favorite status from false to true", async () => {
    const mockToggle = vi.mocked(toggleMusicGenerationFavorite);
    mockToggle.mockResolvedValueOnce(true);

    const result = await toggleMusicGenerationFavorite(1, 100);
    expect(result).toBe(true);
    expect(mockToggle).toHaveBeenCalledWith(1, 100);
  });

  it("should toggle favorite status from true to false", async () => {
    const mockToggle = vi.mocked(toggleMusicGenerationFavorite);
    mockToggle.mockResolvedValueOnce(true);

    const result = await toggleMusicGenerationFavorite(2, 100);
    expect(result).toBe(true);
    expect(mockToggle).toHaveBeenCalledWith(2, 100);
  });

  it("should return false if generation not found", async () => {
    const mockToggle = vi.mocked(toggleMusicGenerationFavorite);
    mockToggle.mockResolvedValueOnce(false);

    const result = await toggleMusicGenerationFavorite(999, 100);
    expect(result).toBe(false);
  });

  it("should return false if user does not own the generation", async () => {
    const mockToggle = vi.mocked(toggleMusicGenerationFavorite);
    mockToggle.mockResolvedValueOnce(false);

    const result = await toggleMusicGenerationFavorite(1, 999);
    expect(result).toBe(false);
  });
});
