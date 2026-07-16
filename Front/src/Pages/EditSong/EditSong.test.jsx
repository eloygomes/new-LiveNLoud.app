import { fireEvent, render, screen } from "@testing-library/react";
import EditSong from "./EditSong";

vi.mock("./EditSongColumnA", () => ({
  default: function EditSongColumnAMock({ touchSection }) {
    return <div>Column A: {touchSection}</div>;
  },
}));

vi.mock("./EditSongColumnB", () => ({
  default: function EditSongColumnBMock({ touchSection }) {
    return <div>Column B: {touchSection}</div>;
  },
}));

vi.mock("../../Tools/SnackBar", () => ({
  default: () => <div>Snackbar</div>,
}));

vi.mock("../../Tools/Controllers", () => ({
  fetchAllSongData: vi.fn().mockResolvedValue(""),
}));

vi.mock("../shared/setlistNavigation", () => ({
  getAdjacentSetlistSongs: () => ({
    previousSetlistSong: null,
    nextSetlistSong: null,
  }),
  loadActiveSetlistSongs: vi.fn().mockResolvedValue([]),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ artist: "Artist", song: "Song" }),
}));

vi.mock("../../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "songPages.edit": "Edit",
        "songPages.editSong": "Edit Song",
        "songPages.delete": "Delete",
        "songPages.update": "Update",
        "songPages.previousSong": "Previous song",
        "songPages.nextSong": "Next song",
      })[key] || key,
  }),
}));

describe("EditSong mobile hub", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      value: 375,
      configurable: true,
    });
    localStorage.setItem("userEmail", "test@example.com");
  });

  it("matches the section-based New Song mobile experience", () => {
    render(<EditSong />);

    expect(screen.getByLabelText("Edit song sections")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Open / })).toHaveLength(4);

    fireEvent.click(screen.getByRole("button", { name: "Open Guitar Pro" }));
    expect(screen.getByText("Column A: guitarPro")).toBeInTheDocument();
    expect(screen.getByText("Column B: guitarPro")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to edit song menu" }));
    expect(screen.getByLabelText("Edit song sections")).toBeInTheDocument();
  });
});
