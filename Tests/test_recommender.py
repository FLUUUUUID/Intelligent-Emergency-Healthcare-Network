"""Unit + golden-fixture tests for the Python scoring engine (Src/).

The golden fixtures (Tests/fixtures/parity_cases.json) are the shared
contract with the TypeScript engine — the vitest suite asserts the same
values, so green on both sides proves cross-runtime parity.

Run:  venv/Scripts/python -m pytest Tests/ -q
"""
import json
import math
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "Src"))

import occupancy_predictor as op  # noqa: E402
from hospital_recommender import load_hospitals, load_ambulances, recommend, score_hospital  # noqa: E402
from route_optimizer import haversine_distance, estimate_travel_time, find_nearest_ambulance  # noqa: E402

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures", "parity_cases.json")
CITY = (26.2120, 78.1850)  # Gwalior city centre


# ─── route_optimizer ──────────────────────────────────────────────────────────

def test_haversine_zero_distance():
    assert haversine_distance(26.2, 78.18, 26.2, 78.18) == 0


def test_haversine_known_distance():
    # One degree of latitude ≈ 111.19 km
    d = haversine_distance(26.0, 78.0, 27.0, 78.0)
    assert 110.5 < d < 111.8


def test_travel_time_at_city_speed():
    # 40 km/h → 20 km takes 30 minutes
    assert estimate_travel_time(20) == 30.0


def test_nearest_ambulance_skips_busy():
    ambulances = load_ambulances()
    nearest = find_nearest_ambulance(ambulances, *CITY)
    assert nearest["status"] == "available"
    busy_ids = {a["id"] for a in ambulances if a["status"] == "busy"}
    assert nearest["id"] not in busy_ids


# ─── occupancy_predictor ──────────────────────────────────────────────────────

@pytest.mark.parametrize("available,total,status", [
    (1, 10, "critical"),   # 90%
    (3, 10, "high"),       # 70%
    (6, 10, "moderate"),   # 40%
    (8, 10, "low"),        # 20%
    (0, 0, "unknown"),
])
def test_occupancy_classification(available, total, status):
    assert op.get_occupancy_status(available, total)[0] == status


def test_model_multiplier_within_clip():
    for occ in (0.05, 0.4, 0.7, 0.9, 0.98):
        for hour in (3, 12, 19):
            m = op._model_multiplier(occ, True, hour)
            assert 1.0 <= m <= 3.5


def test_model_monotonic_in_occupancy():
    lo = op._model_multiplier(0.2, False, 12)
    hi = op._model_multiplier(0.9, False, 12)
    assert hi > lo


def test_model_government_load_factor():
    assert op._model_multiplier(0.8, True, 12) > op._model_multiplier(0.8, False, 12)


def test_model_diurnal_peak():
    # Evening peak (19:00) should predict longer waits than 03:00
    assert op._model_multiplier(0.6, False, 19) > op._model_multiplier(0.6, False, 3)


def test_heuristic_fallback_when_model_missing():
    original = op._model_cache
    try:
        op._model_cache = False  # simulate missing artifact
        assert op.predict_wait_time(30, 0.8, "government", hour=12) == round(30 * 1.7, 0)
        assert op.predict_wait_time(10, 0.2, "private", hour=12) == 10
    finally:
        op._model_cache = original


# ─── scoring ──────────────────────────────────────────────────────────────────

def _enriched():
    return [op.enrich_hospital_with_occupancy(h, hour=12) for h in load_hospitals()]


def test_specialty_match_scores_higher():
    h = next(x for x in _enriched() if "cardiology" in x["specialties"])
    with_match = score_hospital(h, *CITY, "cardiology")
    without = score_hospital(h, *CITY, "dermatology")
    assert with_match["score_breakdown"]["specialty_score"] == 1.5
    assert without["score_breakdown"]["specialty_score"] == 0.5
    assert with_match["score"] > without["score"]


def test_pediatric_nudge_rules():
    h = next(x for x in _enriched() if "pediatrics" in x["specialties"] and "cardiology" in x["specialties"])
    child = {"age": "child", "consciousness": "alert", "casualties": "single"}
    adult = {"age": "adult", "consciousness": "alert", "casualties": "single"}
    # Young patient, non-pediatric emergency, hospital offers pediatrics → +0.3
    assert score_hospital(h, *CITY, "cardiology", child)["score_breakdown"]["specialty_score"] == 1.8
    assert score_hospital(h, *CITY, "cardiology", adult)["score_breakdown"]["specialty_score"] == 1.5
    # No self-nudge when the emergency itself is pediatrics
    assert score_hospital(h, *CITY, "pediatrics", child)["score_breakdown"]["specialty_score"] == 1.5


def test_recommend_sorted_and_sized():
    result = recommend(*CITY, "cardiology", hour=12)
    scores = [r["score"] for r in result["recommendations"]]
    assert scores == sorted(scores, reverse=True)
    assert len(scores) == 3
    assert result["total_hospitals_checked"] == 8


# ─── golden fixtures (cross-runtime contract) ─────────────────────────────────

def _load_cases():
    with open(FIXTURES) as f:
        return json.load(f)["cases"]


@pytest.mark.parametrize("case", _load_cases(), ids=lambda c: c["name"])
def test_golden_fixture(case):
    """The engine must still produce exactly the committed golden output.
    If this fails after an intentional scoring change, regenerate fixtures
    (Tests/generate_fixtures.py) and commit them with the change."""
    result = recommend(case["lat"], case["lon"], case["type"], triage=case["triage"], hour=case["hour"])
    exp = case["expected"]

    assert result["total_hospitals_checked"] == exp["total_hospitals_checked"]
    amb = result["nearest_ambulance"]
    assert amb["id"] == exp["nearest_ambulance"]["id"]
    assert amb["distance_km"] == pytest.approx(exp["nearest_ambulance"]["distance_km"], abs=1e-9)
    assert amb["eta_minutes"] == pytest.approx(exp["nearest_ambulance"]["eta_minutes"], abs=1e-9)

    assert len(result["recommendations"]) == len(exp["recommendations"])
    for got, want in zip(result["recommendations"], exp["recommendations"]):
        assert got["hospital"]["id"] == want["hospital_id"]
        assert got["score"] == pytest.approx(want["score"], abs=1e-9)
        assert got["distance_km"] == pytest.approx(want["distance_km"], abs=1e-9)
        assert got["route"]["estimated_minutes"] == pytest.approx(want["eta_minutes"], abs=1e-9)
        assert got["hospital"]["adjusted_wait_minutes"] == pytest.approx(want["adjusted_wait_minutes"], abs=1e-9)
        assert got["hospital"]["occupancy_rate"] == pytest.approx(want["occupancy_rate"], abs=1e-9)
        assert got["hospital"]["occupancy_status"] == want["occupancy_status"]
        for key, val in want["score_breakdown"].items():
            assert got["score_breakdown"][key] == pytest.approx(val, abs=1e-9), key


def test_wait_predictions_do_not_use_math_isnan():
    """Every adjusted wait in the fixtures is a finite positive number."""
    for case in _load_cases():
        for rec in case["expected"]["recommendations"]:
            w = rec["adjusted_wait_minutes"]
            assert w > 0 and math.isfinite(w)
