import { describe, expect, it, vi } from "vitest";
import { BARS, DRUM_VOICES, GROOVE_PRESETS, STEPS, applyGroovePreset, createEmptyPattern, cycleStep, randomizeBar } from "./drumMachineModel";

describe("drum machine pattern model", () => {
  it("creates machine-independent A/B patterns with four 16-step bars", () => {
    const pattern = createEmptyPattern();
    expect(Object.keys(pattern.banks)).toEqual(["A", "B"]);
    expect(Object.keys(pattern.banks.A)).toEqual(DRUM_VOICES);
    expect(pattern.banks.A.kick).toHaveLength(BARS);
    expect(pattern.banks.A.kick[0]).toHaveLength(STEPS);
  });

  it("cycles an off step through normal, accent, and off", () => {
    const normal = cycleStep({ active: false, velocity: 0.82 });
    const accent = cycleStep(normal);
    const off = cycleStep(accent);
    expect(normal).toMatchObject({ active: true, velocity: 0.82 });
    expect(accent).toMatchObject({ active: true, velocity: 1 });
    expect(off.active).toBe(false);
  });

  it("randomizes only the requested bank and bar", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const pattern = createEmptyPattern();
    const randomized = randomizeBar(pattern, "B", 2, 0.5);
    expect(randomized.banks.B.kick[2].some((step) => step.active)).toBe(true);
    expect(randomized.banks.A.kick[2].some((step) => step.active)).toBe(false);
    expect(pattern.banks.B.kick[2].some((step) => step.active)).toBe(false);
    vi.restoreAllMocks();
  });

  it("loads a full groove without changing the other pattern bank", () => {
    const pattern = createEmptyPattern();
    const result = applyGroovePreset(pattern, "A", GROOVE_PRESETS[0]);
    expect(result.banks.A.kick[0][0].active).toBe(true);
    expect(result.banks.A.snare[0][4].active).toBe(true);
    expect(result.banks.B.kick[0][0].active).toBe(false);
  });
});
