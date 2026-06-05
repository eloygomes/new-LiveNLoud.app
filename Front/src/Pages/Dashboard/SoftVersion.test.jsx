import { render, screen } from "@testing-library/react";
import SoftVersion from "./SoftVersion";

describe("SoftVersion", () => {
  it("renders the current version label", () => {
    render(<SoftVersion />);

    expect(
      screen.getByText("Fetching latest version from origin"),
    ).toBeInTheDocument();
  });
});
