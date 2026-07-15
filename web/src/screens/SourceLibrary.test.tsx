import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { SourceLibrary } from "./SourceLibrary";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDocsList = [
  {
    id: "PIB-2026-01",
    title: "Strategic Petroleum Reserves Capacity and Fill Status",
    source: "Press Information Bureau (PIB)",
    date: "March 12, 2026",
    summary: "Official statement on ISPRL rock caverns capacity."
  },
  {
    id: "PPAC-2026-02",
    title: "Refinery Crude Processing Statistics and Capacity Report",
    source: "Petroleum Planning & Analysis Cell (PPAC)",
    date: "February 28, 2026",
    summary: "PPAC report detailing refining capacities."
  }
];

const mockDocDetail = {
  id: "PIB-2026-01",
  title: "Strategic Petroleum Reserves Capacity and Fill Status",
  source: "Press Information Bureau (PIB)",
  date: "March 12, 2026",
  content: "Indian Strategic Petroleum Reserves Limited (ISPRL) maintains 5.33 MMT."
};

const mockQueryResponse = {
  answer: "According to [PIB-2026-01], ISPRL maintains 5.33 MMT of crude oil storage.",
  retrieved_documents: ["PIB-2026-01"]
};

describe("SourceLibrary Component DOM Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocsList
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDocDetail
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockQueryResponse
      });
  });

  it("loads publications list, displays excerpts, and handles query submissions successfully", async () => {
    render(<SourceLibrary />);

    // 1. Verify Documents List Fetched on Mount
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Geopolitical & Commodity Intelligence Center")).toBeDefined();
    expect(screen.getByText("Strategic Petroleum Reserves Capacity and Fill Status")).toBeDefined();
    expect(screen.getByText("Refinery Crude Processing Statistics and Capacity Report")).toBeDefined();

    // 2. Verify First Document detail is auto-loaded
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Indian Strategic Petroleum Reserves Limited (ISPRL) maintains 5.33 MMT.")).toBeDefined();

    // 3. Find Input and submit query
    const input = screen.getByPlaceholderText("e.g. What is the fill level of the caverns?") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "cavern capacity" } });
    
    const queryButton = screen.getByRole("button", { name: "Query" });
    fireEvent.click(queryButton);

    // 4. Verify RAG query executed and displays result with citations
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    expect(screen.getByText("According to [PIB-2026-01], ISPRL maintains 5.33 MMT of crude oil storage.")).toBeDefined();
    expect(screen.getAllByText("PIB-2026-01")).toBeDefined();
  });
});
