import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Bluetooth from "./Bluetooth";

const mockBluetoothState = vi.hoisted(() => ({
  value: null,
}));

vi.mock("../../../../contexts/BluetoothContext", () => ({
  useBluetooth: () => mockBluetoothState.value,
}));

const ACTIONS = [
  { value: "none", label: "(nenhuma)" },
  { value: "back", label: "Voltar (segurar 2s)" },
  { value: "arrowLeft", label: "Seta ←" },
  { value: "arrowRight", label: "Seta →" },
  { value: "enter", label: "Entrar (segurar 2s)" },
  { value: "arrowUp", label: "Seta ↑" },
  { value: "arrowDown", label: "Seta ↓" },
  { value: "pageUp", label: "Page Up" },
  { value: "pageDown", label: "Page Down" },
];

function makeBluetoothState(overrides = {}) {
  return {
    support: { bt: true, midi: true },
    activeSource: "MIDI",
    setActiveSource: vi.fn(),
    autoReconnect: true,
    setAutoReconnect: vi.fn(),
    last: {
      source: "—",
      key: "—",
      bytes: "—",
      time: "—",
    },
    logs: [],
    clearLogs: vi.fn(),
    controls: {},
    clearControls: vi.fn(),
    setRowAction: vi.fn(),
    ACTIONS,
    connectBLE: vi.fn(),
    disconnectBLE: vi.fn(),
    bleConnected: false,
    ...overrides,
  };
}

describe("Bluetooth footswitch mapping", () => {
  beforeEach(() => {
    mockBluetoothState.value = makeBluetoothState();
  });

  it("renders fixed functions instead of action selectors", () => {
    render(<Bluetooth />);

    fireEvent.click(screen.getByRole("button", { name: "Mapping" }));

    expect(screen.getByText("Seta ←")).toBeInTheDocument();
    expect(screen.getByText("Entrar (segurar 2s)")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("assigns the next controller event to the selected fixed function", () => {
    const setRowAction = vi.fn();
    mockBluetoothState.value = makeBluetoothState({
      setRowAction,
      last: {
        source: "MIDI",
        key: "MIDI:PC:ch1:0",
        bytes: "pc=0",
        time: "10:00:00",
      },
      controls: {
        "MIDI:PC:ch1:0": {
          source: "MIDI",
          info: "Program Change ch1",
          lastValue: "pc=0",
          action: "none",
        },
      },
    });

    const { rerender } = render(<Bluetooth />);
    fireEvent.click(screen.getByRole("button", { name: "Mapping" }));
    fireEvent.click(screen.getByText("Seta ←"));

    expect(screen.getByText("Press a controller button")).toBeInTheDocument();
    expect(setRowAction).not.toHaveBeenCalled();

    mockBluetoothState.value = makeBluetoothState({
      setRowAction,
      last: {
        source: "MIDI",
        key: "MIDI:PC:ch1:1",
        bytes: "pc=1",
        time: "10:00:01",
      },
      controls: {
        "MIDI:PC:ch1:0": {
          source: "MIDI",
          info: "Program Change ch1",
          lastValue: "pc=0",
          action: "none",
        },
        "MIDI:PC:ch1:1": {
          source: "MIDI",
          info: "Program Change ch1",
          lastValue: "pc=1",
          action: "none",
        },
      },
    });

    rerender(<Bluetooth />);

    expect(setRowAction).toHaveBeenCalledWith("MIDI:PC:ch1:1", "arrowLeft");
  });

  it("clears a function assignment from its card", () => {
    const setRowAction = vi.fn();
    mockBluetoothState.value = makeBluetoothState({
      setRowAction,
      controls: {
        "MIDI:PC:ch1:1": {
          source: "MIDI",
          info: "Program Change ch1",
          lastValue: "pc=1",
          action: "arrowLeft",
        },
      },
    });

    render(<Bluetooth />);
    fireEvent.click(screen.getByRole("button", { name: "Mapping" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear assignment" }));

    expect(setRowAction).toHaveBeenCalledWith("MIDI:PC:ch1:1", "none");
  });
});
