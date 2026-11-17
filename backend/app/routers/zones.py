"""Zones list and detail endpoints."""

from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException

from app.data_loader import PERCENTILE_FEATURES, get_store
from app.models import (
    FeaturePercentile,
    SimilarZone,
    ZoneDetailResponse,
    ZoneListResponse,
    ZoneRow,
)

router = APIRouter(prefix="/api", tags=["zones"])

SORTABLE = {
    "zone_id",
    "suitability_score",
    "dissolved_oxygen",
    "temperature",
    "salinity",
    "turbidity",
    "chlorophyll_a",
    "depth_m",
    "dist_port_km",
    "cpue_mean_kg_hr",
}


@router.get("/zones", response_model=ZoneListResponse)
def list_zones(
    tier: str | None = None,
    regime: str | None = None,
    search: str | None = None,
    sort: str = "suitability_score",
    order: str = "desc",
    page: int = 1,
    page_size: int = 25,
) -> ZoneListResponse:
    store = get_store()
    df = store.zones

    mask = np.ones(len(df), dtype=bool)
    if tier:
        mask &= df["suitability_tier"].str.startswith(tier)
    if regime:
        mask &= df["regime"].str.startswith(regime.split(" ")[0])
    if search:
        s = search.lower()
        mask &= (
            df["zone_name"].str.lower().str.contains(s)
            | df["primary_species"].str.lower().str.contains(s)
            | df["action"].str.lower().str.contains(s)
        )

    filtered = df[mask].copy()

    sort_col = sort if sort in SORTABLE else "suitability_score"
    ascending = (order.lower() == "asc")
    filtered = filtered.sort_values(by=sort_col, ascending=ascending)

    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    page_df = filtered.iloc[start:end]

    rows = [ZoneRow(**r) for r in page_df.to_dict(orient="records")]
    return ZoneListResponse(zones=rows, total=total, page=page, page_size=page_size)


@router.get("/zones/{zone_id}", response_model=ZoneDetailResponse)
def get_zone_detail(zone_id: int) -> ZoneDetailResponse:
    store = get_store()
    df = store.zones
    matches = df[df["zone_id"] == zone_id]
    if matches.empty:
        raise HTTPException(status_code=404, detail=f"Zone ID {zone_id} not found.")

    row = matches.iloc[0]
    zone_dict = row.to_dict()

    # Percentile breakdowns
    percentiles: list[FeaturePercentile] = []
    for col, unit, label in PERCENTILE_FEATURES:
        val = float(row[col])
        pct = float((df[col] <= val).mean() * 100.0)
        
        assessment = "Normal"
        if col == "dissolved_oxygen":
            assessment = "Hypoxic Risk" if val < 3.5 else ("Optimal Habitat" if val > 6.0 else "Adequate")
        elif col == "temperature":
            assessment = "Optimal Front" if 25.5 <= val <= 27.5 else ("Thermal Stress" if val > 30.5 else "Moderate")
        elif col == "turbidity":
            assessment = "Silt Hazard" if val > 25.0 else ("Plankton Rich" if 4.0 <= val <= 15.0 else "Clear Oligotrophic")
        elif col == "suitability_score":
            assessment = "High Priority" if pct >= 80 else ("Moderate" if pct >= 40 else "Low")
        
        percentiles.append(FeaturePercentile(
            feature=label,
            raw_value=round(val, 2),
            percentile=round(pct, 1),
            unit=unit,
            assessment=assessment,
        ))

    # Similar zones based on 4 core scaled features
    core_cols = ["dissolved_oxygen", "temperature", "salinity", "turbidity"]
    current_vals = row[core_cols].values.astype(float)
    all_vals = df[core_cols].values.astype(float)
    std_vals = (all_vals - all_vals.mean(axis=0)) / (all_vals.std(axis=0) + 1e-6)
    cur_std = (current_vals - all_vals.mean(axis=0)) / (all_vals.std(axis=0) + 1e-6)

    dists = np.linalg.norm(std_vals - cur_std, axis=1)
    similar_indices = np.argsort(dists)[1:5]

    similar_zones: list[SimilarZone] = []
    for idx in similar_indices:
        sim_row = df.iloc[idx]
        sim_score = max(0.0, 1.0 - (dists[idx] / 4.0))
        similar_zones.append(SimilarZone(
            zone_id=int(sim_row["zone_id"]),
            zone_name=sim_row["zone_name"],
            similarity_score=round(float(sim_score), 3),
            suitability_tier=sim_row["suitability_tier"],
            cpue_mean_kg_hr=round(float(sim_row["cpue_mean_kg_hr"]), 1),
        ))

    # Radar chart normalization (0 to 100 scale)
    radar_data = [
        {"subject": "Dissolved Oxygen", "value": round(float((row["dissolved_oxygen"] / 9.0) * 100), 1), "fullMark": 100},
        {"subject": "Thermal Optimum", "value": round(float(max(0, 100 - abs(row["temperature"] - 26.5) * 20)), 1), "fullMark": 100},
        {"subject": "Salinity Stability", "value": round(float(max(0, 100 - abs(row["salinity"] - 34.5) * 15)), 1), "fullMark": 100},
        {"subject": "Plankton Productivity", "value": round(float(min(100, row["chlorophyll_a"] * 18)), 1), "fullMark": 100},
        {"subject": "Port Accessibility", "value": round(float(max(0, 100 - row["dist_port_km"] * 1.0)), 1), "fullMark": 100},
    ]

    return ZoneDetailResponse(
        zone=ZoneRow(**zone_dict),
        percentiles=percentiles,
        similar_zones=similar_zones,
        radar_data=radar_data,
    )
