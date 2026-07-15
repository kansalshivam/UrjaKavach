import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { SourceLibrary } from "./SourceLibrary";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockDocsList = [
  {
    id: "SYNTH-MODEL-ISPRL-CAPACITY",
    title: "Reference Specification: Strategic Petroleum Reserves & Caverns",
    source: "Urja Kavach Reference Data Model",
    date: "March 12, 2026",
    summary: "Synthetic modeling reference for ISPRL caverns fill levels, capacities, and OMC commercial reserves."
  },
  {
    id: "SYNTH-MODEL-REFINERY-DATA",
    title: "Reference Specification: Refinery Tonnage & Sourcing Composition",
    source: "Urja Kavach Reference Data Model",
    date: "February 28, 2026",
    summary: "Synthetic modeling reference for refining nameplate capacities, private-public shares, and Jamnagar throughput."
  }
];

const mockDocDetail = {
  id: "SYNTH-MODEL-ISPRL-CAPACITY",
  title: "Reference Specification: Strategic Petroleum Reserves & Caverns",
  source: "Urja Kavach Reference Data Model",
  date: "March 12, 2026",
  content: "Model Reference: The Indian Strategic Petroleum Reserves Limited (ISPRL) capacity is set to 5.33 Million Metric Tonnes (MMT) across three underground rock cavern facilities: Visakhapatnam (1.33 MMT), Mangaluru (1.50 MMT), and Padur (2.50 MMT)."
};

const mockQueryResponse = {
  answer: "Synthesized locally from SYNTH-MODEL-ISPRL-CAPACITY reference data — not sourced from a live document retrieval.",
  retrieved_documents: ["SYNTH-MODEL-ISPRL-CAPACITY"]
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
    expect(screen.getByText("Reference Model Specifications Library")).toBeDefined();
    expect(screen.getByText("Reference Specification: Strategic Petroleum Reserves & Caverns")).toBeDefined();
    expect(screen.getByText("Reference Specification: Refinery Tonnage & Sourcing Composition")).toBeDefined();

    // 2. Verify First Document detail is auto-loaded
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Model Reference: The Indian Strategic Petroleum Reserves Limited (ISPRL) capacity is set to 5.33 Million Metric Tonnes (MMT) across three underground rock cavern facilities: Visakhapatnam (1.33 MMT), Mangaluru (1.50 MMT), and Padur (2.50 MMT).")).toBeDefined();

    // 3. Find Input and submit query
    const input = screen.getByPlaceholderText("e.g. What is the fill level of the caverns?") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "cavern capacity" } });
    
    const queryButton = screen.getByRole("button", { name: "Query" });
    fireEvent.click(queryButton);

    // 4. Verify RAG query executed and displays result with citations
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    expect(screen.getByText("Synthesized locally from SYNTH-MODEL-ISPRL-CAPACITY reference data — not sourced from a live document retrieval.")).toBeDefined();
    expect(screen.getAllByText("SYNTH-MODEL-ISPRL-CAPACITY")).toBeDefined();

    // Print DOM snapshot for direct visual/semantic verification
    console.log("=== RENDERED DOM SNAPSHOT ===");
    console.log(document.body.innerHTML);
    console.log("=============================");
  });
});
