import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashList2Items from "./DashList2Items";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../Tools/Controllers", () => ({
  requestData: vi.fn(),
  saveDashboardVisibleSongs: vi.fn(),
}));

vi.mock("./DashboardSongActionSheet", () => ({
  default: function DashboardSongActionSheetMock({ selectedSong, onEditSong }) {
    if (!selectedSong) return null;
    return (
      <div>
        <div>Selected song: {selectedSong.song}</div>
        <button type="button" onClick={() => onEditSong(selectedSong)}>
          Edit selected song
        </button>
      </div>
    );
  },
}));

function songFixture() {
  return [
    {
      song: "Oceans",
      artist: "Hillsong",
      progressBar: 80,
      setlist: ["Worship"],
      createdAt: "2026-05-10T12:00:00.000Z",
      embedVideos: ["https://youtu.be/1"],
      guitar01: { notes: "Capo 2", lastPlay: "2026-05-11T12:00:00.000Z" },
      bass: { progress: 72 },
      instruments: {
        guitar01: true,
        guitar02: false,
        bass: true,
        keys: false,
        drums: false,
        voice: true,
      },
    },
  ];
}

describe("DashList2Items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it("renders the loading state", () => {
    render(<DashList2Items songs={[]} isLoading visibleColumns={["progression"]} />);

    expect(screen.getByText("Carregando músicas...")).toBeInTheDocument();
  });

  it("renders the empty library state when there are no songs", () => {
    render(<DashList2Items songs={[]} hasAnySongs={false} visibleColumns={[]} />);

    expect(screen.getByText("Sua biblioteca ainda está vazia")).toBeInTheDocument();
  });

  it("renders desktop rows with optional cells", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(
      <DashList2Items
        songs={songFixture()}
        visibleColumns={["progression", "tags", "videos", "notes", "lastPlay"]}
      />,
    );

    expect(screen.getByText("Oceans")).toBeInTheDocument();
    expect(screen.getByText("Hillsong")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Worship")).toBeInTheDocument();
    expect(screen.getByText("11 / 05 / 2026")).toBeInTheDocument();
  });

  it("renders instrument progression and highlights the selected instrument icon", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    render(
      <DashList2Items
        songs={songFixture()}
        visibleColumns={["bassProgression", "instruments"]}
      />,
    );

    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toHaveClass(
      "text-[goldenrod]",
    );
  });

  it("opens the mobile action sheet after a long press", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "innerWidth", {
      value: 500,
      configurable: true,
    });

    render(
      <DashList2Items
        songs={songFixture()}
        visibleColumns={["progression", "instruments"]}
      />,
    );

    const cardButton = screen.getByRole("button", { name: /oceans/i });
    fireEvent.touchStart(cardButton);
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    fireEvent.touchEnd(cardButton);

    expect(screen.getByText("Selected song: Oceans")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("navigates to the edit page from the mobile action sheet", async () => {
    vi.useFakeTimers();
    Object.defineProperty(window, "innerWidth", {
      value: 500,
      configurable: true,
    });

    render(
      <DashList2Items
        songs={songFixture()}
        visibleColumns={["progression", "instruments"]}
      />,
    );

    const cardButton = screen.getByRole("button", { name: /oceans/i });
    fireEvent.touchStart(cardButton);
    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });
    fireEvent.touchEnd(cardButton);

    expect(screen.getByText("Selected song: Oceans")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit selected song" }));

    expect(localStorage.getItem("song")).toBe("Oceans");
    expect(localStorage.getItem("artist")).toBe("Hillsong");
    expect(navigateMock).toHaveBeenCalledWith("/editsong/Hillsong/Oceans");

    vi.useRealTimers();
  });
});
