import { render, screen } from "@testing-library/react";
import AuthShell from "./AuthShell";

describe("AuthShell", () => {
  it("renders the main texts and children", () => {
    render(
      <AuthShell
        title="Login"
        subtitle="Access your account"
        panelTitle="Practice smarter"
        panelCopy="Keep your rehearsal workflow in one place."
      >
        <button type="button">Enter</button>
      </AuthShell>,
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Access your account")).toBeInTheDocument();
    expect(screen.getByText("Practice smarter")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enter" })).toBeInTheDocument();
  });

  it("hides the top header when hideHeader is true", () => {
    render(
      <AuthShell
        title="Register"
        subtitle="Create account"
        panelTitle="Start here"
        panelCopy="Simple flow."
        hideHeader
      >
        <div>Form content</div>
      </AuthShell>,
    );

    expect(screen.queryByText("Register")).not.toBeInTheDocument();
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });
});
