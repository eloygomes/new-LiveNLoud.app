import { describe, expect, it } from "vitest";
import { MACHINE_PROFILES, MACHINE_SOUND_PROFILES } from "./machineProfiles";

describe("drum machine profiles", () => {
  it("provides a distinct sound profile for every collection machine", () => {
    expect(MACHINE_PROFILES).toHaveLength(11);
    MACHINE_PROFILES.forEach(({ id }) => expect(MACHINE_SOUND_PROFILES[id]).toBeDefined());
    expect(new Set(MACHINE_PROFILES.map(({ id }) => id)).size).toBe(MACHINE_PROFILES.length);
  });

  it("keeps synthesis, hybrid and sample-ready engines explicit", () => {
    expect(MACHINE_PROFILES.find(({ id }) => id === "tr808").engine).toBe("synthesis");
    expect(MACHINE_PROFILES.find(({ id }) => id === "tr909").engine).toBe("hybrid");
    expect(MACHINE_PROFILES.find(({ id }) => id === "lm1").engine).toBe("sample-ready");
  });
});
