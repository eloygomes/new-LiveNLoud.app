/* @vitest-environment jsdom */
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResetPasswordModal } from "./ResetPasswordModal.jsx";

describe("ResetPasswordModal", () => {
  it("requires email confirmation, matching passwords and a reason", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ResetPasswordModal
        userEmail="user@example.com"
        lastPasswordChangedAt="2026-07-21T21:27:08.000Z"
        resetRequestedAt="2026-07-21T21:30:09.000Z"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/Ultima alteracao:/).parentElement).toHaveTextContent(/\d{2}:\d{2}:08/);
    expect(screen.getByText(/Ultima solicitacao:/).parentElement).toHaveTextContent(/\d{2}:\d{2}:09/);

    const submit = screen.getByRole("button", { name: "Redefinir senha" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirme o email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByLabelText("Motivo"), {
      target: { value: "Solicitacao confirmada pelo usuario" },
    });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({
        newPassword: "new-password",
        reason: "Solicitacao confirmada pelo usuario",
      }),
    );
  });
});
