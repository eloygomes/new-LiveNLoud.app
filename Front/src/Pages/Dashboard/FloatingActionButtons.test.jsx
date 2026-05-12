import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("link")).toHaveAttribute("href", "/newsong");
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

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("navigates to /newsong when the A shortcut is pressed outside inputs", () => {
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

    expect(navigateMock).toHaveBeenCalledWith("/newsong");
  });
});
