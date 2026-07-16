import { fireEvent, render, screen } from "@testing-library/react";
import { ChromeExtensionInfoModal } from "./NewSongInputLinkBox";

describe("ChromeExtensionInfoModal", () => {
  it("presents the extension information in compact, scannable groups", () => {
    const onClose = vi.fn();
    render(<ChromeExtensionInfoModal onClose={onClose} />);

    expect(screen.getByRole("dialog")).toHaveClass("max-h-[84dvh]");
    expect(screen.getByRole("heading", { name: "Chrome Extension" })).toHaveClass(
      "text-[1.4rem]",
    );
    expect(screen.getByText("Choose instruments")).toBeInTheDocument();
    expect(screen.getByText("Set details")).toBeInTheDocument();
    expect(screen.getByText("Add instantly")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download extension/i })).toHaveClass(
      "h-11",
    );

    fireEvent.click(
      screen.getAllByRole("button", {
        name: "Close Chrome Extension information",
      })[1],
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
