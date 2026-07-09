"""Regenerates the golden parity fixtures from the Python scoring engine.

The committed fixture file (Tests/fixtures/parity_cases.json) is the contract
both engines are tested against:

  - pytest  (Tests/test_recommender.py)          → detects Python drift
  - vitest  (frontend/src/lib/recommender.test.ts) → detects TypeScript drift

Run only when the scoring behaviour changes INTENTIONALLY, then commit the
diff together with the change:

    venv/Scripts/python Tests/generate_fixtures.py
"""
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "Src"))
from hospital_recommender import recommend  # noqa: E402

# Every case pins `hour` so wait predictions are reproducible.
CASES = [
    {"name": "city-centre cardiology", "lat": 26.2120, "lon": 78.1850, "type": "cardiology", "triage": None, "hour": 12},
    {"name": "city-centre trauma", "lat": 26.2120, "lon": 78.1850, "type": "trauma", "triage": None, "hour": 12},
    {"name": "child stroke (pediatric nudge)", "lat": 26.2120, "lon": 78.1850, "type": "neurology",
     "triage": {"age": "child", "consciousness": "alert", "casualties": "single"}, "hour": 12},
    {"name": "infant pediatrics mass casualty (no self-nudge)", "lat": 26.2120, "lon": 78.1850, "type": "pediatrics",
     "triage": {"age": "infant", "consciousness": "unresponsive", "casualties": "mass"}, "hour": 12},
    {"name": "north burns", "lat": 26.2400, "lon": 78.2000, "type": "burns", "triage": None, "hour": 12},
    {"name": "south-east elderly cardiology", "lat": 26.1900, "lon": 78.2100, "type": "cardiology",
     "triage": {"age": "elderly", "consciousness": "voice", "casualties": "few"}, "hour": 12},
    {"name": "west trauma", "lat": 26.2100, "lon": 78.1500, "type": "trauma", "triage": None, "hour": 12},
    {"name": "city-centre cardiology at evening peak", "lat": 26.2120, "lon": 78.1850, "type": "cardiology", "triage": None, "hour": 19},
]


def expected_for(case):
    result = recommend(case["lat"], case["lon"], case["type"], triage=case["triage"], hour=case["hour"])
    return {
        "total_hospitals_checked": result["total_hospitals_checked"],
        "nearest_ambulance": {
            "id": result["nearest_ambulance"]["id"],
            "distance_km": result["nearest_ambulance"]["distance_km"],
            "eta_minutes": result["nearest_ambulance"]["eta_minutes"],
        },
        "recommendations": [
            {
                "hospital_id": r["hospital"]["id"],
                "hospital_name": r["hospital"]["name"],
                "score": r["score"],
                "distance_km": r["distance_km"],
                "eta_minutes": r["route"]["estimated_minutes"],
                "adjusted_wait_minutes": r["hospital"]["adjusted_wait_minutes"],
                "occupancy_rate": r["hospital"]["occupancy_rate"],
                "occupancy_status": r["hospital"]["occupancy_status"],
                "score_breakdown": r["score_breakdown"],
            }
            for r in result["recommendations"]
        ],
    }


def main():
    fixtures = {
        "comment": "Golden parity fixtures generated from the Python engine (Src/). "
                   "Do not edit by hand — run Tests/generate_fixtures.py.",
        "cases": [{**case, "expected": expected_for(case)} for case in CASES],
    }
    out = os.path.join(os.path.dirname(__file__), "fixtures", "parity_cases.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w") as f:
        json.dump(fixtures, f, indent=2)
    print(f"wrote {out} ({len(CASES)} cases)")


if __name__ == "__main__":
    main()
