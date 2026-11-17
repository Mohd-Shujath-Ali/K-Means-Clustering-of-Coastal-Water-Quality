"""Catch events and landing records router."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import CatchEventListResponse, CatchEventRow

router = APIRouter(prefix="/api", tags=["events"])


@router.get("/events", response_model=CatchEventListResponse)
def get_events(
    validated_only: bool = False,
    tier: str | None = None,
    limit: int = 100,
) -> CatchEventListResponse:
    store = get_store()
    df = store.events_validated if validated_only else store.events_all

    if tier:
        df = df[df["suitability_tier"].str.startswith(tier)]

    total = len(df)
    sub = df.head(limit)
    rows = [CatchEventRow(**r) for r in sub.to_dict(orient="records")]
    return CatchEventListResponse(events=rows, total=total)
