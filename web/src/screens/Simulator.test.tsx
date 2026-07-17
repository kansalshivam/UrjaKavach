import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Simulator } from "./Simulator";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSimResponse = {
  id: 1,
  scenario_id: "hormuz_partial_closure",
  capacity_available_pct: 30,
  run_at: "2026-07-15T00:00:00Z",
  projected_import_volume_change_pct: -23.0,
  projected_spr_days_cover: 2.6,
  narrative_text: "Severe scenario test. Shortfall of -23% imports."
};

describe("Simulator Component DOM Render Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockSimResponse
    });
  });

  it("renders slider, calibration disclosure, and computes projections dynamically on slider change", async () => {
    render(<Simulator />);

    // 1. Locate and drag slider to 30%
    const slider = screen.getByRole("slider", { name: /Corridor Capacity Available/i }) as HTMLInputElement;
    expect(slider.value).toBe("100");
    
    fireEvent.change(slider, { target: { value: "30" } });

    // 2. Wait for the fetch debouncer to fire and resolve
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    
    const lastFetchCall = mockFetch.mock.calls[0];
    expect(lastFetchCall[0]).toBe("/api/scenario/run");
    expect(JSON.parse(lastFetchCall[1].body).capacity_available_pct).toBe(30);

    // 3. Verify calibration notice is displayed post-calculation
    await waitFor(() => {
      expect(screen.getByText(/This simulation uses a two-point linear interpolation/i)).toBeDefined();
    });

    // 4. Verify projections render on screen
    await waitFor(() => {
      expect(screen.getAllByText(/-23\.0/)[0]).toBeDefined();
      expect(screen.getAllByText(/2\.6/)[0]).toBeDefined();
      expect(screen.getAllByText(/days/i)[0]).toBeDefined();
    });
  });
});
