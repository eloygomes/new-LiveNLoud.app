import { render, screen } from "@testing-library/react";
import Dashboard from "./Dashboard";

const outletContextMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useOutletContext: () => outletContextMock(),
  };
});

vi.mock("./DashList2", () => ({
  default: function DashList2Mock({ searchTerm }) {
    return <div>Dash list search: {searchTerm}</div>;
  },
}));

vi.mock("./FloatingActionButtons", () => ({
  default: function FloatingActionButtonsMock() {
    return <div>Floating buttons</div>;
  },
}));

vi.mock("./SoftVersion", () => ({
  default: function SoftVersionMock() {
    return <div>Soft version</div>;
  },
}));

describe("Dashboard", () => {
  beforeEach(() => {
    outletContextMock.mockReturnValue({ searchTerm: "oceans" });
  });

  it("renders the mobile layout on small screens", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 400,
      configurable: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("Dash list search: oceans")).toBeInTheDocument();
    expect(screen.getByText("Floating buttons")).toBeInTheDocument();
    expect(screen.queryByText("Soft version")).not.toBeInTheDocument();
  });

  it("renders the card layout on portrait tablets up to 1279px", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1366,
      configurable: true,
    });

    render(<Dashboard />);

    expect(screen.queryByText("Soft version")).not.toBeInTheDocument();
  });

  it("renders the desktop layout from 1280px even in portrait", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1600,
      configurable: true,
    });

    const { container } = render(<Dashboard />);

    expect(container.querySelector(".desktop")).toBeInTheDocument();
    expect(container.querySelector(".mobile")).not.toBeInTheDocument();
  });

  it("renders the desktop layout and the soft version on large screens", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1440,
      configurable: true,
    });

    render(<Dashboard />);

    expect(screen.getByText("Dash list search: oceans")).toBeInTheDocument();
    expect(screen.getByText("Floating buttons")).toBeInTheDocument();
    expect(screen.getByText("Soft version")).toBeInTheDocument();
  });

  it("clears cached song data in localStorage on mount", () => {
    Object.defineProperty(window, "innerWidth", {
      value: 1440,
      configurable: true,
    });

    localStorage.setItem("artist", "old");
    localStorage.setItem("song", "old");
    localStorage.setItem("cifraFROMDB", "old");
    localStorage.setItem("fromWHERE", "old");

    render(<Dashboard />);

    expect(localStorage.getItem("artist")).toBe("");
    expect(localStorage.getItem("song")).toBe("");
    expect(localStorage.getItem("cifraFROMDB")).toBe("");
    expect(localStorage.getItem("fromWHERE")).toBe("");
  });
});
