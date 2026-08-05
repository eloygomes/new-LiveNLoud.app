import { fireEvent, render, screen } from "@testing-library/react";
import Tuner from "./Tuner";

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

describe("Tuner responsive layouts", () => {
  afterEach(() => {
    delete window.tunerLogs;
  });

  it("renders the rich tuning workspace on portrait tablets", () => {
    setViewport(768, 1024);

    render(<Tuner />);

    expect(screen.getByTestId("tablet-tool-shell")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Tune with clarity before the first note.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Tuner workspace illustration" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Instrument type")).toHaveValue("Guitar");
    expect(screen.getByLabelText("Tuning")).toHaveValue("Standard");
    expect(
      screen.getByRole("button", {
        name: /string detection: automatic/i,
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "E2, 82.41 Hz" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tuning" }),
    ).toBeInTheDocument();
  });

  it("updates the available targets when the tablet instrument changes", () => {
    setViewport(820, 1180);

    render(<Tuner />);

    fireEvent.change(screen.getByLabelText("Instrument type"), {
      target: { value: "Bass" },
    });

    expect(screen.getByLabelText("Instrument type")).toHaveValue("Bass");
    expect(screen.getByText("4 strings")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "E1, 41.20 Hz" }),
    ).toBeInTheDocument();
  });

  it("preserves the compact smartphone experience", () => {
    setViewport(390, 844);

    render(<Tuner />);

    expect(screen.queryByTestId("tablet-tool-shell")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tune The Sound" }),
    ).toBeInTheDocument();
  });

  it("keeps landscape tablet screens on the desktop layout", () => {
    setViewport(1024, 768);

    render(<Tuner />);

    expect(screen.queryByTestId("tablet-tool-shell")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TUNER" })).toBeInTheDocument();
  });
});
