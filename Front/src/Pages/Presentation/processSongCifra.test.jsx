import { processSongCifra } from "./processSongCifra";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "./helpers/presentationConstants";

describe("processSongCifra", () => {
  it("returns a safe fallback when the cifra is empty", () => {
    expect(processSongCifra("")).toEqual({
      htmlBlocks: [],
      meta: { empty: true },
    });
  });

  it("throws in strict mode when the cifra is invalid", () => {
    expect(() => processSongCifra("", { strict: true })).toThrow(
      "Cifra inválida ou vazia",
    );
  });

  it("creates chord and lyric blocks for a simple song", () => {
    const result = processSongCifra("[Intro]\nC G\nAmazing grace");

    expect(result.htmlBlocks[0]).toContain('class="intro"');
    expect(result.htmlBlocks[0]).toContain('data-chord="C"');
    expect(result.htmlBlocks[0]).toContain('data-chord="G"');
    expect(result.htmlBlocks[0]).toContain("Amazing grace");
  });

  it("keeps tablature blocks grouped inside pre tags", () => {
    const result = processSongCifra("E|----|\nB|----|\nG|----|\nD|----|\nA|----|\nE|----|");

    expect(result.htmlBlocks[0]).toContain('class="verse"');
    expect(result.htmlBlocks[0]).toContain('class="tab"');
    expect(result.htmlBlocks[0]).toContain("E|----|");
  });

  it("creates an internal column break block without rendering marker text", () => {
    const result = processSongCifra(
      `line one\n${PRESENTATION_COLUMN_BREAK_MARKER}\nline two`,
    );

    expect(result.htmlBlocks).toHaveLength(3);
    expect(result.htmlBlocks[1]).toContain("presentation-column-break");
    expect(result.htmlBlocks[1]).not.toContain(PRESENTATION_COLUMN_BREAK_MARKER);
  });
});
