import { render, screen } from "@testing-library/react";
import DashboardList from "./DashboardList";

vi.mock("@mui/x-data-grid", () => ({
  DataGrid: function DataGridMock(props) {
    return (
      <div>
        <div>Rows: {props.rows.length}</div>
        <div>Columns: {props.columns.length}</div>
        <div>Page size: {props.pageSize}</div>
      </div>
    );
  },
}));

vi.mock("../../main", () => ({}));

describe("DashboardList", () => {
  it("renders the data grid with the fake data", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 620,
      configurable: true,
    });

    render(<DashboardList />);

    expect(screen.getByText("Rows: 7")).toBeInTheDocument();
    expect(screen.getByText("Columns: 5")).toBeInTheDocument();
  });

  it("calculates the page size from the window height", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 620,
      configurable: true,
    });

    render(<DashboardList />);

    expect(screen.getByText("Page size: 10")).toBeInTheDocument();
  });
});
