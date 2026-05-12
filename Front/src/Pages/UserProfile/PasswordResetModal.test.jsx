import { fireEvent, render, screen } from "@testing-library/react";
import PasswordResetModal from "./PasswordResetModal";

describe("PasswordResetModal", () => {
  it("does not render when closed", () => {
    render(
      <PasswordResetModal isOpen={false} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    expect(screen.queryByText("Change Password")).not.toBeInTheDocument();
  });

  it("shows an error when the new passwords do not match", () => {
    render(<PasswordResetModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Old Password"), {
      target: { value: "old-pass" },
    });
    fireEvent.change(screen.getByPlaceholderText("New Password"), {
      target: { value: "new-pass" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm New Password"), {
      target: { value: "different-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(screen.getByText("New passwords do not match.")).toBeInTheDocument();
  });

  it("submits the old and new password when the form is valid", () => {
    const onSubmit = vi.fn();

    render(<PasswordResetModal isOpen onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Old Password"), {
      target: { value: "old-pass" },
    });
    fireEvent.change(screen.getByPlaceholderText("New Password"), {
      target: { value: "new-pass" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm New Password"), {
      target: { value: "new-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith("old-pass", "new-pass");
  });
});
