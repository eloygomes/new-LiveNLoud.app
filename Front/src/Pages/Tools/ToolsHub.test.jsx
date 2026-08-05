import { fireEvent, render, screen } from "@testing-library/react";
import ToolsHub from "./ToolsHub";
import { useNavigate } from "react-router-dom";

vi.mock("react-router-dom", () => ({
  useNavigate: vi.fn(),
}));

describe("ToolsHub compact layout", () => {
  const navigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(navigate);
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 667,
      configurable: true,
    });
  });

  it("shows every practice tool in the mobile hub", () => {
    render(<ToolsHub />);

    expect(screen.getByLabelText("Practice tools")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(5);
    expect(screen.getByRole("button", { name: "Open Drum Machine" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Chord Library" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Tuner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Metronome" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Calendar" })).toBeInTheDocument();
  });

  it("opens the selected tool", () => {
    render(<ToolsHub />);

    fireEvent.click(screen.getByRole("button", { name: "Open Metronome" }));
    expect(navigate).toHaveBeenCalledWith("/metronome");
  });

  it("shows the tools hub on portrait tablets", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    render(<ToolsHub />);

    expect(screen.getByLabelText("Practice tools")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(5);
    expect(
      screen.getByRole("heading", {
        name: "Everything you need to prepare, play and improve.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tools overview")).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /illustration$/ })).toHaveLength(5);
    expect(navigate).not.toHaveBeenCalledWith("/chordlibrary", {
      replace: true,
    });
  });
});
