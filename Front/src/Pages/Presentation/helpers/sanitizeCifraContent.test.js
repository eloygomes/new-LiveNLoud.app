import { describe, expect, it } from "vitest";
import {
  hasEmbeddedPagePayload,
  sanitizeCifraContent,
} from "./sanitizeCifraContent";

describe("sanitizeCifraContent", () => {
  it("removes leaked React and JSON-LD payloads without touching the cifra", () => {
    const contaminated = [
      "[Verse]",
      "B   C#m   F#",
      "Keep fishin' if you feel it's true",
      '(B)5:["$","$L14",null,{"translations":{},"language":"pt-BR","dangerouslySetInnerHTML":{"__html":"{\\"@context\\":\\"https://schema.org\\"}"}}]',
    ].join("\n");

    expect(hasEmbeddedPagePayload(contaminated)).toBe(true);
    expect(sanitizeCifraContent(contaminated)).toBe(
      "[Verse]\nB   C#m   F#\nKeep fishin' if you feel it's true",
    );
  });

  it("keeps ordinary chords, tablature, JSON-like section text and spacing", () => {
    const cifra = "[Intro]\nB   C#m   F#\nE|----4----|\n{acoustic version}";

    expect(hasEmbeddedPagePayload(cifra)).toBe(false);
    expect(sanitizeCifraContent(cifra)).toBe(cifra);
  });
});
