import { fireEvent, render, screen } from "@testing-library/react";
import DeleteAccountModal from "./DeleteAccountModal";

describe("DeleteAccountModal", () => {
  it("does not render when the modal is closed", () => {
    render(
      <DeleteAccountModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(
      screen.queryByText("Confirm Account Deletion"),
    ).not.toBeInTheDocument();
  });

  it("submits only when the confirmation text is DELETE", () => {
    const onSubmit = vi.fn();

    render(
      <DeleteAccountModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret" },
    });
    fireEvent.change(screen.getByPlaceholderText("Type DELETE to confirm"), {
      target: { value: "DELETE" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));

    expect(onSubmit).toHaveBeenCalledWith("secret", "DELETE");
  });

  it("resets the form and closes the modal when cancel is clicked", () => {
    const onClose = vi.fn();

    render(<DeleteAccountModal isOpen onClose={onClose} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
