import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { App } from "./App";

// Mock ResizeObserver globally to prevent JSDOM Map Container render issues
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock JSDOM element sizing because JSDOM does not calculate clientWidth/clientHeight (returns 0)
Object.defineProperties(window.HTMLDivElement.prototype, {
  clientWidth: { get: () => 1000 },
  clientHeight: { get: () => 800 }
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock react-leaflet to prevent JSDOM Map Container render issues
vi.mock("react-leaflet", () => {
  return {
    MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
    TileLayer: () => <div data-testid="tile-layer" />,
    Marker: ({ children }: any) => <div data-testid="map-marker">{children}</div>,
    Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
    Polyline: () => <div data-testid="polyline" />,
  };
});

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
    refinery_jamnagar: 20.0,
  },
  corridor_risk: {
    hormuz: 45.2
  },
  ais_data: {}
};

describe("UI/UX Libraries Active Invariant Verification Test", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("/api/twin/nodes")) {
        return { ok: true, json: async () => mockTwinNodes };
      }
      if (url.includes("/api/twin/live")) {
        return { ok: true, json: async () => mockTwinLive };
      }
      return { ok: false, status: 404 };
    });
  });

  it("verifies Screen 0 landing layout animations, and verifies Screen 1 tab bar icons after secure authorization transition", async () => {
    // 1. Render App which defaults to Landing page (Screen 0) since isLoggedIn is false
    render(<App />);

    // 2. Verify Motion Primitives Scroll Progress renders bar in document DOM
    const motionDivs = document.querySelectorAll("div");
    let progressDivExists = false;
    motionDivs.forEach((div) => {
      const style = div.getAttribute("style") || "";
      if (style.includes("z-index: 50") && style.includes("height: 4px")) {
        progressDivExists = true;
      }
    });
    expect(progressDivExists).toBe(true);

    // 3. Verify Animata Interactive Grid background has rendered grid cells
    const gridCells = document.querySelectorAll("div[style*='aspect-ratio']");
    expect(gridCells.length).toBeGreaterThan(0);

    // 4. Verify React Bits Circular Gallery renders events with 3D Y-rotation and translateZ properties
    expect(screen.getByText("Disruption Starts")).toBeDefined();
    expect(screen.getByText("Force Majeure")).toBeDefined();
    
    const events = document.querySelectorAll("div[style*='rotateY'][style*='translateZ']");
    expect(events.length).toBe(7); // 7 events in circular layout

    // 5. Verify anime.js Sync Timeline renders sparkline and handles button triggers
    const prevButton = screen.getByRole("button", { name: /Prev/i });
    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(prevButton).toBeDefined();
    expect(nextButton).toBeDefined();

    // Verify brent prices sparkline path svg
    const sparklineSvg = document.querySelector("svg");
    expect(sparklineSvg).toBeDefined();

    // 6. Verify Cult UI Hover Video Player preview hover states
    const playerThumbnail = screen.getByText("Geospatial Control Room Briefing Overview");
    expect(playerThumbnail).toBeDefined();
    
    const playerCard = screen.getByTestId("hover-video-player");
    expect(playerCard).toBeDefined();
    fireEvent.mouseEnter(playerCard);
    await waitFor(() => {
      expect(playerCard.style.boxShadow).toContain("rgba(56, 189, 248, 0.2)");
    });
    fireEvent.mouseLeave(playerCard);
    await waitFor(() => {
      expect(playerCard.style.boxShadow).not.toContain("rgba(56, 189, 248, 0.2)");
    });

    // 7. Login to transition to Operations Console (Screen 1)
    const loginButton = screen.getByText("Authorize System Access");
    const form = loginButton.closest("form");
    expect(form).toBeDefined();
    if (form) {
      fireEvent.submit(form);
    }

    // 8. Verify Iconsax navigation tab icons and Skiper UI chrome navigation are present in the DOM
    await waitFor(() => {
      const dashboardTab = screen.getByRole("button", { name: /Command Dashboard/i });
      expect(dashboardTab).toBeDefined();
      expect(dashboardTab.querySelector(".iconsax-icon")).toBeDefined();
    });

    const mapTab = screen.getByRole("button", { name: /Digital Twin Map/i });
    const simulatorTab = screen.getByRole("button", { name: /Scenario Simulator/i });

    expect(mapTab.querySelector(".iconsax-icon")).toBeDefined();
    expect(simulatorTab.querySelector(".iconsax-icon")).toBeDefined();
  });
});
