import { fireEvent, render, screen } from "@testing-library/react";
import ScrollControlPanel from "./ScrollControlPanel";
import {
  getRegisteredScrollController,
  getScrollControllerState,
} from "./presentationScrollController";

describe("ScrollControlPanel", () => {
  beforeEach(() => {
    delete window.__liveNloudScrollController;
    vi.useFakeTimers();
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    window.scrollBy.mockRestore();
    window.scrollTo.mockRestore();
  });

  it("registers a controller and toggles auto scroll on desktop", () => {
    render(<ScrollControlPanel />);

    expect(getRegisteredScrollController()).toBeTruthy();
    expect(screen.getByRole("button", { name: "Start auto scroll" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start auto scroll" }));

    expect(getScrollControllerState().autoScrollActive).toBe(true);
    expect(screen.getByRole("button", { name: "Stop auto scroll" })).toBeInTheDocument();
  });

  it("changes the speed and reacts to keyboard shortcuts", () => {
    render(<ScrollControlPanel />);

    fireEvent.click(screen.getByRole("button", { name: "Increase velocity" }));
    expect(getScrollControllerState().speed).toBe(4);

    fireEvent.keyDown(window, { key: "ArrowLeft", target: document.body });
    expect(getScrollControllerState().speed).toBe(3);

    fireEvent.keyDown(window, { key: " " , target: document.body });
    expect(getScrollControllerState().autoScrollActive).toBe(true);

    fireEvent.keyDown(window, { key: "Escape", target: document.body });
    expect(getScrollControllerState().autoScrollActive).toBe(false);
  });

  it("renders the touch layout controls when requested", () => {
    render(<ScrollControlPanel isTouchLayout />);

    expect(screen.getByText("Auto scroll")).toBeInTheDocument();
    expect(screen.getByText("10/20")).toBeInTheDocument();
    expect(getScrollControllerState().speed).toBe(10);
    expect(screen.getByRole("button", { name: "Increase speed" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Auto scroll speed" })).toBeInTheDocument();
  });
});
