// All TypeScript interfaces matching backend models for AquaZone

export interface SummaryResponse {
  n_zones: number
  tier_counts: Record<string, number>
  regime_counts: Record<string, number>
  mean_cpue_p12: number
  total_events: number
  validated_events: number
  high_yield_zones: number
}

export interface ZoneRow {
  zone_id: number
  zone_name: str
  lat: number
  lon: number
  depth_m: number
  dist_port_km: number
  dissolved_oxygen: number
  temperature: number
  salinity: number
  turbidity: number
  chlorophyll_a: number
  suitability_score: number
  suitability_tier: string
  regime: string
  h_rank: number
  cpue_mean_kg_hr: number
  primary_species: string
  recommended_gear: string
  action: string
  conf: number
  borderline: boolean
}

type str = string

export interface ZoneListResponse {
  zones: ZoneRow[]
  total: number
  page: number
  page_size: number
}

export interface FeaturePercentile {
  feature: string
  raw_value: number
  percentile: number
  unit: string
  assessment: string
}

export interface SimilarZone {
  zone_id: number
  zone_name: string
  similarity_score: number
  suitability_tier: string
  cpue_mean_kg_hr: number
}

export interface RadarPoint {
  subject: string
  value: number
  fullMark: number
}

export interface ZoneDetailResponse {
  zone: ZoneRow
  percentiles: FeaturePercentile[]
  similar_zones: SimilarZone[]
  radar_data: RadarPoint[]
}

export interface DynamicRankingRequest {
  weight_do: number
  weight_temp: number
  weight_sal: number
  weight_turb: number
  weight_chla: number
  weight_port: number
  weight_depth: number
  habitat_operational_balance: number
  s1_pct: number
  s2_pct: number
}

export interface DynamicRankingRow {
  zone_id: number
  zone_name: string
  lat: number
  lon: number
  suitability_score: number
  suitability_tier: string
  habitat_index: number
  operational_index: number
  rank_change: number
  cpue_mean_kg_hr: number
  primary_species: string
  action: string
}

export interface DynamicRankingResponse {
  zones: DynamicRankingRow[]
  elapsed_ms: number
  tier_counts: Record<string, number>
}

export interface CatchEventRow {
  event_id: number
  date: string
  zone_id: number
  zone_name: string
  lat: number
  lon: number
  vessel_type: string
  gear: string
  effort_hours: number
  catch_total_kg: number
  cpue_kg_hr: number
  fuel_liters: number
  cpue_kg_diesel: number
  primary_species: string
  fisher_rating: number
  suitability_tier: string
  is_high_yield: boolean
}

export interface CatchEventListResponse {
  events: CatchEventRow[]
  total: number
}

export interface ValidationMetricsResponse {
  kruskal_wallis: {
    statistic: number
    p_value: number
  }
  anova: {
    f_statistic: number
    p_value: number
  }
  spearman_fisher_survey: {
    rho: number
    p_value: number
  }
  roc_curve: {
    auc: number
    points: { fpr: number; tpr: number }[]
  }
  lift_curve: {
    decile: number
    sample_count: number
    high_yield_count: number
    high_yield_rate: number
    lift: number
  }[]
  cpue_by_tier: Record<string, {
    min: number
    q1: number
    median: number
    q3: number
    max: number
    mean: number
    count: number
  }>
}

export interface AlertThresholdRow {
  tier: string
  do_min_mg_l: number | string
  sst_optimal_min: number | string
  sst_optimal_max: number | string
  salinity_min_psu: number | string
  salinity_max_psu: number | string
  turbidity_target_ntu: string
  primary_advisory: string
}

export interface ActionSummaryRow {
  tier: string
  n_zones: number
  recommended_vessels: number
  expected_yield_tons: number
  fuel_saving_pct: number
}

export interface ActionPlanResponse {
  summary: ActionSummaryRow[]
  top_dispatch_zones: ZoneRow[]
}

export interface ModelSelectionRow {
  model: string
  k: number
  sil: number
  db: number
  ch: number
  bic: number | null
  stability: number
  min_size: number
}

export interface ArchetypeProfileRow {
  h_rank: number
  n_zones: number
  regime: string
  mean_suitability: number
  mean_do_mg_l: number
  mean_sst_c: number
  mean_salinity_psu: number
  mean_turbidity_ntu: number
  mean_chla_mg_m3: number
  mean_depth_m: number
  mean_cpue_kg_hr: number
}

export interface MethodResponse {
  parameters: {
    name: string
    unit: string
    ideal_range: string
    role: string
  }[]
  model_selection: ModelSelectionRow[]
  archetypes: ArchetypeProfileRow[]
  optimal_k: number
  evaluation_summary: string
}
