import { describe, expect, it } from "vitest";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "../../helpers/presentationConstants";
import {
  ChordParser,
  findBareChordMatches,
  isChordLine,
  isTablatureBlock,
  isTablatureTechniqueLine,
} from "./ChordParser";
import { CifraDocumentModel } from "./CifraDocumentModel";

describe("CifraDocumentModel", () => {
  it("converts a legacy cifra into navigable text marked as a chord", () => {
    const document = CifraDocumentModel.fromLegacyText(
      "[Intro]\n[Am] Hello darkness\n\n[C#sus4] next",
    );

    expect(document.content).toHaveLength(2);
    expect(document.content[0].type).toBe("songBlock");
    expect(document.content[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "text",
          text: "Am",
          marks: expect.arrayContaining([
            expect.objectContaining({
              type: "chord",
              attrs: expect.objectContaining({ raw: "Am", root: "A", quality: "m" }),
            }),
          ]),
        }),
      ]),
    );
  });

  it("keeps structural distribution in the horizontal compatibility text", () => {
    const document = CifraDocumentModel.fromLegacyText("one\n\ntwo");

    expect(CifraDocumentModel.toLegacyText(document, { horizontal: true })).toBe(
      `one\n${PRESENTATION_COLUMN_BREAK_MARKER}\ntwo`,
    );
    expect(CifraDocumentModel.toLegacyText(document)).toBe("one\n\ntwo");
  });

  it("keeps brackets in the editable document and removes them from saved text", () => {
    const document = CifraDocumentModel.fromLegacyText("[ G ] line");

    expect(document.content[0].content.map((node) => node.text || "").join(""))
      .toBe("[ G ] line");
    expect(CifraDocumentModel.toLegacyText(document)).toBe("G line");
    expect(
      CifraDocumentModel.toLegacyText(document, { includeChordBrackets: true }),
    ).toBe("[ G ] line");
  });

  it("automatically converts legacy bare chord lines into editable chord marks", () => {
    const document = CifraDocumentModel.fromLegacyText(
      "E5   C5  D/F#\nA strange illusion",
    );
    const editableText = document.content[0].content
      .map((node) => node.type === "hardBreak" ? "\n" : node.text || "")
      .join("");

    expect(editableText).toBe("[E5]   [C5]  [D/F#]\nA strange illusion");
    expect(CifraDocumentModel.toLegacyText(document)).toBe(
      "E5   C5  D/F#\nA strange illusion",
    );
    expect(document.content[0].content).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "E5",
          marks: expect.arrayContaining([
            expect.objectContaining({ type: "chord" }),
          ]),
        }),
      ]),
    );
  });

  it("classifies multi-line tablature blocks without changing their spacing", () => {
    const tab = [
      "E|---------------------|",
      "B|-12----10----8-------|",
      "G|---------------------|",
      "D|---------------------|",
      "A|-10----9-----7-------|",
      "E|---------------------|",
    ].join("\n");
    const document = CifraDocumentModel.fromLegacyText(tab);

    expect(document.content[0].attrs.tablature).toBe(true);
    expect(CifraDocumentModel.toLegacyText(document)).toBe(tab);
  });

  it("keeps both four-string bass continuations in the Intro block", () => {
    const bassTab = [
      "Se preferir afine as cordas em: Gb, Db, Ab, Eb.",
      "",
      "Intro e Verso:",
      "G-----14----14----14----14-14-|",
      "D-------0h12--------0h12---12-|   (2X)",
      "A-0h12--------0h12------------|",
      "E-----------------------------|",
      "  (T) (P)(T)(P)(T)(P)(T)(P)(P)",
      "",
      "G-----15----15----15----15-15------12----12----12----12-12-|",
      "D-------0h13--------0h13---13--------0h10--------0h10---10-|",
      "A-0h13--------0h13-------------0h10--------0h10------------|",
      "E----------------------------------------------------------|",
      "  (T) (P)(T)(P)(T)(P)(T)(P)(P)  (T)(P)(T)(P)(T)(P)(T)(P)(P)",
      "",
      "Refrão:",
      "G-----9-----9--9h10----10-7---|",
      "D---7--7---7-7-------8-----8--|",
      "A-5------5---------6--------6-|",
      "E-----------------------------|",
    ].join("\n");
    const document = CifraDocumentModel.fromLegacyText(bassTab);

    expect(document.content).toHaveLength(3);
    expect(document.content[1].attrs.tablature).toBe(true);
    const introText = document.content[1].content
      .map((node) => node.type === "hardBreak" ? "\n" : node.text || "")
      .join("");
    expect(introText).toContain("G-----14");
    expect(introText).toContain("G-----15");
    expect(introText).not.toContain("[G]");
  });

  it("repairs a persisted split bass continuation without merging six-string tabs", () => {
    const firstBass = CifraDocumentModel.fromLegacyText([
      "Intro e Verso:",
      "G-----14----|",
      "D-------12--|",
      "A-0h12------|",
      "E-----------|",
      "  (T) (P)(T)(P)",
    ].join("\n")).content[0];
    const secondBass = CifraDocumentModel.fromLegacyText([
      "[G]-----15----|",
      "[D]-------13--|",
      "[A]-0h13------|",
      "[E]-----------|",
      "  (T) (P)(T)(P)",
    ].join("\n")).content[0];
    const sixStringOne = CifraDocumentModel.fromLegacyText(
      "E|---1---|\nB|---1---|\nG|---2---|\nD|---3---|\nA|---3---|\nE|---1---|",
    ).content[0];
    const sixStringTwo = CifraDocumentModel.fromLegacyText(
      "E|---3---|\nB|---3---|\nG|---4---|\nD|---5---|\nA|---5---|\nE|---3---|",
    ).content[0];

    const bassDocument = CifraDocumentModel.normalize({
      type: "doc",
      content: [firstBass, secondBass],
    });
    const guitarDocument = CifraDocumentModel.normalize({
      type: "doc",
      content: [sixStringOne, sixStringTwo],
    });

    expect(bassDocument.content).toHaveLength(1);
    expect(CifraDocumentModel.toLegacyText(bassDocument)).not.toContain("[");
    expect(guitarDocument.content).toHaveLength(2);
  });

  it("normalizes bare chords in persisted documents without losing formatting", () => {
    const document = CifraDocumentModel.normalize({
      type: "doc",
      content: [{
        type: "songBlock",
        attrs: { id: "saved-block", align: "left", level: 0 },
        content: [
          { type: "text", text: "E5", marks: [{ type: "bold" }] },
          { type: "text", text: "   C5" },
        ],
      }],
    });
    const e5 = document.content[0].content.find((node) => node.text === "E5");

    expect(document.content[0].content.map((node) => node.text || "").join(""))
      .toBe("[E5]   [C5]");
    expect(e5.marks).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "bold" }),
      expect.objectContaining({ type: "chord" }),
    ]));
    expect(CifraDocumentModel.toLegacyText(document)).toBe("E5   C5");
  });

  it("drops embedded page payloads from legacy and persisted documents", () => {
    const leakedPayload = '5:["$","$L14",null,{"dangerouslySetInnerHTML":{}}]';
    const legacy = CifraDocumentModel.fromLegacyText(`B   C#m\nlyrics\n${leakedPayload}`);
    const persisted = CifraDocumentModel.normalize({
      type: "doc",
      content: [{
        type: "songBlock",
        attrs: { id: "block-1", align: "left", level: 0 },
        content: [{ type: "text", text: `B   C#m\nlyrics\n${leakedPayload}` }],
      }],
    });

    expect(CifraDocumentModel.toLegacyText(legacy)).toBe("B   C#m\nlyrics");
    expect(CifraDocumentModel.toLegacyText(persisted)).toBe("B   C#m\nlyrics");
  });

  it("loads both versioned documents and legacy text", () => {
    const document = CifraDocumentModel.fromLegacyText("[G/B] line");
    const persisted = CifraDocumentModel.toPersistedDocument(document);

    expect(CifraDocumentModel.fromPersistedDocument(persisted)).toEqual(document);
    expect(CifraDocumentModel.fromPersistedDocument(null, "legacy").content).toHaveLength(1);
  });
});

describe("ChordParser", () => {
  it.each(["C", "Am", "F#m7", "Bb7", "G/B", "C#sus4"])(
    "recognizes %s",
    (value) => expect(ChordParser.parse(value)?.raw).toBe(value),
  );

  it("does not recognize section labels or words", () => {
    expect(ChordParser.parse("Intro")).toBeNull();
    expect(ChordParser.parse("Chorus")).toBeNull();
  });

  it("recognizes complete bare chord lines without matching lyrics", () => {
    expect(isChordLine("A  E/G#  F#m | D")).toBe(true);
    expect(isChordLine("E5   (Passagem 2)")).toBe(true);
    expect(isChordLine("tom: G")).toBe(true);
    expect(findBareChordMatches("A  E/G#  F#m | D").map(({ raw }) => raw))
      .toEqual(["A", "E/G#", "F#m", "D"]);
    expect(isChordLine("A strange illusion")).toBe(false);
    expect(findBareChordMatches("A strange illusion")).toEqual([]);
  });

  it("recognizes guitar and bass tablature groups", () => {
    expect(isTablatureBlock("E|------|\nB|-12---|\nG|------|")).toBe(true);
    expect(isTablatureBlock("G-----14---|\nD-------12-|\nA-0h12-----|\nE----------|")).toBe(true);
    expect(isTablatureTechniqueLine("  (T) (P)(T)(P)(T)(P)")).toBe(true);
    expect(ChordParser.parse("G-----14---|")).toBeNull();
    expect(isTablatureBlock("| G | D |\nregular lyric")).toBe(false);
  });
});
