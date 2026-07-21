import { act, fireEvent, render, screen } from "@testing-library/react";
import NewPassword from "./NewPassword";

const mockedNavigate = vi.fn();
const mockedResetPassword = vi.fn();
const mockedLogoutUser = vi.fn();
const mockedRequestPasswordReset = vi.fn();
let mockedSearch = "email=user%40example.com&token=valid-token";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockedNavigate,
    useSearchParams: () => [new URLSearchParams(mockedSearch)],
  };
});

vi.mock("../Auth/AuthShell", () => ({ default: ({ children }) => <main>{children}</main> }));

vi.mock("../../Tools/Controllers", () => ({
  logoutUser: () => mockedLogoutUser(),
  requestPasswordReset: (email) => mockedRequestPasswordReset(email),
  resetPassword: (payload) => mockedResetPassword(payload),
}));

describe("NewPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockedSearch = "email=user%40example.com&token=valid-token";
    mockedResetPassword.mockResolvedValue({ message: "ok" });
    mockedRequestPasswordReset.mockResolvedValue({ message: "ok" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates the password, clears the old session and returns to login", async () => {
    render(<NewPassword />);

    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), {
      target: { value: "new-password" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat your password"), {
      target: { value: "new-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save New Password" }));

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockedResetPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "valid-token",
      newPassword: "new-password",
    });
    expect(mockedLogoutUser).toHaveBeenCalledOnce();
    expect(screen.getByText("Senha atualizada com sucesso. Redirecionando para o login...")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1500));

    expect(mockedNavigate).toHaveBeenCalledWith("/login", {
      replace: true,
      state: { passwordReset: true },
    });
  });

  it("requests a reset email for the informed account", async () => {
    mockedSearch = "";
    render(<NewPassword />);

    fireEvent.change(screen.getByPlaceholderText("you@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Request Reset" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRequestPasswordReset).toHaveBeenCalledWith("user@example.com");
    expect(screen.getByText("Se o email existir, você receberá um link para redefinir a senha.")).toBeInTheDocument();
  });
});
