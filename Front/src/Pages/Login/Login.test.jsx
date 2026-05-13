import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "./Login";

const mockedNavigate = vi.fn();
const mockedLoginContext = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
    useNavigate: () => mockedNavigate,
  };
});

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockedLoginContext,
  }),
}));

vi.mock("../../Tools/Controllers", () => ({
  canOfflineLoginForEmail: vi.fn(),
  fetchCurrentUserProfile: vi.fn(),
  login: vi.fn(),
  tryOfflineLogin: vi.fn(),
}));

import {
  canOfflineLoginForEmail,
  fetchCurrentUserProfile,
  login as loginApi,
  tryOfflineLogin,
} from "../../Tools/Controllers";

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    window.alert.mockRestore();
  });

  it("continues offline when the device has a valid offline session", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });

    canOfflineLoginForEmail.mockReturnValue(true);
    tryOfflineLogin.mockResolvedValue(true);

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@email.com"), {
      target: { value: "user@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Continue Offline" }));

    await waitFor(() => {
      expect(tryOfflineLogin).toHaveBeenCalledWith("user@example.com");
    });

    expect(mockedNavigate).toHaveBeenCalledWith("/");
  });

  it("keeps the normal online login flow when online", async () => {
    loginApi.mockResolvedValue("access-token");
    fetchCurrentUserProfile.mockResolvedValue({ email: "user@example.com" });

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText("you@email.com"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith("user@example.com", "secret");
    });

    expect(mockedLoginContext).toHaveBeenCalledWith(
      "access-token",
      "user@example.com",
    );
    expect(localStorage.getItem("auth:rememberedEmail")).toBe("user@example.com");
    expect(localStorage.getItem("auth:stayConnected")).toBe("true");
    expect(mockedNavigate).toHaveBeenCalledWith("/");
  });

  it("prefills the remembered email and lets the user disable stay connected", async () => {
    localStorage.setItem("auth:rememberedEmail", "saved@example.com");
    localStorage.setItem("auth:stayConnected", "true");
    loginApi.mockResolvedValue("access-token");
    fetchCurrentUserProfile.mockResolvedValue({ email: "saved@example.com" });

    render(<Login />);

    expect(screen.getByPlaceholderText("you@email.com")).toHaveValue(
      "saved@example.com",
    );

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByPlaceholderText("Your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(loginApi).toHaveBeenCalledWith("saved@example.com", "secret");
    });

    expect(localStorage.getItem("auth:rememberedEmail")).toBeNull();
    expect(localStorage.getItem("auth:stayConnected")).toBe("false");
  });
});
