import { describe, expect, it } from "vitest";
import { canonicalizeSourceUrl } from "./NewSongInputLinkBox";

describe("canonicalizeSourceUrl", () => {
  it("normalizes localized Ultimate Guitar links for the scraper", () => {
    expect(
      canonicalizeSourceUrl(
        "https://pt.ultimate-guitar.com/tab/l7/mr-integrity-bass-4318679",
      ),
    ).toBe(
      "https://tabs.ultimate-guitar.com/tab/l7/mr-integrity-bass-4318679",
    );
  });

  it("does not change links from other supported sources", () => {
    const url = "https://www.cifraclub.com.br/l7/mr-integrity/";
    expect(canonicalizeSourceUrl(url)).toBe(url);
  });
});
