import { fireEvent, render, screen } from "@testing-library/react";
import FloatingBtnsAutoScroll from "./FloatingBtnsAutoScroll";

describe("FloatingBtnsAutoScroll", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    Object.defineProperty(window, "innerHeight", {
      value: 1000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 400,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    window.scrollTo.mockRestore();
  });

  it("scrolls up by 90 percent of the page height when clicked", () => {
    render(<FloatingBtnsAutoScroll />);

    fireEvent.click(screen.getByRole("button", { name: "up" }));

    expect(window.scrollTo).toHaveBeenCalledWith({
      top: -500,
      behavior: "smooth",
    });
  });

  it("starts repeated scrolling while hovering and stops on mouse leave", () => {
    render(<FloatingBtnsAutoScroll />);

    const downButton = screen.getByRole("button", { name: "down" });
    fireEvent.mouseEnter(downButton);
    vi.advanceTimersByTime(250);

    expect(window.scrollTo).toHaveBeenCalled();
    const callsWhileHovering = window.scrollTo.mock.calls.length;

    fireEvent.mouseLeave(downButton);
    vi.advanceTimersByTime(300);

    expect(window.scrollTo.mock.calls.length).toBe(callsWhileHovering);
  });
});
