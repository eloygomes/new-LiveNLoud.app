import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePresentationChordTooltip } from "./usePresentationChordTooltip";

describe("usePresentationChordTooltip", () => {
  it("opens a chord popover by click for touch interaction", () => {
    const content = document.createElement("div");
    content.innerHTML = '<span class="notespresentation" data-chord="C" data-chord-id="chord-1">C</span>';
    document.body.appendChild(content);

    const { result, unmount } = renderHook(() =>
      usePresentationChordTooltip({
        contentRef: { current: content },
        isEditing: false,
      }),
    );

    act(() => {
      content.querySelector("[data-chord]").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(result.current.tooltip?.chord).toBe("C");
    expect(result.current.tooltip?.data?.chordId).toBe("chord-1");

    unmount();
    content.remove();
  });
});
