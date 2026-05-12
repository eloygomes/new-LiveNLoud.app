import { render, screen } from "@testing-library/react";
import Insights from "./Insights";

describe("Insights", () => {
  it("renders metrics and instrument summary", () => {
    render(
      <Insights
        dashboardMetrics={{
          averageProgress: 80,
          totalSongs: 10,
          readySongs: 6,
          emptyProgressSongs: 1,
          topInstrument: { label: "Guitar", count: 7 },
          instrumentCounts: [
            { key: "guitar", label: "Guitar", count: 7 },
            { key: "bass", label: "Bass", count: 3 },
          ],
        }}
      />,
    );

    expect(screen.getByText("10 visible songs")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Guitar: 7")).toBeInTheDocument();
    expect(screen.getByText("Bass: 3")).toBeInTheDocument();
  });

  it("renders fallback values when metrics are missing", () => {
    render(<Insights />);

    expect(screen.getAllByText("0 visible songs").length).toBeGreaterThan(0);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
