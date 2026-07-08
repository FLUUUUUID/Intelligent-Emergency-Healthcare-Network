"""IEHN backend — JSON API consumed by the React frontend (frontend/).

Run:  python Src/app.py          (serves on http://localhost:5000)
The Vite dev server proxies /api/* here (see frontend/vite.config.ts).
"""
from flask import Flask, request, jsonify
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from hospital_recommender import recommend, load_hospitals, load_ambulances

app = Flask(__name__)


@app.after_request
def cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response


@app.route("/")
def index():
    return jsonify({
        "service": "IEHN API",
        "status": "ok",
        "endpoints": ["/api/health", "/api/hospitals", "/api/ambulances", "/api/recommend (POST)"],
        "frontend": "run `npm run dev` inside frontend/ for the web app",
    })


@app.route("/api/health")
def api_health():
    return jsonify({"status": "ok", "hospitals": len(load_hospitals()), "ambulances": len(load_ambulances())})


@app.route("/api/hospitals")
def api_hospitals():
    return jsonify({"hospitals": load_hospitals()})


@app.route("/api/ambulances")
def api_ambulances():
    return jsonify({"ambulances": load_ambulances()})


@app.route("/api/recommend", methods=["POST", "OPTIONS"])
def api_recommend():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True) or {}
    try:
        patient_lat = float(data["patient_lat"])
        patient_lon = float(data["patient_lon"])
        emergency_type = str(data["emergency_type"])
    except (KeyError, TypeError, ValueError):
        return jsonify({"error": "patient_lat, patient_lon and emergency_type are required"}), 400

    # Optional triage findings from the frontend, e.g.
    # {"age": "child", "consciousness": "alert", "casualties": "single"}
    triage = data.get("triage") if isinstance(data.get("triage"), dict) else None

    result = recommend(patient_lat, patient_lon, emergency_type, triage=triage)
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug, port=port)
