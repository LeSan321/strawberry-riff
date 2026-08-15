export const FUSION_ANCHOR_ROLES = [
  "carry-hook",
  "trade-phrases",
  "haunt-edges",
] as const;

export type FusionAnchorRole = (typeof FUSION_ANCHOR_ROLES)[number];

export const FUSION_VOCAL_RELATIONSHIPS = [
  "open-verses",
  "call-and-response",
  "instrumental-breaks",
] as const;

export type FusionVocalRelationship = (typeof FUSION_VOCAL_RELATIONSHIPS)[number];

export interface FusionPlan {
  version: 1;
  anchorRole: FusionAnchorRole;
  vocalRelationship: FusionVocalRelationship;
  tempo: number;
  creatorDirection: string;
}

export const FUSION_ROLE_COPY: Record<FusionAnchorRole, { label: string; description: string }> = {
  "carry-hook": {
    label: "Carry the hook",
    description: "Let this instrument own recurring phrases, fills, and short solo moments.",
  },
  "trade-phrases": {
    label: "Trade phrases",
    description: "Let it answer the groove in a clear call-and-response relationship.",
  },
  "haunt-edges": {
    label: "Haunt the edges",
    description: "Keep its signature present in motifs and transitions without making it the constant lead.",
  },
};

export const FUSION_VOCAL_RELATIONSHIP_COPY: Record<FusionVocalRelationship, { label: string; description: string }> = {
  "open-verses": {
    label: "Leave verse space",
    description: "Let the anchor speak, then leave open phrases for a future singer.",
  },
  "call-and-response": {
    label: "Make room for dialogue",
    description: "Build answer spaces where a future voice and anchor can trade phrases.",
  },
  "instrumental-breaks": {
    label: "Keep instrumental breaks",
    description: "Give the anchor room to return in full during transitions and breaks.",
  },
};

export function getTempoFromDirection(direction: string): number | null {
  const match = direction.match(/\b(4[0-9]|[5-9][0-9]|1[0-9]{2}|2[0-2][0-9]|230)\s*bpm\b/i);
  return match ? Number(match[1]) : null;
}
