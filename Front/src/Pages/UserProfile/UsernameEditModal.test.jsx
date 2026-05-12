import { fireEvent, render, screen } from "@testing-library/react";
import UsernameEditModal from "./UsernameEditModal";
import { updateUserName } from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  updateUserName: vi.fn(),
}));

describe("UsernameEditModal", () => {
  beforeEach(() => {
    vi.stubGlobal("alert", vi.fn());
    Object.defineProperty(window, "location", {
      value: {
        reload: vi.fn(),
      },
      configurable: true,
    });
  });

  it("does not render when closed", () => {
    render(<UsernameEditModal isOpen={false} onClose={vi.fn()} />);

    expect(screen.queryByText("Change User Name")).not.toBeInTheDocument();
  });

  it("updates the username and closes the modal", () => {
    const onClose = vi.fn();

    render(<UsernameEditModal isOpen onClose={onClose} />);

    fireEvent.change(screen.getByPlaceholderText("Insert your new username"), {
      target: { value: "new-name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    expect(updateUserName).toHaveBeenCalledWith("new-name");
    expect(alert).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });
});
