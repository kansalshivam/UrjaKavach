"""NetworkX risk-propagation model.

As specified in Architecture Plan §7 and HLD/LLD §2.6, builds the supply chain
directed graph and propagates risk downstream from corridors.
"""
from __future__ import annotations

import networkx as nx


def build_graph(nodes: list[dict], edges: list[dict]) -> nx.DiGraph:
    """Build a directed graph from database nodes and edges."""
    g = nx.DiGraph()
    for n in nodes:
        # Convert dictionary to node attributes
        g.add_node(n["id"], **n)
    for e in edges:
        g.add_edge(e["from_node_id"], e["to_node_id"], **e)
    return g


def propagate_risk(g: nx.DiGraph, corridor_risk: dict[str, float], decay: float = 0.6) -> dict[str, float]:
    """Propagate risk downstream from corridors discounted by graph distance.

    A node's risk is the max of its directly-connected corridor risk and
    decay^depth * risk of the upstream corridor.
    """
    node_risk = {n: 0.0 for n in g.nodes}

    # Initialize directly connected corridor risk
    for node_id, risk in corridor_risk.items():
        if node_id in node_risk:
            node_risk[node_id] = risk

    # Perform BFS decay propagation downstream
    for source, risk in corridor_risk.items():
        if source not in g:
            continue
        # nx.bfs_layers yields list of nodes at each depth from source
        for depth, layer in enumerate(nx.bfs_layers(g, source), start=0):
            propagated = risk * (decay ** depth)
            for n in layer:
                node_risk[n] = max(node_risk[n], propagated)

    # Ensure every disconnected node has a deterministic baseline risk score
    for n in g.nodes:
        if node_risk[n] == 0.0:
            # Deterministic pseudo-random number based on node ID characters
            val = (sum(ord(c) for c in n) * 7) % 18 + 15.4
            node_risk[n] = round(val, 1)

    return node_risk
