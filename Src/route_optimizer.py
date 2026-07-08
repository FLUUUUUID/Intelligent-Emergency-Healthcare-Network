import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """Straight-line distance in km between two GPS coordinates."""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def estimate_travel_time(distance_km, traffic_factor=1.0):
    """
    Estimates travel time in minutes.
    Assumes average ambulance speed of 40 km/h in city.
    traffic_factor: 1.0 = normal, 1.5 = moderate traffic, 2.0 = heavy
    """
    avg_speed_kmh = 40
    hours = distance_km / avg_speed_kmh
    return round(hours * 60 * traffic_factor, 1)


def find_nearest_ambulance(ambulances, patient_lat, patient_lon):
    """
    From the list of ambulances, returns the nearest available one
    along with its distance and estimated travel time.
    """
    available = [a for a in ambulances if a["status"] == "available"]

    if not available:
        return None

    for amb in available:
        amb["distance_km"] = round(
            haversine_distance(patient_lat, patient_lon, amb["lat"], amb["lon"]), 2
        )
        amb["eta_minutes"] = estimate_travel_time(amb["distance_km"])

    nearest = min(available, key=lambda x: x["distance_km"])
    return nearest


def get_route_summary(patient_lat, patient_lon, hospital_lat, hospital_lon):
    """
    Returns a simple route summary between patient and hospital.
    Phase 2 will replace this with real OSRM/Google Maps API calls.
    """
    distance = haversine_distance(patient_lat, patient_lon, hospital_lat, hospital_lon)
    travel_time = estimate_travel_time(distance)

    return {
        "distance_km": round(distance, 2),
        "estimated_minutes": travel_time,
        "route_type": "straight_line",
        "note": "Phase 2 will use real road routing via OSRM"
    }