"""Tests for the NetworkX graph propagation model — per Architecture Plan §11."""
from app.graph.propagation import build_graph, propagate_risk


def test_propagation_decays_with_distance():
    """Verify that propagated risk decays with distance from the source."""
    nodes = [
        {"id": "hormuz", "name": "Strait of Hormuz"},
        {"id": "port_a", "name": "Port A"},
        {"id": "refinery_b", "name": "Refinery B"},
    ]
    edges = [
        {"from_node_id": "hormuz", "to_node_id": "port_a"},
        {"from_node_id": "port_a", "to_node_id": "refinery_b"},
    ]
    g = build_graph(nodes, edges)
    result = propagate_risk(g, {"hormuz": 100.0}, decay=0.6)

    # Hormuz has direct risk 100
    assert result["hormuz"] == 100.0
    # Port A has propagated risk 100 * 0.6 = 60.0
    assert result["port_a"] == 60.0
    # Refinery B has propagated risk 100 * 0.6^2 = 36.0
    assert result["refinery_b"] == 36.0
    assert result["hormuz"] > result["port_a"] > result["refinery_b"] > 0


def test_propagation_multiple_sources():
    """Verify max risk takes precedence when multiple corridors feed the same node."""
    nodes = [
        {"id": "hormuz", "name": "Hormuz"},
        {"id": "russia", "name": "Russia"},
        {"id": "port_a", "name": "Port A"},
    ]
    edges = [
        {"from_node_id": "hormuz", "to_node_id": "port_a"},
        {"from_node_id": "russia", "to_node_id": "port_a"},
    ]
    g = build_graph(nodes, edges)

    # Scenario: Hormuz has risk 50, Russia has risk 100. Decay = 0.6
    # Propagated from Hormuz = 50 * 0.6 = 30.0
    # Propagated from Russia = 100 * 0.6 = 60.0
    result = propagate_risk(g, {"hormuz": 50.0, "russia": 100.0}, decay=0.6)
    assert result["port_a"] == 60.0
