"""Validation endpoint: statistical tests, ROC/AUC, lift, CPUE distributions."""

from fastapi import APIRouter
from app.data_loader import get_store
from app.models import ValidationMetricsResponse
from app.services.validation import get_validation_payload

router = APIRouter(prefix="/api", tags=["validation"])


@router.get("/validate", response_model=ValidationMetricsResponse)
def get_validation() -> ValidationMetricsResponse:
    store = get_store()
    payload = get_validation_payload(store)
    return ValidationMetricsResponse(**payload)
