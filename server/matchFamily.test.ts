import { describe, expect, it } from "vitest";
import { getNextMatchFamilyId, readMatchFamilyId } from "./matchFamily";

describe("Match Family helpers", () => {
  it("reads valid Match Family labels and safely ignores legacy metadata", () => {
    expect(readMatchFamilyId(JSON.stringify({ matchFamilyId: "F-07" }))).toBe("F-07");
    expect(readMatchFamilyId(JSON.stringify({ matchFamilyId: "family-seven" }))).toBeNull();
    expect(readMatchFamilyId("not-json")).toBeNull();
    expect(readMatchFamilyId(null)).toBeNull();
  });

  it("assigns the next human-readable family after the highest existing family", () => {
    expect(getNextMatchFamilyId([])).toBe("F-01");
    expect(getNextMatchFamilyId([
      { metadata: JSON.stringify({ matchFamilyId: "F-01" }) },
      { metadata: JSON.stringify({ matchFamilyId: "F-04" }) },
      { metadata: "legacy-value" },
    ])).toBe("F-05");
  });
});
