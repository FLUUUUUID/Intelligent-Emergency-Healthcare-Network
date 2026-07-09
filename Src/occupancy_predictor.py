"""Occupancy classification + ML wait-time prediction.

The wait-time model is trained in Notebooks/wait_time_model.ipynb (ridge
regression on queueing-informed features, R² ≈ 0.85 vs a random-forest
reference of ≈ 0.91) and exported to Data/wait_model.json. The identical
artifact is bundled into the TypeScript engine (frontend/src/data/
wait-model.json) so both runtimes predict the same waits. If the artifact
is missing, the Phase-1 step heuristic is used as a fallback.
"""
import json
import math
import os
from datetime import datetime

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "../Data/wait_model.json")
_model_cache = None


def get_occupancy_status(available_beds, total_beds):
    """
    Returns a human-readable occupancy status and a risk level.
    """
    if total_beds == 0:
        return "unknown", "unknown"

    occupancy_rate = 1 - (available_beds / total_beds)

    if occupancy_rate >= 0.90:
        return "critical", occupancy_rate
    elif occupancy_rate >= 0.70:
        return "high", occupancy_rate
    elif occupancy_rate >= 0.40:
        return "moderate", occupancy_rate
    else:
        return "low", occupancy_rate


def _load_wait_model():
    global _model_cache
    if _model_cache is None:
        try:
            with open(_MODEL_PATH) as f:
                _model_cache = json.load(f)
        except (OSError, ValueError):
            _model_cache = False  # tried and failed — use heuristic fallback
    return _model_cache or None


def _model_multiplier(occupancy_rate, is_government, hour):
    """Evaluate the exported ridge model. Feature order must match the
    artifact's `features` list: occ, occ2, occ3, is_gov, occ_x_gov,
    sin_h, cos_h, sin_2h, cos_2h."""
    model = _load_wait_model()
    if not model:
        return None
    occ = float(occupancy_rate)
    g = 1.0 if is_government else 0.0
    h = 2.0 * math.pi * hour / 24.0
    feats = [
        occ, occ ** 2, occ ** 3, g, occ * g,
        math.sin(h), math.cos(h), math.sin(2 * h), math.cos(2 * h),
    ]
    z = model["intercept"] + sum(c * x for c, x in zip(model["coefficients"], feats))
    lo, hi = model.get("clip", [1.0, 3.5])
    return min(hi, max(lo, z))


def _heuristic_multiplier(occupancy_rate):
    """Phase-1 step heuristic — retained as the fallback."""
    if occupancy_rate >= 0.90:
        return 2.5
    elif occupancy_rate >= 0.70:
        return 1.7
    elif occupancy_rate >= 0.40:
        return 1.2
    return 1.0


def predict_wait_time(base_wait_minutes, occupancy_rate, hospital_type="private", hour=None):
    """
    Predicts the effective wait time from live hospital state using the
    trained ML model (occupancy congestion + diurnal demand + facility type).
    Falls back to the rule-based multiplier table if the artifact is absent.
    """
    if hour is None:
        hour = datetime.now().hour
    multiplier = _model_multiplier(occupancy_rate, hospital_type == "government", hour)
    if multiplier is None:
        multiplier = _heuristic_multiplier(occupancy_rate)
    return round(base_wait_minutes * multiplier, 0)


def enrich_hospital_with_occupancy(hospital):
    """
    Takes a hospital dict and adds occupancy fields to it.
    Call this before scoring or displaying any hospital.
    """
    status, rate = get_occupancy_status(
        hospital["available_icu_beds"],
        hospital["total_icu_beds"]
    )
    adjusted_wait = predict_wait_time(
        hospital["avg_wait_minutes"], rate, hospital.get("type", "private")
    )

    hospital["occupancy_status"] = status
    hospital["occupancy_rate"] = round(rate, 2) if isinstance(rate, float) else rate
    hospital["adjusted_wait_minutes"] = adjusted_wait
    return hospital
