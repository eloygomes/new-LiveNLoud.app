import {
  inferDisplayKey,
  transposeChord,
  transposeCifra,
  transposeNote,
} from "./transposeCifra";

describe("transposeCifra", () => {
  it("transposes single notes with flats normalized to sharps", () => {
    expect(transposeNote("Bb", 1)).toBe("B");
    expect(transposeNote("C", -1)).toBe("B");
  });

  it("transposes chords while preserving suffixes and slash bass", () => {
    expect(transposeChord("C#m7", 1)).toBe("Dm7");
    expect(transposeChord("D/F#", 1)).toBe("D#/G");
  });

  it("transposes a cifra body including tom line and tablature frets", () => {
    const source = "Tom: Bb\nC#m7 F#\nE|--0--2--|";
    const result = transposeCifra(source, 1);

    expect(result).toContain("Tom: C");
    expect(result).toContain("Dm7 G");
    expect(result).toContain("E|--1--3--|");
  });

  it("infers the display key from the transposed content", () => {
    expect(inferDisplayKey("Tom: F#\nC D")).toBe("F#");
    expect(inferDisplayKey("C D Em")).toBe("C");
  });
});
