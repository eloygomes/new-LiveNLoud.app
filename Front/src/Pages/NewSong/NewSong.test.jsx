import { fireEvent, render, screen } from "@testing-library/react";
import NewSong from "./NewSong";

vi.mock("./NewSongColumnA", () => ({
  default: function NewSongColumnAMock({ touchSection }) {
    return <div>Column A: {touchSection}</div>;
  },
}));

vi.mock("./NewSongColumnB", () => ({
  default: function NewSongColumnBMock({ touchSection }) {
    return <div>Column B: {touchSection}</div>;
  },
}));

vi.mock("../../Tools/SnackBar", () => ({
  default: function SnackBarMock() {
    return <div>Snackbar</div>;
  },
}));

vi.mock("../../Tools/Controllers", () => ({
  requestData: vi.fn().mockResolvedValue(""),
}));

vi.mock("../../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "songPages.plus": "Add",
        "songPages.newSong": "New Song",
        "songPages.newSongDescription": "Build a song workspace.",
        "songPages.delete": "Delete",
        "songPages.save": "Save",
      })[key] || key,
  }),
}));

describe("NewSong mobile hub", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });
  });

  it("shows four focused areas while song data remains persistent", () => {
    render(<NewSong />);

    expect(screen.queryByText("Build a song workspace.")).not.toBeInTheDocument();
    expect(screen.getByLabelText("New song sections")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Open Input Links" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Guitar Pro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Videos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Setlist" })).toBeInTheDocument();
  });

  it("opens a section and returns to the mobile menu", () => {
    render(<NewSong />);

    fireEvent.click(screen.getByRole("button", { name: "Open Videos" }));
    expect(screen.getByText("Column A: videos")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to new song menu" }));
    expect(screen.getByLabelText("New song sections")).toBeInTheDocument();
  });
});
