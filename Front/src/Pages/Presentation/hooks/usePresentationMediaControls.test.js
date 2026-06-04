import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePresentationMediaControls } from "./usePresentationMediaControls";

describe("usePresentationMediaControls", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the only Guitar Pro file without prompting", () => {
    const file = { originalName: "song.gp5", url: "/song.gp5" };
    const promptSpy = vi.spyOn(window, "prompt");

    const { result } = renderHook(() =>
      usePresentationMediaControls({
        instrumentSelected: "keys",
        songDataFetched: {
          guitarProFiles: [file],
        },
      }),
    );

    expect(result.current.canOpenGuitarPro).toBe(true);

    act(() => {
      result.current.openGuitarProViewer();
    });

    expect(promptSpy).not.toHaveBeenCalled();
    expect(result.current.guitarProViewerOpen).toBe(true);
    expect(result.current.selectedGuitarProFile).toBe(file);
  });

  it("selects a prompted Guitar Pro file and resets media state", () => {
    vi.spyOn(window, "prompt").mockReturnValue("2");
    const files = [
      { originalName: "first.gp5" },
      { originalName: "second.gp5" },
    ];

    const { result } = renderHook(() =>
      usePresentationMediaControls({
        instrumentSelected: "guitar01",
        songDataFetched: {
          guitarProFiles: files,
        },
      }),
    );

    act(() => {
      result.current.setTouchVideoLink("https://video.example");
      result.current.setIsTouchVideoActive(true);
      result.current.setIsVideoModalOpen(true);
      result.current.openTouchVideoMenu();
      result.current.openGuitarProViewer();
    });

    expect(result.current.selectedGuitarProFile).toBe(files[1]);
    expect(result.current.isTouchVideoActive).toBe(true);
    expect(result.current.isTouchVideoMenuOpen).toBe(true);

    act(() => {
      result.current.resetMediaControls();
    });

    expect(result.current.touchVideoLink).toBe("");
    expect(result.current.isTouchVideoActive).toBe(false);
    expect(result.current.isTouchVideoMenuOpen).toBe(false);
    expect(result.current.isVideoModalOpen).toBe(false);
    expect(result.current.guitarProViewerOpen).toBe(false);
    expect(result.current.selectedGuitarProFile).toBe(null);
  });

  it("does not allow Guitar Pro for voice", () => {
    const { result } = renderHook(() =>
      usePresentationMediaControls({
        instrumentSelected: "voice",
        songDataFetched: {
          guitarProFiles: [{ originalName: "voice.gp5" }],
        },
      }),
    );

    act(() => {
      result.current.openGuitarProViewer();
    });

    expect(result.current.canOpenGuitarPro).toBe(false);
    expect(result.current.guitarProViewerOpen).toBe(false);
    expect(result.current.selectedGuitarProFile).toBe(null);
  });
});
