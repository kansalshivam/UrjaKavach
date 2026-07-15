import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Reserve } from "./Reserve";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDataFirstCall = {
  isprl_available_barrels: 23357267.4,
  omc_available_barrels: 322500000.0,
  total_available_barrels: 23357267.4,
  raw_shortfall_barrels_day: 1320000.0,
  mitigated_shortfall_barrels_day: 660000.0,
  days_cover_remaining: 35.4,
  iea_benchmark_days: 90.0,
  caverns: [
    { name: "Visakhapatnam", capacity_mmt: 1.33, fill_pct: 63.26, current_stock_mmt: 0.8414 },
    { name: "Mangaluru", capacity_mmt: 1.5, fill_pct: 63.26, current_stock_mmt: 0.9490 },
    { name: "Padur", capacity_mmt: 2.5, fill_pct: 63.26, current_stock_mmt: 1.5816 }
  ]
};

const mockDataSecondCall = {
  isprl_available_barrels: 23357267.4,
  omc_available_barrels: 322500000.0,
  total_available_barrels: 23357267.4,
  raw_shortfall_barrels_day: 2200000.0,
  mitigated_shortfall_barrels_day: 1540000.0,
  days_cover_remaining: 15.2,
  iea_benchmark_days: 90.0,
  caverns: [
    { name: "Visakhapatnam", capacity_mmt: 1.33, fill_pct: 63.26, current_stock_mmt: 0.8414 },
    { name: "Mangaluru", capacity_mmt: 1.5, fill_pct: 63.26, current_stock_mmt: 0.9490 },
    { name: "Padur", capacity_mmt: 2.5, fill_pct: 63.26, current_stock_mmt: 1.5816 }
  ]
};

describe("Reserve Component DOM Render Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataFirstCall
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDataSecondCall
      });
  });

  it("renders planner controls, details table, and updates cover days from 35.4 to 15.2 on slider changes", async () => {
    render(<Reserve />);

    // 1. Verify Initial Mount & API fetch
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Strategic Reserve Drawdown Planner")).toBeDefined();
    
    // 2. Verify DOM renders the initial 35.4 Days metrics card
    expect(screen.getByText("35.4 Days")).toBeDefined();
    expect(screen.getByText("0.66M bpd")).toBeDefined();

    // 3. Verify Caverns table renders correctly with real data
    expect(screen.getByText("Visakhapatnam")).toBeDefined();
    expect(screen.getByText("Mangaluru")).toBeDefined();
    expect(screen.getByText("Padur")).toBeDefined();
    expect(screen.getByText("1.33 MMT")).toBeDefined();
    expect(screen.getByText("1.50 MMT")).toBeDefined();
    expect(screen.getByText("2.50 MMT")).toBeDefined();

    // 4. Find Slider DOM element & assert default state
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.value).toBe("30"); // default set to 30.0 in state

    // 5. Simulate User Drag Event (changing value to 50)
    fireEvent.change(slider, { target: { value: "50" } });
    
    // 6. Verify reactive DOM state updates and triggers secondary fetch
    expect(slider.value).toBe("50");
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    // 7. Verify DOM renders the updated 15.2 Days cover dynamically
    await waitFor(() => {
      expect(screen.getByText("15.2 Days")).toBeDefined();
    });
    expect(screen.queryByText("35.4 Days")).toBeNull();
  });
});
