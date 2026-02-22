/**
 * Portfolio pie path: single holding (100%) must produce a full-circle path (two arcs).
 * Run: npm run test:auth or npx vitest run src/utils/portfolioPiePath.test.ts
 */
import { describe, it, expect } from "vitest";
import { getPieSlicePathD } from "./portfolioPiePath";

describe("getPieSlicePathD", () => {
  it("returns path with two arcs for 360° (single holding 100%)", () => {
    const d = getPieSlicePathD(100, 100, 80, 0, 360);
    const arcCount = (d.match(/\sA\s/g) ?? []).length;
    expect(arcCount).toBe(2);
    expect(d).not.toContain("NaN");
    expect(d.length).toBeGreaterThan(20);
  });

  it("returns path with one arc for 180° slice", () => {
    const d = getPieSlicePathD(100, 100, 80, 0, 180);
    const arcCount = (d.match(/\sA\s/g) ?? []).length;
    expect(arcCount).toBe(1);
    expect(d).not.toContain("NaN");
  });

  it("single holding edge: angle 359.5 uses full circle", () => {
    const d = getPieSlicePathD(100, 100, 80, 0, 359.5);
    expect((d.match(/\sA\s/g) ?? []).length).toBe(2);
  });

  it("two slices: first 60°, second 300° each valid", () => {
    const d1 = getPieSlicePathD(100, 100, 80, 0, 60);
    const d2 = getPieSlicePathD(100, 100, 80, 60, 300);
    expect(d1).not.toContain("NaN");
    expect(d2).not.toContain("NaN");
    expect((d2.match(/\sA\s/g) ?? []).length).toBe(2);
  });
});
