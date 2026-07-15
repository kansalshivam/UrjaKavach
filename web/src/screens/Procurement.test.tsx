import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Procurement } from "./Procurement";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockData = [
  {
    rank: 1,
    country: "Russia",
    grade: "Urals (Medium Sour)",
    quality_compatibility: "High",
    transit_days: 18,
    cost_premium: "-$3.50/bbl (Discounted)",
    suitability_score: 95.0,
    actual_2026_role: "Primary non-Hormuz pivot node; import share rose to historic highs due to steep price discounts."
  }
];

describe("Procurement Component DOM Render Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData
    });
  });

  it("renders slider and recommendations dynamically", async () => {
    render(<Procurement />);

    // Wait for the mock fetch to be called
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    // Assert that the title and benchmark are rendered
    expect(screen.getByText("Procurement Diversification recommendations")).toBeDefined();
    
    // Assert that Russia is rendered with its suitability score and 2026 role
    expect(screen.getByText("Russia")).toBeDefined();
    expect(screen.getByText("95%")).toBeDefined();
    expect(screen.queryByText(/Primary non-Hormuz pivot/)).toBeDefined();

    // Find the slider and simulate a change event
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.value).toBe("50");

    // Change slider to 30
    fireEvent.change(slider, { target: { value: "30" } });
    
    // Verify it updates state and calls fetch again
    expect(slider.value).toBe("30");
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
  });
});
