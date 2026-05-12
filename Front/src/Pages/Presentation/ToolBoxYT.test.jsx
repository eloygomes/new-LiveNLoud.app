import { fireEvent, render, screen } from "@testing-library/react";
import ToolBoxYT from "./ToolBoxYT";

describe("ToolBoxYT", () => {
  it("renders nothing inline when there is no active video", () => {
    const { container } = render(<ToolBoxYT renderInline isTouchLayout />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders an inline preview button for a valid video link", () => {
    render(
      <ToolBoxYT
        renderInline
        isTouchLayout
        linktoplay="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        setVideoModalStatus={vi.fn()}
        setLinktoplay={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText(/play video inline/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Tap to play inline")).toBeInTheDocument();
  });

  it("closes the accordion and clears the link", () => {
    const setVideoModalStatus = vi.fn();
    const setLinktoplay = vi.fn();

    render(
      <ToolBoxYT
        embedLinks={["https://www.youtube.com/watch?v=dQw4w9WgXcQ"]}
        linktoplay="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        setVideoModalStatus={setVideoModalStatus}
        setLinktoplay={setLinktoplay}
      />,
    );

    fireEvent.click(screen.getByTestId("CloseIcon"));

    expect(setVideoModalStatus).toHaveBeenCalledWith(false);
    expect(setLinktoplay).toHaveBeenCalledWith(null);
  });
});
