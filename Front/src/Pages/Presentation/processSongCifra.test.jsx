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

  it("preserves adjacent chord names, extensions and slash bass notes exactly", () => {
    const result = processSongCifra(
      "[Intro]\nA  Amaj7 A  A/G#\n\n[Verse]\nDmaj7/F#   C#7\nSomething inside the cards I know is right",
    );
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain('data-chord="A"');
    expect(html).toContain('data-chord="Amaj7"');
    expect(html).toContain('data-chord="A/G#"');
    expect(html).toContain('data-chord="Dmaj7/F#"');
    expect(html).toContain('data-chord="C#7"');
    expect(html).not.toContain("AAaA/G");
    expect(html).not.toContain("DF#j7");
  });

  it("does not classify section words as chords", () => {
    const result = processSongCifra("Chorus\nBridge\nCoda");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain("Chorus");
    expect(html).toContain("Bridge");
    expect(html).toContain("Coda");
    expect(html).not.toContain('data-chord="Chorus"');
    expect(html).not.toContain('data-chord="Bridge"');
    expect(html).not.toContain('data-chord="Coda"');
  });

  it("marks bracketed section labels with the structural accent class", () => {
    const result = processSongCifra("[Chorus]\nA E\nSing it");
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain("presentation-section-label chorus");
    expect(html).toContain(">[Chorus]</pre>");
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

  it("keeps a pipe-less bass tab and its technique row in one tab", () => {
    const result = processSongCifra(
      "G-----14----|\nD-------12--|\nA-0h12------|\nE-----------|\n  (T) (P)(T)(P)",
    );
    const html = result.htmlBlocks.join("\n");

    expect(html).toContain('class="tab"');
    expect(html).toContain("G-----14----|");
    expect(html).toContain("(T) (P)(T)(P)");
    expect(html).not.toContain("notespresentation");
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
