import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import DashboardOptions from "./DashboardOptions";
import {
  fetchDistinctSetlists,
  setOfflineContentAvailability,
  updateUserSetlists,
} from "../../Tools/Controllers";
import { lockPageScroll } from "../../Tools/scrollLock";

vi.mock("../../Tools/Controllers", () => ({
  fetchDistinctSetlists: vi.fn(),
  setOfflineContentAvailability: vi.fn(),
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
  const onNotify = vi.fn();

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
      offlineInfo={{
        offlineMode: false,
        contentEnabled: false,
        reauthRequired: false,
        pendingChanges: 0,
        offlineEnabledCount: 0,
        totalSongs: 1,
      }}
      onOfflineStateChanged={vi.fn()}
      onNotify={onNotify}
      {...customProps}
    />,
  );

  return { setOptStatus, onNotify };
}

describe("DashboardOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDistinctSetlists.mockResolvedValue(["Worship", "Acoustic"]);
    setOfflineContentAvailability.mockResolvedValue({
      enabled: true,
      songsDownloaded: 2,
    });
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
    fireEvent.click(screen.getByRole("button", { name: "Move Progression later" }));

    expect(onToggleColumn).toHaveBeenCalledWith("videos");
    expect(onMoveColumn).toHaveBeenCalledWith("progression", 1);
  });

  it("toggles offline content from the options panel", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    const onOfflineStateChanged = vi.fn();
    const { onNotify } = renderDashboardOptions({ onOfflineStateChanged });

    fireEvent.click(screen.getByLabelText("Offline content"));

    await waitFor(() => {
      expect(setOfflineContentAvailability).toHaveBeenCalledWith(true);
    });

    expect(onOfflineStateChanged).toHaveBeenCalledTimes(1);
    expect(onNotify).toHaveBeenCalledWith({
      title: "Success",
      message: "Offline content downloaded. 2 song(s) are now available without internet.",
    });
  });

  it("renders the offline content card alongside insights on desktop", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });

    renderDashboardOptions({
      offlineInfo: {
        offlineMode: false,
        contentEnabled: true,
        reauthRequired: false,
        pendingChanges: 2,
        offlineEnabledCount: 2,
        totalSongs: 2,
      },
    });

    await waitFor(() => {
    expect(screen.getByText("Offline Content")).toBeInTheDocument();
    });

    expect(screen.getByText("offline ready")).toBeInTheDocument();
    expect(screen.getByText("2 downloaded")).toBeInTheDocument();
    expect(screen.getByText("2 pending sync")).toBeInTheDocument();
  });
});
