import { act, fireEvent, render, screen } from "@testing-library/react";
import ToolBoxMini from "./ToolBoxMini";

describe("ToolBoxMini", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    });

    const start = vi.fn();
    const connect = vi.fn();
    const createBufferSource = vi.fn(() => ({
      connect,
      start,
    }));
    const close = vi.fn();
    const decodeAudioData = vi.fn(async () => ({ decoded: true }));

    class FakeAudioContext {
      constructor() {
        this.destination = {};
      }
      createBufferSource = createBufferSource;
      decodeAudioData = decodeAudioData;
      close = close;
    }

    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the initial BPM", () => {
    render(<ToolBoxMini initialBpm={96} />);

    expect(screen.getByText("96")).toBeInTheDocument();
    expect(screen.getByText("bpm")).toBeInTheDocument();
  });

  it("increases and decreases the bpm", () => {
    render(<ToolBoxMini initialBpm={96} />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    expect(screen.getByText("97")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "-" }));
    expect(screen.getByText("96")).toBeInTheDocument();
  });

  it("toggles between play and stop", async () => {
    render(<ToolBoxMini initialBpm={120} />);

    const playButton = screen.getByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(600);
      await Promise.resolve();
    });

    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });
});
