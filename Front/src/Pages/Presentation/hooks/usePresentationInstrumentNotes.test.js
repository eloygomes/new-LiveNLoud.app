import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateInstrumentNotes } from "../../../Tools/Controllers";
import { usePresentationInstrumentNotes } from "./usePresentationInstrumentNotes";

vi.mock("../../../Tools/Controllers", () => ({
  updateInstrumentNotes: vi.fn(),
}));

describe("usePresentationInstrumentNotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates notes locally", () => {
    const setSongDataFetched = vi.fn();
    const { result } = renderHook(() =>
      usePresentationInstrumentNotes({
        artistFromURL: "Artist",
        currentInstrumentData: { notes: "old" },
        instrumentSelected: "keys",
        pushSnackbarMessage: vi.fn(),
        setNotesModalStatus: vi.fn(),
        setSongDataFetched,
        songFromURL: "Song",
      }),
    );

    act(() => {
      result.current.handleInstrumentNotesChange("new notes");
    });

    const updater = setSongDataFetched.mock.calls[0][0];
    expect(
      updater({
        keys: { notes: "old", songCifra: "cifra" },
      }),
    ).toEqual({
      keys: { notes: "new notes", songCifra: "cifra" },
    });
  });

  it("saves notes and preserves existing presentation layout fields", async () => {
    updateInstrumentNotes.mockResolvedValue({
      song: {
        keys: {
          notes: "server notes",
        },
      },
    });
    const pushSnackbarMessage = vi.fn();
    const setSongDataFetched = vi.fn();

    const { result } = renderHook(() =>
      usePresentationInstrumentNotes({
        artistFromURL: "Artist",
        currentInstrumentData: { notes: "old" },
        instrumentSelected: "keys",
        pushSnackbarMessage,
        setNotesModalStatus: vi.fn(),
        setSongDataFetched,
        songFromURL: "Song",
      }),
    );

    await act(async () => {
      await result.current.handleSaveInstrumentNotes("server notes");
    });

    expect(updateInstrumentNotes).toHaveBeenCalledWith({
      artist: "Artist",
      song: "Song",
      instrument: "keys",
      notes: "server notes",
    });

    const updater = setSongDataFetched.mock.calls[0][0];
    const merged = updater({
      keys: {
        songCifra: "old cifra",
        presentationLayouts: { default: { songCifra: "old cifra" } },
      },
    });

    expect(merged.keys.notes).toBe("server notes");
    expect(merged.keys.songCifra).toBe("old cifra");
    expect(merged.keys.presentationLayouts).toEqual({
      default: { songCifra: "old cifra" },
    });
    expect(pushSnackbarMessage).toHaveBeenCalledWith(
      "Salvo",
      "Notas salvas com sucesso.",
    );
  });

  it("opens notes modal with feedback", () => {
    const pushSnackbarMessage = vi.fn();
    const setNotesModalStatus = vi.fn();
    const { result } = renderHook(() =>
      usePresentationInstrumentNotes({
        artistFromURL: "Artist",
        currentInstrumentData: {},
        instrumentSelected: "keys",
        pushSnackbarMessage,
        setNotesModalStatus,
        setSongDataFetched: vi.fn(),
        songFromURL: "Song",
      }),
    );

    act(() => {
      result.current.openInstrumentNotesWindow();
    });

    expect(setNotesModalStatus).toHaveBeenCalledWith(true);
    expect(pushSnackbarMessage).toHaveBeenCalledWith(
      "Notes",
      "Notas abertas para este instrumento.",
    );
  });
});
