import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Admin UI error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="login-screen">
          <section className="login-panel">
            <h1>Erro no Admin</h1>
            <p className="form-error">{this.state.error.message}</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
