import streamlit as st
import pandas as pd
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from hospital_recommender import recommend
from hospital_recommender import load_hospitals, load_ambulances

st.set_page_config(page_title="IEHN — Emergency Finder", layout="wide")
st.title("IEHN — Intelligent Emergency Healthcare Network")
st.caption("Gwalior · Phase 1 Prototype")

col1, col2 = st.columns([1, 2])

with col1:
    st.subheader("Patient details")

    # Gwalior city centre (Maharaj Bada area)
    patient_lat = st.number_input("Patient latitude",  value=26.2120, format="%.4f")
    patient_lon = st.number_input("Patient longitude", value=78.1850, format="%.4f")

    emergency_type = st.selectbox("Emergency type", [
        "cardiology", "trauma", "neurology",
        "orthopedics", "pediatrics", "oncology", "burns"
    ])

    find = st.button("Find best hospitals", type="primary", use_container_width=True)

with col2:
    hospitals = load_hospitals()
    hosp_df = pd.DataFrame(hospitals)
    st.map(hosp_df.rename(columns={"lat": "latitude", "lon": "longitude"}))

if find:
    result = recommend(patient_lat, patient_lon, emergency_type)

    st.divider()
    st.subheader("Recommendations")

    amb = result["nearest_ambulance"]
    if amb:
        st.info(f"Nearest ambulance: **{amb['name']}** — {amb['distance_km']} km away, ETA ~{amb['eta_minutes']} min")

    for i, rec in enumerate(result["recommendations"]):
        h = rec["hospital"]
        rank_emoji = ["🥇", "🥈", "🥉"][i]
        with st.expander(f"{rank_emoji} #{i+1} — {h['name']}  |  Score: {rec['score']}", expanded=(i==0)):
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Distance", f"{rec['distance_km']} km")
            c2.metric("ICU beds free", f"{h['available_icu_beds']} / {h['total_icu_beds']}")
            c3.metric("Est. wait", f"{h['adjusted_wait_minutes']} min")
            c4.metric("Occupancy", h['occupancy_status'].upper())

            st.caption(f"Specialties: {', '.join(h['specialties'])}  |  Type: {h['type']}  |  Contact: {h['contact']}")

            bd = rec["score_breakdown"]
            score_df = pd.DataFrame({
                "Factor": ["Distance (40%)", "ICU availability (30%)", "Specialty match (20%)", "Wait time (10%)"],
                "Score": [bd["distance_score"], bd["icu_score"], bd["specialty_score"], bd["wait_score"]]
            })
            st.bar_chart(score_df.set_index("Factor"))