import { fireEvent, render, screen } from "@testing-library/react";
import SetlistExport from "./SetlistExport";

function FakeTxtIcon() {
  return <span>TXT ICON</span>;
}

function FakeJsonIcon() {
  return <span>JSON ICON</span>;
}

describe("SetlistExport", () => {
  it("disables export buttons when there are no visible songs", () => {
    render(
      <SetlistExport
        handleExportText={vi.fn()}
        handleExportJson={vi.fn()}
        visibleSongs={[]}
        FiFileText={FakeTxtIcon}
        VscJson={FakeJsonIcon}
      />,
    );

    expect(screen.getByRole("button", { name: /txt/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /json/i })).toBeDisabled();
  });

  it("calls the correct handlers when export buttons are clicked", () => {
    const handleExportText = vi.fn();
    const handleExportJson = vi.fn();

    render(
      <SetlistExport
        handleExportText={handleExportText}
        handleExportJson={handleExportJson}
        visibleSongs={[{ song: "Oceans" }]}
        FiFileText={FakeTxtIcon}
        VscJson={FakeJsonIcon}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /txt/i }));
    fireEvent.click(screen.getByRole("button", { name: /json/i }));

    expect(handleExportText).toHaveBeenCalledTimes(1);
    expect(handleExportJson).toHaveBeenCalledTimes(1);
  });
});
