import { act, fireEvent, render, screen } from "@testing-library/react";
import Stopwatch from "./Stopwatch";
import { createCalendarEvent } from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  createCalendarEvent: vi.fn(),
}));

describe("Stopwatch training persistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    createCalendarEvent.mockResolvedValue({ _id: "training-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves start, end and lap details to the calendar", async () => {
    render(<Stopwatch variant="desktopEditorial" bpm={132} />);

    fireEvent.click(screen.getByRole("button", { name: "Start!" }));
    vi.advanceTimersByTime(1250);
    fireEvent.click(screen.getByRole("button", { name: "Lap" }));
    vi.advanceTimersByTime(750);
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    fireEvent.click(screen.getByRole("button", { name: "Save training" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(createCalendarEvent).toHaveBeenCalledTimes(1);

    expect(createCalendarEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Metronome practice",
        eventType: "training",
        startsAt: expect.any(String),
        endsAt: expect.any(String),
        metadata: expect.objectContaining({
          bpm: 132,
          lapCount: 1,
          laps: [
            expect.objectContaining({
              lapNumber: 1,
              splitMs: expect.any(Number),
              totalTimeMs: expect.any(Number),
            }),
          ],
        }),
      }),
    );
  });
});
