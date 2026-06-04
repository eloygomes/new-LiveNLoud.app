import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePresentationLiveMode } from "./usePresentationLiveMode";

const makeProps = (overrides = {}) => {
  const root = document.createElement("div");
  const viewport = document.createElement("div");
  viewport.focus = vi.fn();
  viewport.scrollTo = vi.fn();
  viewport.scrollBy = vi.fn();

  return {
    activeProgressionRenderColumns: [],
    closeTouchVideo: vi.fn(),
    effectiveLiveMode: false,
    hideChords: false,
    hideTooltip: vi.fn(),
    isEditing: false,
    isTouchLayout: false,
    liveModeRootRef: { current: root },
    presentationContentRef: { current: viewport },
    pushSnackbarMessage: vi.fn(),
    selectContenttoShow: "default",
    setActiveLiveColumnKey: vi.fn(),
    setActiveShowProgressionMarkers: vi.fn(),
    setIsLiveMode: vi.fn(),
    setIsPseudoLiveMode: vi.fn(),
    shouldUseHorizontalColumnFlow: false,
    ...overrides,
  };
};

describe("usePresentationLiveMode", () => {
  it("falls back to pseudo live mode on touch layouts without fullscreen", async () => {
    const props = makeProps({
      isTouchLayout: true,
    });

    const { result } = renderHook(() => usePresentationLiveMode(props));

    await act(async () => {
      await result.current.enterLiveMode();
    });

    expect(props.setActiveShowProgressionMarkers).toHaveBeenCalledWith(false);
    expect(props.setIsPseudoLiveMode).toHaveBeenCalledWith(true);
    expect(props.setIsLiveMode).not.toHaveBeenCalledWith(true);
  });

  it("reports an error when desktop fullscreen fails", async () => {
    const requestFullscreen = vi.fn().mockRejectedValue(new Error("denied"));
    const props = makeProps({
      liveModeRootRef: {
        current: {
          requestFullscreen,
        },
      },
    });

    const { result } = renderHook(() => usePresentationLiveMode(props));

    await act(async () => {
      await result.current.enterLiveMode();
    });

    expect(requestFullscreen).toHaveBeenCalled();
    expect(props.pushSnackbarMessage).toHaveBeenCalledWith(
      "Erro",
      "Não foi possível abrir o modo LIVE em tela cheia.",
    );
  });

  it("runs forced cleanup event handlers", () => {
    const props = makeProps();

    renderHook(() => usePresentationLiveMode(props));

    act(() => {
      window.dispatchEvent(new Event("presentation-force-cleanup"));
    });

    expect(props.hideTooltip).toHaveBeenCalled();
    expect(props.setIsPseudoLiveMode).toHaveBeenCalledWith(false);
    expect(props.setIsLiveMode).toHaveBeenCalledWith(false);
    expect(props.closeTouchVideo).toHaveBeenCalled();
  });
});
