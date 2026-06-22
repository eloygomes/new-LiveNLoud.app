import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLiveSetlistKeyboardNavigation } from "./Presentation";

describe("useLiveSetlistKeyboardNavigation", () => {
  it("maps ArrowLeft to previous item and ArrowRight to next item", () => {
    const moveLiveSetlistSelection = vi.fn();

    renderHook(() =>
      useLiveSetlistKeyboardNavigation({
        effectiveLiveMode: true,
        liveView: "setlist",
        moveLiveSetlistSelection,
      }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(moveLiveSetlistSelection).toHaveBeenNthCalledWith(1, -1);
    expect(moveLiveSetlistSelection).toHaveBeenNthCalledWith(2, 1);
  });

  it("ignores keyboard arrows outside live setlist view", () => {
    const moveLiveSetlistSelection = vi.fn();

    renderHook(() =>
      useLiveSetlistKeyboardNavigation({
        effectiveLiveMode: true,
        liveView: "cifra",
        moveLiveSetlistSelection,
      }),
    );

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    });

    expect(moveLiveSetlistSelection).not.toHaveBeenCalled();
  });
});
