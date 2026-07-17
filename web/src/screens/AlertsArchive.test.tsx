import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AlertsArchive } from "./AlertsArchive";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAlertsData = {
  alerts: [
    {
      id: 1,
      corridor: "global",
      alert_type: "price_volatility",
      triggered_at: "2026-07-15T12:00:00+00:00",
      value: 15.2,
      threshold: 10.0,
      description: "Brent crude spot price 3-day volatility reached 15.20% (threshold: 10.0%)",
      raw_payload: { price_volatility: 15.2 }
    },
    {
      id: 2,
      corridor: "hormuz",
      alert_type: "gdelt_zscore",
      triggered_at: "2026-07-15T12:10:00+00:00",
      value: 2.5,
      threshold: 2.0,
      description: "GDELT article volume z-score for corridor 'hormuz' reached 2.50 (threshold: 2.0)",
      raw_payload: { z_score: 2.5 }
    }
  ]
};

describe("AlertsArchive Component DOM Render Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAlertsData
    });
    // Mock window.open
    vi.stubGlobal("open", vi.fn());
  });

  it("renders headers, alert items list, and displays payload inspector details on click", async () => {
    render(<AlertsArchive />);

    // 1. Verify API Fetch is called
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Geopolitical Alert Archive & Export")).toBeDefined();

    // 2. Verify List is rendered
    expect(screen.getByText("Global Market")).toBeDefined();
    expect(screen.getByText("Hormuz")).toBeDefined();
    expect(screen.getByText("Brent crude spot price 3-day volatility reached 15.20% (threshold: 10.0%)")).toBeDefined();

    // 3. Verify Default Selection (first alert details shown)
    expect(screen.getByText("ALERT_ID #1")).toBeDefined();
    expect(screen.getByText("price_volatility")).toBeDefined();

    // 4. Click second item to inspect its payload
    const secondItem = screen.getByText("Hormuz");
    fireEvent.click(secondItem);

    // 5. Verify the second item is selected
    await waitFor(() => {
      expect(screen.getByText("ALERT_ID #2")).toBeDefined();
    });
    expect(screen.getByText("gdelt_zscore")).toBeDefined();
    expect(screen.getByText(/"z_score": 2.5/)).toBeDefined();

    // 6. Test CSV Export Button
    const exportBtn = screen.getByText("Export CSV Archive");
    fireEvent.click(exportBtn);
    expect(window.open).toHaveBeenCalledWith("/api/alerts/export", "_blank");
  });
});
