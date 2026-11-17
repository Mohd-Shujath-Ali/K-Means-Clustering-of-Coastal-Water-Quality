"""Dynamic ranking endpoint."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import DynamicRankingRequest, DynamicRankingResponse, DynamicRankingRow
from app.services.ranking import compute_ranking

router = APIRouter(prefix="/api", tags=["ranking"])


@router.post("/rank", response_model=DynamicRankingResponse)
def rank_zones(req: DynamicRankingRequest) -> DynamicRankingResponse:
    store = get_store()
    df_recomputed, elapsed_ms = compute_ranking(
        store,
        weight_do=req.weight_do,
        weight_temp=req.weight_temp,
        weight_sal=req.weight_sal,
        weight_turb=req.weight_turb,
        weight_chla=req.weight_chla,
        weight_port=req.weight_port,
        weight_depth=req.weight_depth,
        habitat_operational_balance=req.habitat_operational_balance,
        s1_pct=req.s1_pct,
        s2_pct=req.s2_pct,
    )

    tier_counts = df_recomputed["new_suitability_tier"].value_counts().to_dict()

    # Top 50 zones by new score
    top_df = df_recomputed.sort_values(by="new_suitability_score", ascending=False).head(50)

    rows = []
    for _, r in top_df.iterrows():
        rows.append(DynamicRankingRow(
            zone_id=int(r["zone_id"]),
            zone_name=r["zone_name"],
            lat=float(r["lat"]),
            lon=float(r["lon"]),
            suitability_score=float(r["new_suitability_score"]),
            suitability_tier=r["new_suitability_tier"],
            habitat_index=float(r["new_habitat_index"]),
            operational_index=float(r["new_operational_index"]),
            rank_change=int(r["rank_change"]),
            cpue_mean_kg_hr=float(r["cpue_mean_kg_hr"]),
            primary_species=r["primary_species"],
            action=r["action"],
        ))

    return DynamicRankingResponse(
        zones=rows,
        elapsed_ms=round(elapsed_ms, 2),
        tier_counts=tier_counts,
    )
