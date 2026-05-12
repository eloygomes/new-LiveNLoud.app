import { render, screen } from "@testing-library/react";
import SoftVersion from "./SoftVersion";

describe("SoftVersion", () => {
  it("renders the current version label", () => {
    render(<SoftVersion />);

    expect(screen.getByText("VER.:0.72.0.0")).toBeInTheDocument();
  });
});
