import { describe, expect, it } from "vitest";
import { syncInstrumentSetlistTags } from "./instrumentSetlistTags";

describe("syncInstrumentSetlistTags", () => {
  it("adds the canonical setlist tag for every imported instrument", () => {
    expect(
      syncInstrumentSetlistTags(["rehearsal"], {
        guitar01: true,
        guitar02: true,
        bass: true,
        keys: false,
        drums: true,
        voice: false,
      }),
    ).toEqual(["rehearsal", "guitar", "bass", "drums"]);
  });

  it("removes managed tags when their instruments are removed", () => {
    expect(
      syncInstrumentSetlistTags(["guitar", "bass", "favorites"], {
        guitar01: false,
        guitar02: true,
        bass: false,
      }),
    ).toEqual(["favorites", "guitar"]);
  });
});
