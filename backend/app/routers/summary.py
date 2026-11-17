"""Summary endpoint: high-level KPIs and metrics."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import SummaryResponse

router = APIRouter(prefix="/api", tags=["summary"])


@router.get("/summary", response_model=SummaryResponse)
def get_summary() -> SummaryResponse:
    store = get_store()
    df = store.zones
    tier_counts = df["suitability_tier"].value_counts().to_dict()
    regime_counts = df["regime"].value_counts().to_dict()
    
    p12_mask = df["suitability_tier"].isin(["S1 Prime PFZ", "S2 Favorable"])
    mean_cpue_p12 = float(df.loc[p12_mask, "cpue_mean_kg_hr"].mean())
    high_yield_zones = int(df["in_high_yield_footprint"].sum())

    return SummaryResponse(
        n_zones=len(df),
        tier_counts=tier_counts,
        regime_counts=regime_counts,
        mean_cpue_p12=round(mean_cpue_p12, 1),
        total_events=len(store.events_all),
        validated_events=len(store.events_validated),
        high_yield_zones=high_yield_zones,
    )
