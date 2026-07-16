import { fireEvent, render, screen } from "@testing-library/react";
import NewSongColumnB from "./NewSongColumnB";

vi.mock("./NewSongInputLinkBox", () => ({
  default: function NewSongInputLinkBoxMock() {
    return <div>Compact instrument controls</div>;
  },
}));

vi.mock("../../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key) =>
      ({
        "instrumentModal.closeInstrument": "Close instrument",
        "instrumentModal.details": "Instrument details",
        "instrumentModal.urlHelp": "Add or manage the source link.",
      })[key] || key,
  }),
}));

describe("NewSongColumnB touch cards", () => {
  it("uses compact icons, displays progress and opens a proportionate sheet", () => {
    render(
      <NewSongColumnB
        touchLayout
        touchSection="links"
        guitar01=""
        guitar02=""
        bass=""
        keyboard=""
        drums=""
        voice=""
        progBarG01={35}
      />,
    );

    const guitarCard = screen.getByText("Guitar 01").closest("button");
    const compactIcon = guitarCard?.querySelector(".h-7.w-7");

    expect(compactIcon).toBeInTheDocument();
    expect(guitarCard).toHaveTextContent("35%");

    fireEvent.click(guitarCard);

    expect(screen.getByText("Instrument details")).toBeInTheDocument();
    expect(screen.getByText("Compact instrument controls")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Close instrument" }),
    ).toHaveLength(2);
  });
});
