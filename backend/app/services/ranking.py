"""Dynamic suitability ranking service for AquaZone."""

from __future__ import annotations

import time
import numpy as np
import pandas as pd

from app.data_loader import DataStore


def compute_ranking(
    store: DataStore,
    weight_do: float = 0.35,
    weight_temp: float = 0.25,
    weight_sal: float = 0.15,
    weight_turb: float = 0.10,
    weight_chla: float = 0.15,
    weight_port: float = 0.65,
    weight_depth: float = 0.35,
    habitat_operational_balance: float = 0.75,
    s1_pct: float = 0.15,
    s2_pct: float = 0.30,
) -> tuple[pd.DataFrame, float]:
    """Recomputes habitat index, operational index, suitability score, and tiers.

    Returns (result_df, elapsed_ms).
    """
    t0 = time.perf_counter()
    df = store.zones.copy()

    # Percentile ranks for habitat metrics
    r_do = df["dissolved_oxygen"].rank(pct=True).values
    r_sst_opt = (1.0 - (df["temperature"] - 26.5).abs()).rank(pct=True).values
    r_sal_opt = (1.0 - (df["salinity"] - 34.5).abs()).rank(pct=True).values
    r_chla = df["chlorophyll_a"].rank(pct=True).values
    r_turb_mod = (1.0 - (df["turbidity"] - 6.0).abs()).rank(pct=True).values

    hab_weights = np.array([weight_do, weight_temp, weight_sal, weight_chla, weight_turb], dtype=float)
    hab_sum = hab_weights.sum()
    if hab_sum == 0:
        hab_sum = 1.0

    habitat_group = (
        hab_weights[0] * r_do
        + hab_weights[1] * r_sst_opt
        + hab_weights[2] * r_sal_opt
        + hab_weights[3] * r_chla
        + hab_weights[4] * r_turb_mod
    ) / hab_sum

    # Operational indices
    r_port = (1.0 - df["dist_port_km"].rank(pct=True).values)
    r_depth = (1.0 - (df["depth_m"] - 50.0).abs().rank(pct=True).values)

    op_weights = np.array([weight_port, weight_depth], dtype=float)
    op_sum = op_weights.sum()
    if op_sum == 0:
        op_sum = 1.0

    operational_group = (op_weights[0] * r_port + op_weights[1] * r_depth) / op_sum

    alpha = habitat_operational_balance
    new_score = alpha * habitat_group + (1.0 - alpha) * operational_group

    df["new_habitat_index"] = habitat_group.round(4)
    df["new_operational_index"] = operational_group.round(4)
    df["new_suitability_score"] = new_score.round(4)

    # Dynamic tier assignment
    score_pct = pd.Series(new_score).rank(pct=True).values
    s1_thresh = 1.0 - s1_pct
    s2_thresh = 1.0 - (s1_pct + s2_pct)

    def assign_tier(p: float) -> str:
        if p >= s1_thresh:
            return "S1 Prime PFZ"
        elif p >= s2_thresh:
            return "S2 Favorable"
        elif p >= 0.20:
            return "S3 Marginal"
        else:
            return "S4 Unfavorable"

    df["new_suitability_tier"] = [assign_tier(p) for p in score_pct]

    # Rank change compared to baseline
    orig_ranks = df["suitability_score"].rank(ascending=False).values
    new_ranks = pd.Series(new_score).rank(ascending=False).values
    df["rank_change"] = (orig_ranks - new_ranks).astype(int)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return df, elapsed_ms


def verify_reproduction(store: DataStore) -> bool:
    """Verifies that default parameters accurately match stored features."""
    df_recomputed, _ = compute_ranking(store)
    corr = np.corrcoef(df_recomputed["new_suitability_score"], store.zones["suitability_score"])[0, 1]
    return corr > 0.99
