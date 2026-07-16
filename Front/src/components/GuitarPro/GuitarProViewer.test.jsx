import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuitarProViewer from "./GuitarProViewer";

describe("GuitarProViewer mobile layout", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(max-width: 767px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  it("keeps close, score controls, transport, and mixer in the compact workspace", () => {
    const onClose = vi.fn();

    const { container } = render(
      <GuitarProViewer
        file={{}}
        songTitle="You Only Live Once"
        artistName="The Strokes"
        onClose={onClose}
      />,
    );

    expect(screen.getByTestId("guitar-pro-mobile-viewer")).toBeInTheDocument();
    expect(screen.getByText("You Only Live Once")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Guitar Pro view controls" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Guitar Pro playback progress" })).toBeInTheDocument();
    expect(container.querySelector(".guitar-pro-score")).toHaveAttribute("aria-hidden", "false");

    fireEvent.click(screen.getByRole("button", { name: "Open mixer" }));
    expect(screen.getByRole("dialog", { name: "Instruments mixer" })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Master volume" })).toBeInTheDocument();
    expect(container.querySelector(".guitar-pro-score")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".guitar-pro-score")).not.toHaveClass("invisible");
    expect(screen.queryByRole("button", { name: "Close mixer backdrop" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Guitar Pro viewer" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
