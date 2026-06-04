import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresentationCifraEditor } from "./usePresentationCifraEditor";

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
    );
  });
});
