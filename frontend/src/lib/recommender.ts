// Client-side hospital recommender.
//
// This is a faithful TypeScript port of the Python backend
// (Src/hospital_recommender.py, occupancy_predictor.py, route_optimizer.py).
// It lets the demo produce real, location-aware recommendations directly in
// the browser when the Flask API is unreachable — instead of returning
// hardcoded numbers that ignore where the user actually is.

import { HOSPITALS, AMBULANCES, RawHospital } from '../data/gwalior'

// ─── Shared result types (match the Flask /api/recommend JSON) ────────────────

export interface Hospital extends RawHospital {
  occupancy_status: 'critical' | 'high' | 'moderate' | 'low' | 'unknown'
  occupancy_rate: number
  adjusted_wait_minutes: number
}
export interface RouteSummary {
  distance_km: number
  estimated_minutes: number
  route_type: string
}
export interface ScoreBreakdown {
  distance_score: number
  icu_score: number
  specialty_score: number
  wait_score: number
}
export interface Recommendation {
  hospital: Hospital
  score: number
  distance_km: number
  route: RouteSummary
  score_breakdown: ScoreBreakdown
}
export interface AmbulanceResult {
  id: string
  name: string
  status: string
  lat: number
  lon: number
  distance_km: number
  eta_minutes: number
}
export interface ApiResult {
  recommendations: Recommendation[]
  nearest_ambulance: AmbulanceResult | null
  total_hospitals_checked: number
}

// ─── Geometry (route_optimizer.py) ────────────────────────────────────────────

const round = (n: number, d = 0) => {
  const f = 10 ** d
  return Math.round(n * f) / f
}

/** Straight-line distance in km between two GPS coordinates. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

/** Travel time in minutes. Assumes 40 km/h city ambulance speed. */
export function estimateTravelMinutes(distanceKm: number, trafficFactor = 1.0): number {
  return round((distanceKm / 40) * 60 * trafficFactor, 1)
}

function getRouteSummary(pLat: number, pLon: number, hLat: number, hLon: number): RouteSummary {
  const distance = haversineKm(pLat, pLon, hLat, hLon)
  return {
    distance_km: round(distance, 2),
    estimated_minutes: estimateTravelMinutes(distance),
    route_type: 'straight_line',
  }
}

// ─── Occupancy (occupancy_predictor.py) ───────────────────────────────────────

function getOccupancy(available: number, total: number): { status: Hospital['occupancy_status']; rate: number } {
  if (total === 0) return { status: 'unknown', rate: 0 }
  const rate = 1 - available / total
  if (rate >= 0.9) return { status: 'critical', rate }
  if (rate >= 0.7) return { status: 'high', rate }
  if (rate >= 0.4) return { status: 'moderate', rate }
  return { status: 'low', rate }
}

function predictWaitTime(baseWait: number, rate: number): number {
  let multiplier = 1.0
  if (rate >= 0.9) multiplier = 2.5
  else if (rate >= 0.7) multiplier = 1.7
  else if (rate >= 0.4) multiplier = 1.2
  return round(baseWait * multiplier, 0)
}

function enrich(h: RawHospital): Hospital {
  const { status, rate } = getOccupancy(h.available_icu_beds, h.total_icu_beds)
  return {
    ...h,
    occupancy_status: status,
    occupancy_rate: round(rate, 2),
    adjusted_wait_minutes: predictWaitTime(h.avg_wait_minutes, rate),
  }
}

// ─── Triage ───────────────────────────────────────────────────────────────────

export type AgeBand = 'infant' | 'child' | 'adult' | 'elderly'
export type Consciousness = 'alert' | 'voice' | 'unresponsive'
export type Casualties = 'single' | 'few' | 'mass'
export type Severity = 'Critical' | 'High' | 'Medium'

export interface Triage {
  age: AgeBand
  consciousness: Consciousness
  casualties: Casualties
}

export const DEFAULT_TRIAGE: Triage = { age: 'adult', consciousness: 'alert', casualties: 'single' }

const SEV_ORDER: Severity[] = ['Medium', 'High', 'Critical']

/** Escalate the emergency's baseline severity using the triage findings. */
export function computeSeverity(base: Severity, t: Triage): Severity {
  let rank = SEV_ORDER.indexOf(base)
  if (t.consciousness === 'unresponsive') rank = 2
  else if (t.consciousness === 'voice') rank = Math.max(rank, 1)
  if (t.casualties === 'mass') rank = 2
  else if (t.casualties === 'few') rank = Math.max(rank, 1)
  if (t.age === 'infant') rank = Math.max(rank, 1)
  return SEV_ORDER[rank]
}

// ─── Scoring (hospital_recommender.py) ────────────────────────────────────────
// Weights: distance 40%, ICU availability 30%, specialty match 20%, wait 10%

function scoreHospital(
  h: Hospital,
  pLat: number,
  pLon: number,
  emergencyType: string,
  triage?: Triage,
): Recommendation {
  const distKm = haversineKm(pLat, pLon, h.lat, h.lon)
  const distanceScore = 1 / (distKm + 0.1)
  const icuRatio = h.available_icu_beds / Math.max(h.total_icu_beds, 1)
  let specialtyScore = h.specialties.includes(emergencyType) ? 1.5 : 0.5
  // Young patients: prefer a hospital that also offers paediatrics.
  const young = triage?.age === 'infant' || triage?.age === 'child'
  if (young && emergencyType !== 'pediatrics' && h.specialties.includes('pediatrics')) {
    specialtyScore += 0.3
  }
  const waitScore = 1 / (h.adjusted_wait_minutes + 1)

  const total =
    distanceScore * 0.4 + icuRatio * 0.3 + specialtyScore * 0.2 + waitScore * 0.1

  return {
    hospital: h,
    score: round(total, 4),
    distance_km: round(distKm, 2),
    route: getRouteSummary(pLat, pLon, h.lat, h.lon),
    score_breakdown: {
      distance_score: round(distanceScore, 4),
      icu_score: round(icuRatio, 4),
      specialty_score: specialtyScore,
      wait_score: round(waitScore, 4),
    },
  }
}

function findNearestAmbulance(pLat: number, pLon: number): AmbulanceResult | null {
  const available = AMBULANCES.filter((a) => a.status === 'available')
  if (available.length === 0) return null

  const withDistance = available.map((a) => {
    const distance_km = round(haversineKm(pLat, pLon, a.lat, a.lon), 2)
    return {
      id: a.id,
      name: a.name,
      status: a.status,
      lat: a.lat,
      lon: a.lon,
      distance_km,
      eta_minutes: estimateTravelMinutes(distance_km),
    }
  })

  return withDistance.reduce((nearest, a) => (a.distance_km < nearest.distance_km ? a : nearest))
}

/** Mirror of the Flask /api/recommend endpoint, computed in-browser. */
export function computeRecommendation(
  patientLat: number,
  patientLon: number,
  emergencyType: string,
  topN = 3,
  triage?: Triage,
): ApiResult {
  const enriched = HOSPITALS.map(enrich)
  const scored = enriched
    .map((h) => scoreHospital(h, patientLat, patientLon, emergencyType, triage))
    .sort((a, b) => b.score - a.score)

  return {
    recommendations: scored.slice(0, topN),
    nearest_ambulance: findNearestAmbulance(patientLat, patientLon),
    total_hospitals_checked: enriched.length,
  }
}
