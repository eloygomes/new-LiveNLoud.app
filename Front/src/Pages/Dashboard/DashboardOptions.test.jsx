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
        <input aria-label="Tag draft" />
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
    Object.defineProperty(window, "innerHeight", {
      value: 768,
      configurable: true,
    });
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

  it("shows the mobile summary and five option layers without initial scrolling", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    renderDashboardOptions();

    expect(screen.getByRole("heading", { name: "FILTER" })).toBeInTheDocument();
    expect(screen.getByLabelText("Song summary")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Open Filters" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Column Data" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Offline Content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Export" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Playlists" })).toBeInTheDocument();
  });

  it("navigates between mobile layers and preserves mounted layer state", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    renderDashboardOptions();

    fireEvent.click(screen.getByRole("button", { name: "Open Filters" }));
    expect(screen.getByRole("heading", { name: "FILTERS" })).toBeInTheDocument();

    const draft = screen.getByLabelText("Tag draft");
    fireEvent.change(draft, { target: { value: "Rehearsal" } });
    fireEvent.click(screen.getByRole("button", { name: "Back to filter menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Open Filters" }));

    expect(screen.getByLabelText("Tag draft")).toHaveValue("Rehearsal");
  });

  it("toggles the song display order from the mobile Filter home", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    const onToggleSongNumberOrder = vi.fn();
    renderDashboardOptions({
      songNumberSortOrder: "asc",
      onToggleSongNumberOrder,
    });

    const orderSwitch = screen.getByRole("switch", {
      name: "Inverter ordem de exibição das cifras",
    });

    expect(orderSwitch).toHaveAttribute("aria-checked", "false");
    fireEvent.click(orderSwitch);
    expect(onToggleSongNumberOrder).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Open Filters" }));
    expect(
      screen.queryByRole("switch", {
        name: "Inverter ordem de exibição das cifras",
      }),
    ).not.toBeInTheDocument();
  });

  it("opens each mobile content layer and returns to the main menu", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    renderDashboardOptions();

    for (const name of ["Column Data", "Offline Content", "Export", "Playlists"]) {
      fireEvent.click(screen.getByRole("button", { name: `Open ${name}` }));
      expect(
        screen.getByRole("heading", { name: name.toUpperCase() }),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Back to filter menu" }));
    }

    expect(screen.getByRole("heading", { name: "FILTER" })).toBeInTheDocument();
  });

  it("renders a full editorial workspace with illustrated navigation on portrait tablets", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    renderDashboardOptions();

    const dialog = screen.getByRole("dialog", { name: "Filter workspace" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Dashboard summary")).toBeInTheDocument();
    expect(screen.getByLabelText("Dashboard filter sections")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /^Open .+ settings$/ }),
    ).toHaveLength(5);
    expect(
      screen.getByLabelText("Filters category illustration"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Filters workspace illustration"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("One selection, every connected workflow"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("switch", {
        name: "Inverter ordem de exibição das cifras",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Tags section: Worship,Acoustic / selected: Worship"),
      ).toBeInTheDocument();
    });
  });

  it("navigates tablet sections while preserving the mounted panel state", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    renderDashboardOptions();

    const filterButton = screen.getByRole("button", {
      name: "Open Filters settings",
    });
    const columnButton = screen.getByRole("button", {
      name: "Open Column Data settings",
    });
    const draft = screen.getByLabelText("Tag draft");

    expect(filterButton).toHaveAttribute("aria-current", "page");
    fireEvent.change(draft, { target: { value: "Rehearsal" } });
    fireEvent.click(columnButton);

    expect(columnButton).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByText("A clearer list makes the next action easier"),
    ).toBeInTheDocument();
    expect(screen.getByText("Setlist export")).toBeInTheDocument();
    expect(screen.getByText("Playlist export")).toBeInTheDocument();

    fireEvent.click(filterButton);
    expect(screen.getByLabelText("Tag draft")).toHaveValue("Rehearsal");
  });

  it("shows both tablet column groups and explains when instrument progressions are locked", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    renderDashboardOptions({ visibleColumns: ["progression", "tags"] });
    fireEvent.click(
      screen.getByRole("button", { name: "Open Column Data settings" }),
    );

    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Instrument Progression")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Desligue Progression para liberar as progressões por instrumento.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Guitar 1 progression")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Items" })).not.toBeInTheDocument();
  });

  it("enables tablet instrument progression controls when general progression is off", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    renderDashboardOptions({ visibleColumns: ["tags"] });
    fireEvent.click(
      screen.getByRole("button", { name: "Open Column Data settings" }),
    );

    expect(
      screen.getByText(
        "Progression está desligado. Escolha as progressões de instrumento que deseja exibir.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Guitar 1 progression")).toBeEnabled();
  });

  it("closes the tablet dialog with Escape", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    const { setOptStatus } = renderDashboardOptions();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(setOptStatus).toHaveBeenCalledWith(false);
  });

  it("keeps mobile column controls focused on visibility only", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    renderDashboardOptions();
    fireEvent.click(screen.getByRole("button", { name: "Open Column Data" }));

    expect(screen.getByLabelText("Videos")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Instrument Progression" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Move Progression/ }),
    ).not.toBeInTheDocument();
  });

  it("reveals the mobile instrument progression tab only without general progression", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    renderDashboardOptions({ visibleColumns: ["tags"] });
    fireEvent.click(screen.getByRole("button", { name: "Open Column Data" }));

    const instrumentsTab = screen.getByRole("button", {
      name: "Instrument Progression",
    });
    expect(instrumentsTab).toBeInTheDocument();
    expect(instrumentsTab).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(instrumentsTab);
    expect(instrumentsTab).toHaveAttribute("aria-pressed", "true");
  });

  it("disables instrument progressions before enabling general progression on mobile", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });

    const onToggleColumn = vi.fn();
    renderDashboardOptions({
      visibleColumns: ["guitar01Progression", "bassProgression"],
      onToggleColumn,
    });
    fireEvent.click(screen.getByRole("button", { name: "Open Column Data" }));
    fireEvent.click(screen.getByLabelText("Progression"));

    expect(onToggleColumn.mock.calls).toEqual([
      ["guitar01Progression"],
      ["bassProgression"],
      ["progression"],
    ]);
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
