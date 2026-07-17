from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/procurement", tags=["procurement"])

class SupplierRecommendation(BaseModel):
    rank: int
    country: str
    grade: str
    quality_compatibility: str  # "High" | "Medium" | "Low"
    transit_days: int
    cost_premium: str  # e.g., "-$2.5/bbl"
    suitability_score: float  # 0 to 100
    actual_2026_role: str  # Description of what actually happened in 2026
    is_heuristic: bool = True
    disclosure: str = "Heuristic score dynamically scaled based on simulated corridor capacity available."

@router.get("/recommendations", response_model=List[SupplierRecommendation])
def get_recommendations(capacity_available_pct: float = Query(100.0, ge=0.0, le=100.0)):
    # Standard static dataset of options
    alternatives = [
        {
            "country": "Russia",
            "grade": "Urals (Medium Sour)",
            "quality_compatibility": "High",
            "transit_days": 18,
            "cost_premium": "-$3.50/bbl (Discounted)",
            "base_suitability": 90.0,
            "actual_2026_role": "Primary non-Hormuz pivot node; import share rose to historic highs due to steep price discounts."
        },
        {
            "country": "West Africa (Nigeria/Angola)",
            "grade": "Bonny Light / Cabinda (Sweet)",
            "quality_compatibility": "High",
            "transit_days": 20,
            "cost_premium": "+$1.20/bbl (Premium)",
            "base_suitability": 85.0,
            "actual_2026_role": "Major diversification node providing light sweet blending stocks during peak disruptions."
        },
        {
            "country": "United States",
            "grade": "WTI / Eagle Ford (Light Sweet)",
            "quality_compatibility": "Medium",
            "transit_days": 32,
            "cost_premium": "+$0.80/bbl (Premium)",
            "base_suitability": 75.0,
            "actual_2026_role": "Pivot volume source for private refiners, though limited by long transit times and blending requirements."
        },
        {
            "country": "Guyana",
            "grade": "Liza (Medium Sweet)",
            "quality_compatibility": "High",
            "transit_days": 30,
            "cost_premium": "+$1.50/bbl (Premium)",
            "base_suitability": 80.0,
            "actual_2026_role": "Emerging alternative source contracted under strategic term supply arrangements."
        },
        {
            "country": "Iraq (via Red Sea)",
            "grade": "Basrah Medium (Medium Sour)",
            "quality_compatibility": "High",
            "transit_days": 8,
            "cost_premium": "Flat",
            "base_suitability": 60.0,  # Lower suitability due to Red Sea/Bab el-Mandeb transit risks
            "actual_2026_role": "High volume supplier, but shipments were heavily constrained by overlapping Red Sea naval blockades."
        }
    ]

    # Compute dynamic suitability score based on Hormuz disruption level
    # If Hormuz is closed (capacity_available_pct is low), we penalize Middle East bypass routes (e.g. Iraq) due to Bab el-Mandeb block risks,
    # and boost non-Hormuz long-haul alternatives (Russia, US, Guyana, West Africa).
    disruption_multiplier = (100.0 - capacity_available_pct) / 100.0

    scored_alternatives = []
    for alt in alternatives:
        score = alt["base_suitability"]
        if alt["country"] == "Iraq (via Red Sea)":
            # Penalty increases with disruption as Bab el-Mandeb is also threatened
            score -= disruption_multiplier * 25.0
        else:
            # Boost non-Hormuz suppliers suitability during disruptions
            score += disruption_multiplier * 10.0
        
        # Clip score between 0 and 100
        score = max(0.0, min(100.0, score))
        scored_alternatives.append({**alt, "suitability_score": round(score, 1)})

    # Sort by suitability score descending
    scored_alternatives.sort(key=lambda x: x["suitability_score"], reverse=True)

    # Map rank
    recommendations = []
    for idx, alt in enumerate(scored_alternatives, start=1):
        recommendations.append(SupplierRecommendation(
            rank=idx,
            country=alt["country"],
            grade=alt["grade"],
            quality_compatibility=alt["quality_compatibility"],
            transit_days=alt["transit_days"],
            cost_premium=alt["cost_premium"],
            suitability_score=alt["suitability_score"],
            actual_2026_role=alt["actual_2026_role"],
            is_heuristic=True,
            disclosure="Heuristic score dynamically scaled based on simulated corridor capacity available."
        ))

    return recommendations
