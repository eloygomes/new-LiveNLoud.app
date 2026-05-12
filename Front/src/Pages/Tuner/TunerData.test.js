import {
  getNoteFrequency,
  INSTRUMENT_TUNINGS,
  MAX_UI_FREQ,
  MIN_UI_FREQ,
  NOTE_FREQS,
} from "./TunerData";

describe("TunerData", () => {
  it("returns the exact frequency for a direct note match", () => {
    expect(getNoteFrequency("A4")).toBe(440);
  });

  it("returns the exact frequency when the note is part of a sharp/flat alias", () => {
    expect(getNoteFrequency("Db4")).toBe(NOTE_FREQS["C#4/Db4"]);
  });

  it("returns null for an unknown note", () => {
    expect(getNoteFrequency("H2")).toBeNull();
  });

  it("exposes the expected frequency range for the tuner UI", () => {
    expect(MIN_UI_FREQ).toBe(NOTE_FREQS.C0);
    expect(MAX_UI_FREQ).toBe(NOTE_FREQS.C8);
  });

  it("builds standard guitar tuning with note names and frequencies", () => {
    expect(INSTRUMENT_TUNINGS.Guitar.Standard).toEqual([
      { name: "E2", freq: NOTE_FREQS.E2 },
      { name: "A2", freq: NOTE_FREQS.A2 },
      { name: "D3", freq: NOTE_FREQS.D3 },
      { name: "G3", freq: NOTE_FREQS.G3 },
      { name: "B3", freq: NOTE_FREQS.B3 },
      { name: "E4", freq: NOTE_FREQS.E4 },
    ]);
  });
});
