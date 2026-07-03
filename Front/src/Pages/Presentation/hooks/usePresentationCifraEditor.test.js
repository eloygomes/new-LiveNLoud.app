import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresentationCifraEditor } from "./usePresentationCifraEditor";
import { PRESENTATION_COLUMN_BREAK_MARKER } from "../helpers/presentationConstants";

const { updateSongEntryMock } = vi.hoisted(() => ({
  updateSongEntryMock: vi.fn(),
}));

vi.mock("../../../Tools/Controllers", () => ({
  updateSongEntry: updateSongEntryMock,
}));

const makeProps = (overrides = {}) => ({
  activeLayoutVariant: "default",
  activeProgressionRenderColumns: [],
  currentInstrumentData: {
    songCifra: "original cifra",
    presentationLayouts: {
      default: { songCifra: "original cifra" },
      expanded: { songCifra: "expanded cifra" },
    },
  },
  editableSongCifra: "original cifra",
  editOriginalCifraRef: { current: "" },
  editOriginalLayoutsRef: { current: null },
  hasEditedCifraContent: false,
  hasEditedLayoutContent: false,
  instrumentPresentationLayouts: {
    default: { songCifra: "original cifra" },
    expanded: { songCifra: "expanded cifra" },
  },
  instrumentSelected: "keys",
  isEditing: false,
  isExpandedCifra: false,
  presentationContentRef: { current: null },
  presentationLayoutIdentity: "artist::song::keys",
  presentationLayoutStorageKey: "layout-key",
  pushSnackbarMessage: vi.fn(),
  setHasEditedCifraContent: vi.fn(),
  setHasEditedLayoutContent: vi.fn(),
  setIsEditing: vi.fn(),
  setSongDataFetched: vi.fn(),
  setToolBoxBtnStatus: vi.fn(),
  setToolBoxRequestedPanel: vi.fn(),
  songDataFetched: {
    artist: "Artist",
    song: "Song",
    keys: {
      songCifra: "original cifra",
    },
  },
  visibleContentBlocks: [],
  ...overrides,
});

describe("usePresentationCifraEditor", () => {
  beforeEach(() => {
    updateSongEntryMock.mockReset();
    updateSongEntryMock.mockResolvedValue({ queued: true });
  });

  it("starts editing and opens the editor toolbox", () => {
    const props = makeProps();
    const { result } = renderHook(() => usePresentationCifraEditor(props));

    act(() => {
      result.current.openEditorToolBox();
    });

    expect(props.editOriginalCifraRef.current).toBe("original cifra");
    expect(props.editOriginalLayoutsRef.current.default.songCifra).toBe(
      "original cifra",
    );
    expect(props.setIsEditing).toHaveBeenCalledWith(true);
    expect(props.setHasEditedCifraContent).toHaveBeenCalledWith(false);
    expect(props.setToolBoxRequestedPanel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "panel-editor" }),
    );
    expect(props.setToolBoxBtnStatus).toHaveBeenCalledWith(true);
  });

  it("discards draft changes and restores original layouts", () => {
    const setSongDataFetched = vi.fn();
    const editOriginalCifraRef = { current: "original cifra" };
    const editOriginalLayoutsRef = {
      current: {
        default: { songCifra: "original default" },
        expanded: { songCifra: "original expanded" },
      },
    };
    const props = makeProps({
      editOriginalCifraRef,
      editOriginalLayoutsRef,
      setSongDataFetched,
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    act(() => {
      result.current.handleDiscardDraft();
    });

    const updater = setSongDataFetched.mock.calls[0][0];
    const restored = updater({
      keys: {
        songCifra: "edited",
        presentationLayouts: {
          default: { songCifra: "edited" },
        },
      },
    });

    expect(restored.keys.songCifra).toBe("original default");
    expect(props.setIsEditing).toHaveBeenCalledWith(false);
    expect(props.setHasEditedCifraContent).toHaveBeenCalledWith(false);
    expect(props.setHasEditedLayoutContent).toHaveBeenCalledWith(false);
    expect(editOriginalLayoutsRef.current).toBe(null);
  });

  it("reports a save error when song data is missing", async () => {
    const pushSnackbarMessage = vi.fn();
    const { result } = renderHook(() =>
      usePresentationCifraEditor(
        makeProps({
          songDataFetched: null,
          pushSnackbarMessage,
        }),
      ),
    );

    await act(async () => {
      await result.current.handleSaveCifra();
    });

    expect(result.current.saveError).toBe(
      "Sem dados da música carregados para salvar.",
    );
    expect(pushSnackbarMessage).toHaveBeenCalledWith(
      "Erro",
      "Sem dados da música carregados para salvar.",
    );
  });

  it("uses the active cifra instead of a stale draft when saving layout-only changes", async () => {
    const setSongDataFetched = vi.fn();
    const editableSongCifra = "[Intro]\nB/F# F#11/C# E/B\n\n[Primeira Parte]\nB/F#";
    const props = makeProps({
      currentInstrumentData: {
        songCifra: editableSongCifra,
        presentationLayouts: {
          default: {
            songCifra: editableSongCifra,
            showProgressionMarkers: true,
          },
          expanded: { songCifra: "expanded cifra" },
        },
      },
      editableSongCifra,
      hasEditedCifraContent: false,
      hasEditedLayoutContent: true,
      isEditing: true,
      setSongDataFetched,
      songDataFetched: {
        artist: "Artist",
        song: "Song",
        keys: {
          songCifra: editableSongCifra,
          presentationLayouts: {
            default: {
              songCifra: editableSongCifra,
              showProgressionMarkers: true,
            },
            expanded: { songCifra: "expanded cifra" },
          },
        },
      },
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    await act(async () => {
      await result.current.handleSaveCifra();
    });

    expect(updateSongEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({
          songCifra: editableSongCifra,
          presentationLayouts: expect.objectContaining({
            default: expect.objectContaining({
              songCifra: editableSongCifra,
            }),
          }),
        }),
      }),
      expect.objectContaining({
        replaceEmptyInstrumentFields: { keys: ["songCifra"] },
      }),
    );
  });

  it("saves the visible editor DOM as the final cifra while editing", async () => {
    const presentationContent = document.createElement("div");
    presentationContent.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre>edited visible cifra</pre>
      </div>
    `;

    const props = makeProps({
      editableSongCifra: "stale cifra that should not be saved",
      hasEditedCifraContent: false,
      isEditing: true,
      presentationContentRef: { current: presentationContent },
      currentInstrumentData: {
        songCifra: "stale cifra that should not be saved",
        presentationLayouts: {
          default: { songCifra: "stale cifra that should not be saved" },
          expanded: { songCifra: "expanded cifra" },
        },
      },
      instrumentPresentationLayouts: {
        default: { songCifra: "stale cifra that should not be saved" },
        expanded: { songCifra: "expanded cifra" },
      },
      songDataFetched: {
        artist: "Artist",
        song: "Song",
        keys: {
          songCifra: "stale cifra that should not be saved",
          presentationLayouts: {
            default: { songCifra: "stale cifra that should not be saved" },
            expanded: { songCifra: "expanded cifra" },
          },
        },
      },
      visibleContentBlocks: [{ blockKey: "block-0" }],
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    await act(async () => {
      await result.current.handleSaveCifra();
    });

    expect(updateSongEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({
          songCifra: "edited visible cifra",
          presentationLayouts: expect.objectContaining({
            default: expect.objectContaining({
              songCifra: "edited visible cifra",
            }),
          }),
        }),
      }),
      expect.objectContaining({
        replaceEmptyInstrumentFields: { keys: ["songCifra"] },
      }),
    );
  });

  it("allows intentionally saving an empty cifra after the editor content was deleted", async () => {
    const presentationContent = document.createElement("div");
    presentationContent.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre></pre>
      </div>
    `;

    const props = makeProps({
      editableSongCifra: "original cifra",
      hasEditedCifraContent: true,
      isEditing: true,
      presentationContentRef: { current: presentationContent },
      currentInstrumentData: {
        songCifra: "original cifra",
        presentationLayouts: {
          default: { songCifra: "original cifra" },
          expanded: { songCifra: "expanded cifra" },
        },
      },
      instrumentPresentationLayouts: {
        default: { songCifra: "original cifra" },
        expanded: { songCifra: "expanded cifra" },
      },
      songDataFetched: {
        artist: "Artist",
        song: "Song",
        keys: {
          songCifra: "original cifra",
          presentationLayouts: {
            default: { songCifra: "original cifra" },
            expanded: { songCifra: "expanded cifra" },
          },
        },
      },
      visibleContentBlocks: [{ blockKey: "block-0" }],
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    await act(async () => {
      await result.current.handleSaveCifra();
    });

    expect(updateSongEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        keys: expect.objectContaining({
          songCifra: "",
          presentationLayouts: expect.objectContaining({
            default: expect.objectContaining({
              songCifra: "",
            }),
          }),
        }),
      }),
      expect.objectContaining({
        replaceEmptyInstrumentFields: { keys: ["songCifra"] },
      }),
    );
  });

  it("syncs the current editor DOM before layout updates rerender content", () => {
    const presentationContent = document.createElement("div");
    presentationContent.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre>edited before layout update</pre>
      </div>
    `;
    const setHasEditedCifraContent = vi.fn();
    const props = makeProps({
      isEditing: true,
      presentationContentRef: { current: presentationContent },
      setHasEditedCifraContent,
      visibleContentBlocks: [{ blockKey: "block-0" }],
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    let syncedContent = null;
    act(() => {
      syncedContent = result.current.syncEditingCifraBeforeLayoutUpdate();
    });

    expect(syncedContent).toBe("edited before layout update");
    expect(setHasEditedCifraContent).toHaveBeenCalledWith(true);
  });

  it("collects horizontal editor DOM even when the edited-content flag was not raised", async () => {
    const presentationContent = document.createElement("div");
    presentationContent.innerHTML = `
      <div class="presentation-render-content-block" data-block-keys="block-0">
        <pre>[Intro]</pre>
        <pre>C G</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-1">
        <pre class="presentation-blank-line">\u200b</pre>
      </div>
      <div class="presentation-render-content-block" data-block-keys="block-2">
        <pre>[Verse]</pre>
        <pre>Am F</pre>
      </div>
    `;

    const props = makeProps({
      activeLayoutVariant: "expanded",
      editableSongCifra: "stale cifra that should not be saved",
      hasEditedCifraContent: false,
      isEditing: true,
      isExpandedCifra: true,
      shouldUseHorizontalColumnFlow: true,
      presentationContentRef: { current: presentationContent },
      currentInstrumentData: {
        songCifra: "default cifra",
        presentationLayouts: {
          default: { songCifra: "default cifra" },
          expanded: { songCifra: "stale cifra that should not be saved" },
        },
      },
      instrumentPresentationLayouts: {
        default: { songCifra: "default cifra" },
        expanded: { songCifra: "stale cifra that should not be saved" },
      },
      songDataFetched: {
        artist: "Artist",
        song: "Song",
        keys: {
          songCifra: "default cifra",
          presentationLayouts: {
            default: { songCifra: "default cifra" },
            expanded: { songCifra: "stale cifra that should not be saved" },
          },
        },
      },
      visibleContentBlocks: [
        { blockKey: "block-0" },
        { blockKey: "block-1" },
        { blockKey: "block-2" },
      ],
    });

    const { result } = renderHook(() => usePresentationCifraEditor(props));

    await act(async () => {
      await result.current.handleSaveCifra();
    });

    const savedExpanded =
      updateSongEntryMock.mock.calls[0][0].keys.presentationLayouts.expanded
        .songCifra;

    expect(savedExpanded).toBe(
      `[Intro]\nC G\n${PRESENTATION_COLUMN_BREAK_MARKER}\n[Verse]\nAm F`,
    );
    expect(savedExpanded).not.toContain("stale cifra");
  });
});
