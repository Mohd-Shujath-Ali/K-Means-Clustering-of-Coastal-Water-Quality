"""Singleton DataStore for AquaZone backend."""

from __future__ import annotations

import gzip
import json
from pathlib import Path
from typing import Self

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

PERCENTILE_FEATURES = [
    ("dissolved_oxygen", "mg/L", "Dissolved Oxygen"),
    ("temperature", "°C", "Sea Surface Temp"),
    ("salinity", "PSU", "Salinity"),
    ("turbidity", "NTU", "Turbidity"),
    ("chlorophyll_a", "mg/m³", "Chlorophyll-a"),
    ("depth_m", "m", "Bathymetric Depth"),
    ("dist_port_km", "km", "Distance to Port"),
    ("suitability_score", "score", "Suitability Score"),
    ("cpue_mean_kg_hr", "kg/hr", "Mean CPUE Yield"),
]


class DataStore:
    """Singleton holding all project data in memory."""

    _instance: DataStore | None = None

    def __new__(cls) -> Self:
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._loaded = False
        return cls._instance

    def load(self) -> None:
        if self._loaded:
            return
        self._load_zones()
        self._load_geojson()
        self._load_frontend_data()
        self._load_events()
        self._load_profiles()
        self._load_model_selection()
        self._load_alert_tiers()
        self._load_action_tables()
        self._loaded = True

    def _load_zones(self) -> None:
        self.zones = pd.read_csv(DATA_DIR / "zone_features.csv")
        bool_cols = ["borderline", "has_catch_record", "in_high_yield_footprint"]
        for col in bool_cols:
            if col in self.zones.columns:
                self.zones[col] = self.zones[col].astype(bool)

    def _load_geojson(self) -> None:
        with open(DATA_DIR / "fishing_zones.geojson", "r") as f:
            self.geojson = json.load(f)
        self.geojson_bytes = gzip.compress(json.dumps(self.geojson).encode("utf-8"))

    def _load_frontend_data(self) -> None:
        with open(DATA_DIR / "frontend_data.json", "r") as f:
            self.frontend_data = json.load(f)

    def _load_events(self) -> None:
        self.events_all = pd.read_csv(DATA_DIR / "catch_yield_events_all.csv")
        self.events_validated = pd.read_csv(DATA_DIR / "catch_yield_events_validated.csv")

    def _load_profiles(self) -> None:
        self.archetypes = pd.read_csv(DATA_DIR / "archetype_profiles.csv")

    def _load_model_selection(self) -> None:
        self.model_selection = pd.read_csv(DATA_DIR / "model_selection.csv")
        self.model_selection = self.model_selection.replace({np.nan: None})

    def _load_alert_tiers(self) -> None:
        self.alert_thresholds = pd.read_csv(DATA_DIR / "alert_thresholds_by_tier.csv")

    def _load_action_tables(self) -> None:
        self.fleet_action_summary = pd.read_csv(DATA_DIR / "fleet_action_summary.csv")
        self.top50_dispatch = pd.read_csv(DATA_DIR / "top50_dispatch_table.csv")


_store: DataStore | None = None


def get_store() -> DataStore:
    global _store
    if _store is None:
        _store = DataStore()
        _store.load()
    return _store
