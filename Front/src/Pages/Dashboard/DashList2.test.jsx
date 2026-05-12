import { render, screen, waitFor } from "@testing-library/react";
import DashList2 from "./DashList2";
import {
  fetchUserSongs,
  loadSelectedSetlists,
  saveSelectedSetlists,
} from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  fetchUserSongs: vi.fn(),
  loadSelectedSetlists: vi.fn(),
  saveSelectedSetlists: vi.fn(),
}));

vi.mock("./DashboardOptions", () => ({
  default: function DashboardOptionsMock(props) {
    return (
      <div>
        Options open: {String(props.optStatus)}
        <div>Visible songs: {props.visibleSongs.length}</div>
        <div>Visible columns: {props.visibleColumns.join(",")}</div>
      </div>
    );
  },
}));

vi.mock("./DashList2Items", () => ({
  default: function DashList2ItemsMock(props) {
    return (
      <div>
        Items count: {props.songs.length}
        <div>Loading: {String(props.isLoading)}</div>
        <div>Columns: {props.visibleColumns.join(",")}</div>
      </div>
    );
  },
}));

describe("DashList2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      value: 1440,
      configurable: true,
    });

    loadSelectedSetlists.mockReturnValue(["worship"]);
    fetchUserSongs.mockResolvedValue({
      songs: [
        {
          song: "Oceans",
          artist: "Hillsong",
          setlist: ["worship"],
          progressBar: 100,
        },
        {
          song: "Alive",
          artist: "Band",
          setlist: ["youth"],
          progressBar: 50,
        },
      ],
      fullName: "Eloy Gomes",
      username: "eloy",
    });
  });

  it("loads songs, saves user data and filters by selected setlists", async () => {
    render(<DashList2 />);

    await waitFor(() => {
      expect(fetchUserSongs).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Items count: 1")).toBeInTheDocument();
    expect(localStorage.getItem("fullName")).toBe("Eloy Gomes");
    expect(localStorage.getItem("username")).toBe("eloy");
  });

  it("filters songs by the search term", async () => {
    render(<DashList2 searchTerm="oce" />);

    await waitFor(() => {
      expect(screen.getByText("Items count: 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Visible songs: 1")).toBeInTheDocument();
  });

  it("persists selected setlists and emits the filter-state event", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(<DashList2 />);

    await waitFor(() => {
      expect(saveSelectedSetlists).toHaveBeenCalledWith(["worship"]);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "dashboard-filter-state-change",
      }),
    );
  });
});
