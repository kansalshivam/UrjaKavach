import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { Procurement } from "./Procurement";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDataFirstCall = [
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

const mockDataSecondCall = [
  {
    rank: 1,
    country: "Russia",
    grade: "Urals (Medium Sour)",
    quality_compatibility: "High",
    transit_days: 18,
    cost_premium: "-$3.50/bbl (Discounted)",
    suitability_score: 97.0,
    actual_2026_role: "Primary non-Hormuz pivot node; import share rose to historic highs due to steep price discounts."
  }
];

describe("Procurement Component DOM Render Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Resolve first call with 95% score, second call with 97% score
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

  it("renders slider, handles drag state, and updates score text from 95% to 97% dynamically", async () => {
    render(<Procurement />);

    // 1. Verify Initial Mount & API fetch
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Procurement Diversification recommendations")).toBeDefined();
    
    // 2. Verify DOM renders the initial 95% score card
    expect(screen.getByText("Russia")).toBeDefined();
    expect(screen.getByText("95%")).toBeDefined();

    // 3. Find Slider DOM element & assert default state
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.value).toBe("50");

    // 4. Simulate User Drag Event (changing value to 30)
    fireEvent.change(slider, { target: { value: "30" } });
    
    // 5. Verify reactive DOM state updates and triggers secondary fetch
    expect(slider.value).toBe("30");
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    // 6. Verify DOM renders the updated 97% score dynamically
    await waitFor(() => {
      expect(screen.getByText("97%")).toBeDefined();
    });
    // Ensure the old 95% element is no longer in the document
    expect(screen.queryByText("95%")).toBeNull();
  });
});
