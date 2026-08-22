import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const generatePage = fs.readFileSync(
  path.join(process.cwd(), "client/src/pages/Generate.tsx"),
  "utf-8"
);

describe("Generate prompt budget", () => {
  it("keeps Art Direction aligned with MiniMax's 2,000-character server ceiling", () => {
    expect(generatePage).toContain("maxLength={2000}");
    expect(generatePage).toContain("${prompt.length}/2000");
    expect(generatePage).not.toContain("${prompt.length}/1000");
  });
});
