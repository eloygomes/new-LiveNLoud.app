import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import FloatingActionButtons from "./FloatingActionButtons";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe("FloatingActionButtons", () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it("renders the add button on desktop layouts", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });

    render(
      <MemoryRouter>
        <FloatingActionButtons />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("button", { name: "Choose new song type" }),
    ).toBeInTheDocument();
  });

  it("does not render on touch layouts", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 480,
      configurable: true,
    });

    render(
      <MemoryRouter>
        <FloatingActionButtons />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("button", { name: "Choose new song type" }),
    ).not.toBeInTheDocument();
  });

  it("opens the new song choice when the A shortcut is pressed outside inputs", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });

    render(
      <MemoryRouter>
        <FloatingActionButtons />
      </MemoryRouter>,
    );

    fireEvent.keyDown(window, { key: "a", target: document.body });

    expect(screen.getByText("New song")).toBeInTheDocument();
  });

  it("hides while dashboard options are open", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });

    render(
      <MemoryRouter>
        <FloatingActionButtons />
      </MemoryRouter>,
    );

    window.dispatchEvent(
      new CustomEvent("dashboard-options-visibility-change", {
        detail: { open: true },
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Choose new song type" }),
      ).not.toBeInTheDocument();
    });
  });
});
