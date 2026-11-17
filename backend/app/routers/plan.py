"""Action planning and fleet dispatch router."""

import io
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import pandas as pd

from app.data_loader import get_store
from app.models import ActionPlanResponse, ActionSummaryRow, ZoneRow

router = APIRouter(prefix="/api", tags=["plan"])


@router.get("/plan", response_model=ActionPlanResponse)
def get_action_plan() -> ActionPlanResponse:
    store = get_store()
    summary_rows = [ActionSummaryRow(**r) for r in store.fleet_action_summary.to_dict(orient="records")]
    
    # Top 20 dispatch zones
    top_df = store.zones.sort_values(by="suitability_score", ascending=False).head(20)
    top_zones = [ZoneRow(**r) for r in top_df.to_dict(orient="records")]

    return ActionPlanResponse(
        summary=summary_rows,
        top_dispatch_zones=top_zones,
    )


@router.get("/plan/export")
def export_plan_csv() -> StreamingResponse:
    store = get_store()
    df = store.top50_dispatch
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aquazone_top50_fleet_dispatch.csv"},
    )
