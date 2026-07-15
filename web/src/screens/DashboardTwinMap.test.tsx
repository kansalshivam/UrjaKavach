import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { App } from "./App";

// Mock ResizeObserver globally to prevent Recharts/JSDOM crash
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock react-leaflet to prevent JSDOM Map Container render issues
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ position, icon, children }: any) => (
      <div data-testid="map-marker" data-position={JSON.stringify(position)} data-icon-html={icon?.options?.html}>
        {children}
      </div>
    ),
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
    Polyline: () => <div data-testid="polyline" />,
  };
});

const mockDashboardSummary = {
  weights_used: {
    gdelt_volume: 0.35,
    price_volatility: 0.25,
    ais_deviation: 0.30,
    sanctions_flag: 0.10,
  },
  risk_scores: [
    {
      id: 1,
      corridor: "hormuz",
      computed_at: "2026-07-15T00:00:00Z",
      score: 45.2,
      component_gdelt_volume: 0.4,
      component_price_volatility: 0.5,
      component_ais_deviation: 0.6,
      component_sanctions_flag: 0.0,
      weights_used: {
        gdelt_volume: 0.35,
        price_volatility: 0.25,
        ais_deviation: 0.30,
        sanctions_flag: 0.10,
      },
      component_gdelt_stale: false,
      component_price_stale: false,
      component_ais_stale: false,
      component_sanctions_stale: false,
    }
  ],
  history: [],
  recent_articles: []
};

const mockTwinNodes = {
  nodes: [
    {
      id: "refinery_jamnagar",
      node_type: "refinery",
      name: "Jamnagar Refinery",
      lat: 22.3,
      lon: 69.7,
      capacity_value: 1.24,
      capacity_unit: "M bpd",
      source_note: "Dossier line 73"
    }
  ],
  edges: []
};

const mockTwinLive = {
  node_risks: {
    refinery_jamnagar: 20.0, // Low risk: Green marker color (< 25)
  },
  corridor_risk: {
    hormuz: 45.2
  },
  ais_data: {}
};

const mockRecomputeResponse = {
  node_risks: {
    refinery_jamnagar: 75.0, // High risk: Red marker color (> 50)
  }
};

describe("Interactive Weight Customization & Map Marker Color Integration Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    
    // Dynamic Mocking by URL endpoint
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("/api/twin/nodes")) {
        return { ok: true, json: async () => mockTwinNodes };
      }
      if (url.includes("/api/twin/live")) {
        return { ok: true, json: async () => mockTwinLive };
      }
      if (url.includes("/api/dashboard/summary")) {
        return { ok: true, json: async () => mockDashboardSummary };
      }
      if (url.includes("/api/twin/recompute")) {
        return { ok: true, json: async () => mockRecomputeResponse };
      }
      return { ok: false, status: 404 };
    });
  });

  it("handles login, navigates between tabs, modifies weights on Dashboard, recomputes high-risk state, shifts Leaflet marker color to red, and reverts on refresh", async () => {
    render(<App />);

    // 1. Handle Login on Screen 0 (Landing)
    const loginButton = screen.getByText("Authorize System Access");
    fireEvent.click(loginButton);

    // 2. Verify Map Tab loads refinery marker in initial Green state (< 25 risk)
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const marker = await screen.findByTestId("map-marker");
    expect(marker).toBeDefined();
    
    // Initial risk is 20.0 -> marker icon color should contain #10b981 (Emerald/Green)
    const initialIconHtml = marker.getAttribute("data-icon-html");
    expect(initialIconHtml).toContain("#10b981");

    // 3. Switch to Dashboard Tab
    const dashboardTab = screen.getByRole("button", { name: "Command Dashboard" });
    fireEvent.click(dashboardTab);
    
    // Wait for dashboard to fetch and render
    await screen.findByRole("slider", { name: /GDELT News Volume/i });
    const gdeltSlider = screen.getByRole("slider", { name: /GDELT News Volume/i }) as HTMLInputElement;
    expect(gdeltSlider.value).toBe("0.35");

    // 4. Drag GDELT weight to 0.0
    fireEvent.change(gdeltSlider, { target: { value: "0" } });
    
    // Wait for the recompute POST call to execute
    await waitFor(() => {
      const calls = mockFetch.mock.calls;
      const recomputeCall = calls.find(call => call[0].includes("/api/twin/recompute"));
      expect(recomputeCall).toBeDefined();
      if (recomputeCall && recomputeCall[1] && recomputeCall[1].body) {
        expect(JSON.parse(recomputeCall[1].body as string).gdelt_volume).toBe(0);
      }
    });

    // 5. Navigate back to Map Tab to verify marker color shifted to Red (#ef4444)
    const mapTab = screen.getByRole("button", { name: "Digital Twin Map" });
    fireEvent.click(mapTab);

    const updatedMarker = await screen.findByTestId("map-marker");
    const updatedIconHtml = updatedMarker.getAttribute("data-icon-html");
    
    // Verify risk has shifted to 75.0 -> marker color is #ef4444 (Red)
    expect(updatedIconHtml).toContain("#ef4444");

    // 6. Reset weights simulation: Refresh triggers remount and baseline reload
    // Switch to Dashboard and verify refreshed load returns to DB baseline
    fireEvent.click(dashboardTab);
    await waitFor(() => {
      const refreshedGdeltSlider = screen.getByRole("slider", { name: /GDELT News Volume/i }) as HTMLInputElement;
      expect(refreshedGdeltSlider.value).toBe("0.35");
    });
  });
});
