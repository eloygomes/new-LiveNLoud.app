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
    hideTooltip: vi.fn(),
    isEditing: false,
    isTouchLayout: false,
    liveModeRootRef: { current: root },
    presentationContentRef: { current: viewport },
    pushSnackbarMessage: vi.fn(),
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

  it("scrolls Tiptap columns so each next block aligns with the first one", () => {
    const props = makeProps();
    const viewport = props.presentationContentRef.current;
    const surface = document.createElement("div");
    surface.className =
      "presentation-tiptap-surface presentation-horizontal-columns";

    [40, 500, 960].forEach((offsetLeft) => {
      const block = document.createElement("div");
      block.className = "presentation-editor-block";
      Object.defineProperty(block, "offsetLeft", { value: offsetLeft });
      Object.defineProperty(block, "clientWidth", { value: 400 });
      surface.appendChild(block);
    });
    viewport.appendChild(surface);
    Object.defineProperty(viewport, "clientWidth", { value: 900 });
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const { result } = renderHook(() => usePresentationLiveMode(props));

    act(() => result.current.scrollExpandedLayout(1));
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: 460,
      behavior: "auto",
    });

    viewport.scrollLeft = 460;
    act(() => result.current.scrollExpandedLayout(1));
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: 920,
      behavior: "auto",
    });
  });

  it("navigates through visual continuation columns inside the fixed horizontal page", () => {
    const props = makeProps();
    const viewport = props.presentationContentRef.current;
    const surface = document.createElement("div");
    const editorWrapper = document.createElement("div");
    const editor = document.createElement("div");
    surface.className =
      "presentation-tiptap-surface presentation-horizontal-columns";
    surface.style.setProperty("--presentation-block-gap", "32px");
    editor.className = "presentation-cifra-editor";
    editorWrapper.appendChild(editor);
    surface.appendChild(editorWrapper);
    viewport.appendChild(surface);

    Object.defineProperty(editor, "clientWidth", { value: 400 });
    Object.defineProperty(viewport, "clientWidth", { value: 900 });
    Object.defineProperty(viewport, "scrollWidth", { value: 2200 });
    Object.defineProperty(viewport, "scrollLeft", {
      configurable: true,
      value: 0,
      writable: true,
    });

    const { result } = renderHook(() => usePresentationLiveMode(props));

    act(() => result.current.scrollExpandedLayout(1));
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: 432,
      behavior: "auto",
    });

    viewport.scrollLeft = 432;
    act(() => result.current.scrollExpandedLayout(1));
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({
      left: 864,
      behavior: "auto",
    });
  });
});
