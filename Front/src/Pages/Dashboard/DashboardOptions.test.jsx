import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardOptions from "./DashboardOptions";
import {
  fetchDistinctSetlists,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { lockPageScroll } from "../../Tools/scrollLock";

vi.mock("../../Tools/Controllers", () => ({
  fetchDistinctSetlists: vi.fn(),
  updateUserSetlists: vi.fn(),
}));

vi.mock("../../Tools/scrollLock", () => ({
  lockPageScroll: vi.fn(() => vi.fn()),
}));

vi.mock("./PlaylistExport", () => ({
  default: function PlaylistExportMock() {
    return <div>Playlist export</div>;
  },
}));

vi.mock("./SetlistExport", () => ({
  default: function SetlistExportMock() {
    return <div>Setlist export</div>;
  },
}));

vi.mock("./Insights", () => ({
  default: function InsightsMock() {
    return <div>Insights section</div>;
  },
}));

vi.mock("./Tags", () => ({
  default: function TagsMock({ setlists, selectedSetlists }) {
    return (
      <div>
        Tags section: {setlists.join(",")} / selected: {selectedSetlists.join(",")}
      </div>
    );
  },
}));

function renderDashboardOptions(customProps = {}) {
  const setOptStatus = vi.fn();

  render(
    <DashboardOptions
      optStatus
      setOptStatus={setOptStatus}
      selectedSetlists={["Worship"]}
      setSelectedSetlists={vi.fn()}
      visibleSongs={[
        {
          song: "Oceans",
          artist: "Hillsong",
          progressBar: 100,
          instruments: { guitar01: true },
        },
      ]}
      visibleColumns={["progression", "tags"]}
      onToggleColumn={vi.fn()}
      onMoveColumn={vi.fn()}
      canSelectAllColumns
      maxSelectableColumns={7}
      {...customProps}
    />,
  );

  return { setOptStatus };
}

describe("DashboardOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDistinctSetlists.mockResolvedValue(["Worship", "Acoustic"]);
    updateUserSetlists.mockResolvedValue(undefined);
  });

  it("loads setlists and locks page scroll when opened", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    renderDashboardOptions();

    await waitFor(() => {
      expect(fetchDistinctSetlists).toHaveBeenCalledTimes(1);
    });

    expect(lockPageScroll).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Insights section")).toBeInTheDocument();
    expect(
      screen.getByText("Tags section: Worship,Acoustic / selected: Worship"),
    ).toBeInTheDocument();
  });

  it("closes when the close button is clicked", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    const { setOptStatus } = renderDashboardOptions();

    fireEvent.click(screen.getByRole("button", { name: "Close filter" }));

    expect(setOptStatus).toHaveBeenCalledWith(false);
  });

  it("closes when the mobile close event is dispatched", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 500,
      configurable: true,
    });

    const { setOptStatus } = renderDashboardOptions();

    window.dispatchEvent(new Event("dashboard-mobile-close-filter"));

    expect(setOptStatus).toHaveBeenCalledWith(false);
  });

  it("calls the column handlers when the user toggles or reorders columns", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    const onToggleColumn = vi.fn();
    const onMoveColumn = vi.fn();

    renderDashboardOptions({ onToggleColumn, onMoveColumn });

    fireEvent.click(screen.getByLabelText("Videos"));
    fireEvent.click(screen.getByRole("button", { name: "Move Progression right" }));

    expect(onToggleColumn).toHaveBeenCalledWith("videos");
    expect(onMoveColumn).toHaveBeenCalledWith("progression", 1);
  });
});
