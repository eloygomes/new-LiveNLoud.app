import { render, screen } from "@testing-library/react";
import SoftVersion from "./SoftVersion";

describe("SoftVersion", () => {
  it("renders the current version label", () => {
    render(<SoftVersion />);

    expect(screen.getByText("0.77.1.0")).toBeInTheDocument();
  });
});
