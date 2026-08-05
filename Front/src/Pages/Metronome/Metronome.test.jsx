import { fireEvent, render, screen } from "@testing-library/react";
import Metronome from "./Metronome";

function setViewport(width, height) {
  Object.defineProperty(window, "innerWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: height,
    configurable: true,
  });
}

describe("Metronome responsive layouts", () => {
  beforeEach(() => {
    setViewport(768, 1024);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a complete editorial tablet cockpit", () => {
    render(<Metronome />);

    expect(screen.getByTestId("tablet-tool-shell")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Turn a steady pulse into a repeatable practice habit.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Metronome practice illustration",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Metronome volume" })).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Tempo in beats per minute" }),
    ).toHaveValue("120");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tap" })).toBeInTheDocument();
    expect(screen.getByText("Session stopwatch")).toBeInTheDocument();
  });

  it("keeps tempo and timer controls live in the tablet layout", () => {
    render(<Metronome />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Increase tempo by one BPM",
      }),
    );
    expect(
      screen.getByRole("slider", { name: "Tempo in beats per minute" }),
    ).toHaveValue("121");

    const timerToggle = screen.getByRole("button", { name: "Timer off" });
    fireEvent.click(timerToggle);
    expect(
      screen.getByRole("button", { name: "Timer on" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("preserves the compact smartphone screen", () => {
    setViewport(390, 844);

    render(<Metronome />);

    expect(screen.queryByTestId("tablet-tool-shell")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Keep The Pulse" }),
    ).toBeInTheDocument();
  });
});
