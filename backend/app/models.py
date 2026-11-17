"""Pydantic data models for AquaZone Fishing-Zone Platform API."""

from __future__ import annotations

from typing import Any
from pydantic import BaseModel, Field


class SummaryResponse(BaseModel):
    n_zones: int
    tier_counts: dict[str, int]
    regime_counts: dict[str, int]
    mean_cpue_p12: float
    total_events: int
    validated_events: int
    high_yield_zones: int


class ZoneRow(BaseModel):
    zone_id: int
    zone_name: str
    lat: float
    lon: float
    depth_m: float
    dist_port_km: float
    dissolved_oxygen: float
    temperature: float
    salinity: float
    turbidity: float
    chlorophyll_a: float
    suitability_score: float
    suitability_tier: str
    regime: str
    h_rank: int
    cpue_mean_kg_hr: float
    primary_species: str
    recommended_gear: str
    action: str
    conf: float
    borderline: bool


class ZoneListResponse(BaseModel):
    zones: list[ZoneRow]
    total: int
    page: int
    page_size: int


class FeaturePercentile(BaseModel):
    feature: str
    raw_value: float
    percentile: float
    unit: str
    assessment: str


class SimilarZone(BaseModel):
    zone_id: int
    zone_name: str
    similarity_score: float
    suitability_tier: str
    cpue_mean_kg_hr: float


class ZoneDetailResponse(BaseModel):
    zone: ZoneRow
    percentiles: list[FeaturePercentile]
    similar_zones: list[SimilarZone]
    radar_data: list[dict[str, Any]]


class DynamicRankingRequest(BaseModel):
    weight_do: float = Field(default=0.35, ge=0.0, le=2.0)
    weight_temp: float = Field(default=0.25, ge=0.0, le=2.0)
    weight_sal: float = Field(default=0.15, ge=0.0, le=2.0)
    weight_turb: float = Field(default=0.10, ge=0.0, le=2.0)
    weight_chla: float = Field(default=0.15, ge=0.0, le=2.0)
    weight_port: float = Field(default=0.65, ge=0.0, le=2.0)
    weight_depth: float = Field(default=0.35, ge=0.0, le=2.0)
    habitat_operational_balance: float = Field(default=0.75, ge=0.0, le=1.0)
    s1_pct: float = Field(default=0.15, ge=0.01, le=0.40)
    s2_pct: float = Field(default=0.30, ge=0.01, le=0.50)


class DynamicRankingRow(BaseModel):
    zone_id: int
    zone_name: str
    lat: float
    lon: float
    suitability_score: float
    suitability_tier: str
    habitat_index: float
    operational_index: float
    rank_change: int
    cpue_mean_kg_hr: float
    primary_species: str
    action: str


class DynamicRankingResponse(BaseModel):
    zones: list[DynamicRankingRow]
    elapsed_ms: float
    tier_counts: dict[str, int]


class CatchEventRow(BaseModel):
    event_id: int
    date: str
    zone_id: int
    zone_name: str
    lat: float
    lon: float
    vessel_type: str
    gear: str
    effort_hours: float
    catch_total_kg: float
    cpue_kg_hr: float
    fuel_liters: float
    cpue_kg_diesel: float
    primary_species: str
    fisher_rating: int
    suitability_tier: str
    is_high_yield: bool


class CatchEventListResponse(BaseModel):
    events: list[CatchEventRow]
    total: int


class ValidationMetricsResponse(BaseModel):
    kruskal_wallis: dict[str, float]
    anova: dict[str, float]
    spearman_fisher_survey: dict[str, float]
    roc_curve: dict[str, Any]
    lift_curve: list[dict[str, Any]]
    cpue_by_tier: dict[str, Any]


class AlertThresholdRow(BaseModel):
    tier: str
    do_min_mg_l: Any
    sst_optimal_min: Any
    sst_optimal_max: Any
    salinity_min_psu: Any
    salinity_max_psu: Any
    turbidity_target_ntu: str
    primary_advisory: str


class ActionSummaryRow(BaseModel):
    tier: str
    n_zones: int
    recommended_vessels: int
    expected_yield_tons: float
    fuel_saving_pct: float


class ActionPlanResponse(BaseModel):
    summary: list[ActionSummaryRow]
    top_dispatch_zones: list[ZoneRow]


class ModelSelectionRow(BaseModel):
    model: str
    k: int
    sil: float
    db: float
    ch: float
    bic: float | None = None
    stability: float
    min_size: int


class ArchetypeProfileRow(BaseModel):
    h_rank: int
    n_zones: int
    regime: str
    mean_suitability: float
    mean_do_mg_l: float
    mean_sst_c: float
    mean_salinity_psu: float
    mean_turbidity_ntu: float
    mean_chla_mg_m3: float
    mean_depth_m: float
    mean_cpue_kg_hr: float


class MethodResponse(BaseModel):
    parameters: list[dict[str, str]]
    model_selection: list[ModelSelectionRow]
    archetypes: list[ArchetypeProfileRow]
    optimal_k: int
    evaluation_summary: str
