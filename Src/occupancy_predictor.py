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


def predict_wait_time(base_wait_minutes, occupancy_rate):
    """
    Adjusts wait time estimate based on current occupancy.
    Higher occupancy = longer actual wait.
    
    Phase 2 will replace this with a trained ML model.
    """
    if occupancy_rate >= 0.90:
        multiplier = 2.5
    elif occupancy_rate >= 0.70:
        multiplier = 1.7
    elif occupancy_rate >= 0.40:
        multiplier = 1.2
    else:
        multiplier = 1.0

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
    adjusted_wait = predict_wait_time(hospital["avg_wait_minutes"], rate)

    hospital["occupancy_status"] = status
    hospital["occupancy_rate"] = round(rate, 2) if isinstance(rate, float) else rate
    hospital["adjusted_wait_minutes"] = adjusted_wait
    return hospital