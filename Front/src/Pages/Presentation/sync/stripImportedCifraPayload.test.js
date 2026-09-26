import { describe, expect, it } from "vitest";
import { stripImportedCifraPayload } from "./stripImportedCifraPayload";

describe("stripImportedCifraPayload", () => {
  it("preserves a normal cifra", () => {
    const cifra = "[Intro]\nAm G Dm\nAshes to ashes";
    expect(stripImportedCifraPayload(cifra)).toBe(cifra);
  });

  it("removes an appended React server payload", () => {
    const cifra = 'Am G Dm\nHitting an all-time low5:["$","$L17",null,{"translations":{}}]';
    expect(stripImportedCifraPayload(cifra)).toBe(
      "Am G Dm\nHitting an all-time low",
    );
  });

  it("removes payloads glued to the last musical token with whitespace", () => {
    const cifra = '[Instrumental] Am  G  Dm  Am5: ["$","$L17",null,{}]';
    expect(stripImportedCifraPayload(cifra)).toBe(
      "[Instrumental] Am  G  Dm  Am",
    );
  });

  it("handles non-string input safely", () => {
    expect(stripImportedCifraPayload(null)).toBe("");
  });
});
