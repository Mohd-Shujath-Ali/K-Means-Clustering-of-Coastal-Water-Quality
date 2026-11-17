"""Alert levels and physicochemical thresholds router."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import AlertThresholdRow

router = APIRouter(prefix="/api", tags=["alerts"])


@router.get("/alerts", response_model=list[AlertThresholdRow])
def get_alerts() -> list[AlertThresholdRow]:
    store = get_store()
    records = store.alert_thresholds.to_dict(orient="records")
    return [AlertThresholdRow(**r) for r in records]
