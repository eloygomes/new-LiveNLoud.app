import { fireEvent, render, screen } from "@testing-library/react";
import SearchBox from "./SearchBox";

function renderSearchBox(customProps = {}) {
  const defaultProps = {
    searchTerm: "",
    setSearchTerm: vi.fn(),
  };

  const props = { ...defaultProps, ...customProps };

  render(<SearchBox {...props} />);

  return props;
}

describe("SearchBox", () => {
  it("shows the current search text in the input", () => {
    renderSearchBox({ searchTerm: "Oceans" });

    expect(
      screen.getByPlaceholderText("Buscar música ou artista..."),
    ).toHaveValue("Oceans");
  });

  it("calls setSearchTerm with the typed value", () => {
    const setSearchTerm = vi.fn();

    renderSearchBox({ setSearchTerm });

    fireEvent.change(
      screen.getByPlaceholderText("Buscar música ou artista..."),
      {
        target: { value: "Hillsong" },
      },
    );

    expect(setSearchTerm).toHaveBeenCalledWith("Hillsong");
  });

  it("clears the search text when the clear button is clicked", () => {
    const setSearchTerm = vi.fn();

    renderSearchBox({
      searchTerm: "Hillsong",
      setSearchTerm,
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(setSearchTerm).toHaveBeenCalledWith("");
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();

    renderSearchBox({ onClose });

    fireEvent.click(screen.getByRole("button", { name: "Close search" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onEscape without clearing the search text", () => {
    const onEscape = vi.fn();
    const setSearchTerm = vi.fn();

    renderSearchBox({
      searchTerm: "ludov",
      setSearchTerm,
      onEscape,
    });

    fireEvent.keyDown(screen.getByPlaceholderText("Buscar música ou artista..."), {
      key: "Escape",
    });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(setSearchTerm).not.toHaveBeenCalled();
  });

  it("does not render the close button when onClose is not provided", () => {
    renderSearchBox();

    expect(
      screen.queryByRole("button", { name: "Close search" }),
    ).not.toBeInTheDocument();
  });
});
