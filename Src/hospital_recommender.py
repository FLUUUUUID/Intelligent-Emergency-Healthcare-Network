import csv
import os
from route_optimizer import haversine_distance, get_route_summary, find_nearest_ambulance
from occupancy_predictor import enrich_hospital_with_occupancy

DATA_DIR = os.path.join(os.path.dirname(__file__), "../Data")


def load_hospitals():
    hospitals = []
    with open(os.path.join(DATA_DIR, "hospitals.csv")) as f:
        for row in csv.DictReader(f):
            row["lat"] = float(row["lat"])
            row["lon"] = float(row["lon"])
            row["total_icu_beds"] = int(row["total_icu_beds"])
            row["available_icu_beds"] = int(row["available_icu_beds"])
            row["avg_wait_minutes"] = int(row["avg_wait_minutes"])
            row["specialties"] = row["specialties"].split(",")
            hospitals.append(row)
    return hospitals


def load_ambulances():
    ambulances = []
    with open(os.path.join(DATA_DIR, "ambulances.csv")) as f:
        for row in csv.DictReader(f):
            row["lat"] = float(row["lat"])
            row["lon"] = float(row["lon"])
            ambulances.append(row)
    return ambulances


def score_hospital(hospital, patient_lat, patient_lon, emergency_type, triage=None):
    """
    Scores a hospital 0–1 across four weighted factors.
    Weights: distance 40%, ICU availability 30%, specialty match 20%, wait time 10%

    triage (optional): {"age": ..., "consciousness": ..., "casualties": ...}
    Young patients get a small specialty bonus at hospitals that also offer
    paediatrics — mirrors the frontend recommender (frontend/src/lib/recommender.ts).
    """
    dist_km = haversine_distance(
        patient_lat, patient_lon, hospital["lat"], hospital["lon"]
    )
    distance_score = 1 / (dist_km + 0.1)

    icu_ratio = hospital["available_icu_beds"] / max(hospital["total_icu_beds"], 1)

    specialty_score = 1.5 if emergency_type in hospital["specialties"] else 0.5
    young = bool(triage) and triage.get("age") in ("infant", "child")
    if young and emergency_type != "pediatrics" and "pediatrics" in hospital["specialties"]:
        specialty_score += 0.3

    wait_score = 1 / (hospital["adjusted_wait_minutes"] + 1)

    total = (
        distance_score * 0.40 +
        icu_ratio      * 0.30 +
        specialty_score * 0.20 +
        wait_score     * 0.10
    )

    route = get_route_summary(patient_lat, patient_lon, hospital["lat"], hospital["lon"])

    return {
        "hospital": hospital,
        "score": round(total, 4),
        "distance_km": round(dist_km, 2),
        "route": route,
        "score_breakdown": {
            "distance_score": round(distance_score, 4),
            "icu_score": round(icu_ratio, 4),
            "specialty_score": specialty_score,
            "wait_score": round(wait_score, 4)
        }
    }


def recommend(patient_lat, patient_lon, emergency_type, top_n=3, triage=None, hour=None):
    hospitals = load_hospitals()
    ambulances = load_ambulances()

    # Enrich each hospital with occupancy prediction
    # (hour pins wait predictions to a fixed hour — used by the parity tests)
    hospitals = [enrich_hospital_with_occupancy(h, hour) for h in hospitals]

    # Score and rank
    scored = [score_hospital(h, patient_lat, patient_lon, emergency_type, triage) for h in hospitals]
    scored.sort(key=lambda x: x["score"], reverse=True)

    # Find nearest ambulance for the top hospital
    nearest_ambulance = find_nearest_ambulance(ambulances, patient_lat, patient_lon)

    return {
        "recommendations": scored[:top_n],
        "nearest_ambulance": nearest_ambulance,
        "total_hospitals_checked": len(hospitals)
    }