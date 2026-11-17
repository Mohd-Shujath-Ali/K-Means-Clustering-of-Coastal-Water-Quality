"""Validation service for AquaZone."""

from __future__ import annotations
from typing import Any
from app.data_loader import DataStore


def get_validation_payload(store: DataStore) -> dict[str, Any]:
    """Returns the full validation analysis dictionary."""
    return store.frontend_data.get("validation", {})
