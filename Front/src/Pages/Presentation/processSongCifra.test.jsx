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

  it("marks each chord inside parenthesized chord groups", () => {
    const result = processSongCifra("(Dsus4 D Dsus2 D Dsus2)");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain('data-chord="Dsus4"');
    expect(html).toContain('data-chord="D"');
    expect(html).toContain('data-chord="Dsus2"');
    expect(html.match(/class="notespresentation"/g)).toHaveLength(5);
  });

  it("marks manually bracketed chords inside lyric lines", () => {
    const result = processSongCifra("Primeira Parte [F]");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain("Primeira Parte ");
    expect(html).toContain('data-chord="F"');
    expect(html).not.toContain("[F]");
  });

  it("marks manually bracketed chords with inner spaces", () => {
    const result = processSongCifra("[ E7 ]\nDid you think I'd crumble?");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain('class="mt-1 presentation-chord-lyrics"');
    expect(html).toContain('data-chord="E7"');
    expect(html).toContain("Did you think I'd crumble?");
  });

  it("keeps manually bracketed chords above following lyrics when they touch", () => {
    const result = processSongCifra("[Bm]\nDown to the water");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain('class="mt-1 presentation-chord-lyrics"');
    expect(html).toContain('data-chord="Bm"');
    expect(html).toContain("Down to the water");
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
