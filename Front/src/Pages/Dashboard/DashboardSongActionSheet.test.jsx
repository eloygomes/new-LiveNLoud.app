import { fireEvent, render, screen } from "@testing-library/react";
import DashboardSongActionSheet from "./DashboardSongActionSheet";

function renderSheet(customProps = {}) {
  const props = {
    selectedSong: {
      song: "Oceans",
      artist: "Hillsong",
      progressBar: 75,
      instruments: { guitar: true, bass: false },
    },
    instrumentLabels: [
      { key: "guitar", modalLabel: "Guitar" },
      { key: "bass", modalLabel: "Bass" },
    ],
    availableInstrumentCount: 1,
    renderInstrumentIcon: (instrument) => <span>{instrument.modalLabel}</span>,
    onClose: vi.fn(),
    onOpenInstrument: vi.fn(),
    onEditSong: vi.fn(),
    ...customProps,
  };

  render(<DashboardSongActionSheet {...props} />);
  return props;
}

describe("DashboardSongActionSheet", () => {
  it("does not render when no song is selected", () => {
    renderSheet({ selectedSong: null });

    expect(screen.queryByText("Open presentation")).not.toBeInTheDocument();
  });

  it("renders the selected song information", () => {
    renderSheet();

    expect(screen.getByText("Oceans")).toBeInTheDocument();
    expect(screen.getByText("Hillsong")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Online access only");
  });

  it("opens only the available instrument", () => {
    const { onOpenInstrument } = renderSheet();

    fireEvent.click(screen.getByRole("button", { name: /guitar available/i }));
    fireEvent.click(screen.getByRole("button", { name: /bass unavailable/i }));

    expect(onOpenInstrument).toHaveBeenCalledWith(
      expect.objectContaining({ song: "Oceans" }),
      "guitar",
    );
    expect(onOpenInstrument).toHaveBeenCalledTimes(1);
  });

  it("calls the close and edit handlers", () => {
    const { onClose, onEditSong } = renderSheet();

    fireEvent.click(screen.getByRole("button", { name: "Close song sheet" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit song" }));

    expect(onClose).toHaveBeenCalled();
    expect(onEditSong).toHaveBeenCalledWith(
      expect.objectContaining({ song: "Oceans" }),
    );
  });

  it("closes when the drag handle is pulled down", () => {
    const { onClose } = renderSheet();
    const handle = screen.getByRole("button", {
      name: "Drag down to close song sheet",
    });

    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 190 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 190 });

    expect(onClose).toHaveBeenCalled();
  });
});
