import { describe, expect, it } from "vitest";
import { canAttemptStallRecovery } from "../client/src/contexts/AudioPlayerContext";

describe("audio player stall recovery policy", () => {
  it("recovers a playing track once before allowing normal media errors to take over", () => {
    expect(canAttemptStallRecovery(true, 0)).toBe(true);
    expect(canAttemptStallRecovery(true, 1)).toBe(false);
  });

  it("never reloads a track that the creator has paused", () => {
    expect(canAttemptStallRecovery(false, 0)).toBe(false);
  });
});
