import { render, screen } from "@testing-library/react";
import GuitarProFileBox from "./GuitarProFileBox";

vi.mock("../../Tools/Controllers", () => ({
  deleteGuitarProFile: vi.fn(),
  uploadGuitarProFile: vi.fn(),
}));

describe("GuitarProFileBox compact layout", () => {
  it("uses the same compact hierarchy as the mobile input-link cards", () => {
    render(<GuitarProFileBox songData={null} compact />);

    expect(screen.getByText("0 files")).toBeInTheDocument();
    expect(screen.getByText("No file registered")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "Add, remove, or open the registered Guitar Pro file.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Add").closest("label")).toHaveClass("h-10");
    expect(screen.getByRole("button", { name: /Remove/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /View/i })).not.toBeInTheDocument();
    expect(screen.getByText("Add").closest("label")?.parentElement).toHaveClass(
      "grid-cols-2",
    );
  });
});
