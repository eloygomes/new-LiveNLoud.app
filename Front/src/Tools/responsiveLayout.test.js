import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  getIsCompactAppLayout,
  useCompactAppLayout,
} from "./responsiveLayout";

describe("getIsCompactAppLayout", () => {
  it("uses the compact layout on phones and portrait tablets up to 1279px", () => {
    expect(getIsCompactAppLayout({ innerWidth: 440, innerHeight: 956 })).toBe(true);
    expect(getIsCompactAppLayout({ innerWidth: 768, innerHeight: 1024 })).toBe(true);
    expect(getIsCompactAppLayout({ innerWidth: 1279, innerHeight: 1366 })).toBe(true);
  });

  it("uses the desktop layout at 1280px or on sub-1280 landscape screens", () => {
    expect(getIsCompactAppLayout({ innerWidth: 1280, innerHeight: 1600 })).toBe(false);
    expect(getIsCompactAppLayout({ innerWidth: 1024, innerHeight: 768 })).toBe(false);
  });

  it("rerenders consumers when phone and tablet are both compact", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 767,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    const { result } = renderHook(() => {
      const compact = useCompactAppLayout();
      return compact && window.innerWidth >= 768 ? "tablet" : "phone";
    });

    expect(result.current).toBe("phone");

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        value: 768,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe("tablet");
  });
});
