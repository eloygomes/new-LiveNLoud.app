import { render, screen } from "@testing-library/react";
import SoftVersion from "./SoftVersion";

describe("SoftVersion", () => {
  it("renders the current version label", () => {
    render(<SoftVersion />);

    expect(screen.getByText("0.75.7.3")).toBeInTheDocument();
  });
});
