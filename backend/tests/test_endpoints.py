"""Unit and integration tests for AquaZone FastAPI endpoints."""

from fastapi.testclient import TestClient
import pytest
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_summary():
    res = client.get("/api/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["n_zones"] == 850
    assert "S1 Prime PFZ" in data["tier_counts"]
    assert data["mean_cpue_p12"] > 100.0


def test_list_zones():
    res = client.get("/api/zones?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 850
    assert len(data["zones"]) == 10
    assert data["zones"][0]["zone_name"].startswith("AZ-")


def test_filter_zones_by_tier():
    res = client.get("/api/zones?tier=S1")
    assert res.status_code == 200
    data = res.json()
    for z in data["zones"]:
        assert "S1" in z["suitability_tier"]


def test_zone_detail():
    res = client.get("/api/zones/0")
    assert res.status_code == 200
    data = res.json()
    assert data["zone"]["zone_id"] == 0
    assert len(data["percentiles"]) > 0
    assert len(data["similar_zones"]) > 0
    assert len(data["radar_data"]) == 5


def test_zone_detail_not_found():
    res = client.get("/api/zones/999999")
    assert res.status_code == 404


def test_dynamic_ranking():
    payload = {
        "weight_do": 0.5,
        "weight_temp": 0.3,
        "weight_sal": 0.1,
        "weight_turb": 0.1,
        "weight_chla": 0.2,
        "weight_port": 0.5,
        "weight_depth": 0.5,
        "habitat_operational_balance": 0.8,
        "s1_pct": 0.15,
        "s2_pct": 0.30,
    }
    res = client.post("/api/rank", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["zones"]) == 50
    assert data["elapsed_ms"] > 0
    assert "S1 Prime PFZ" in data["tier_counts"]


def test_validation_endpoint():
    res = client.get("/api/validate")
    assert res.status_code == 200
    data = res.json()
    assert data["kruskal_wallis"]["p_value"] < 0.001
    assert data["roc_curve"]["auc"] > 0.85
    assert len(data["lift_curve"]) > 0
    assert "S1 Prime PFZ" in data["cpue_by_tier"]


def test_action_plan():
    res = client.get("/api/plan")
    assert res.status_code == 200
    data = res.json()
    assert len(data["summary"]) == 4
    assert len(data["top_dispatch_zones"]) == 20


def test_plan_export_csv():
    res = client.get("/api/plan/export")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "zone_id" in res.text


def test_alerts_endpoint():
    res = client.get("/api/alerts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 4


def test_events_endpoint():
    res = client.get("/api/events?limit=20")
    assert res.status_code == 200
    data = res.json()
    assert len(data["events"]) == 20
    assert data["total"] > 0


def test_method_endpoint():
    res = client.get("/api/method")
    assert res.status_code == 200
    data = res.json()
    assert data["optimal_k"] == 4
    assert len(data["parameters"]) >= 5
    assert len(data["model_selection"]) > 0
    assert len(data["archetypes"]) == 4


def test_geojson_endpoint():
    res = client.get("/api/geojson")
    assert res.status_code == 200
    assert res.headers["content-encoding"] == "gzip"
