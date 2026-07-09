/**
 * Unit + golden-fixture tests for the TypeScript scoring engine.
 *
 * The golden fixtures (Tests/fixtures/parity_cases.json) are generated from
 * the PYTHON engine — every assertion here that passes proves the two
 * runtimes are numerically identical. The pytest suite asserts the same
 * fixtures on the Python side.
 *
 * Run:  npm test   (vitest run)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  computeRecommendation,
  computeSeverity,
  haversineKm,
  estimateTravelMinutes,
  occupancyInfo,
  DEFAULT_TRIAGE,
  type Triage,
} from './recommender'
import { AMBULANCES } from '../data/gwalior'

const CITY: [number, number] = [26.212, 78.185]

const fixturesPath = join(dirname(fileURLToPath(import.meta.url)), '../../../Tests/fixtures/parity_cases.json')
const { cases } = JSON.parse(readFileSync(fixturesPath, 'utf8')) as {
  cases: {
    name: string
    lat: number
    lon: number
    type: string
    triage: Triage | null
    hour: number
    expected: {
      total_hospitals_checked: number
      nearest_ambulance: { id: string; distance_km: number; eta_minutes: number }
      recommendations: {
        hospital_id: string
        hospital_name: string
        score: number
        distance_km: number
        eta_minutes: number
        adjusted_wait_minutes: number
        occupancy_rate: number
        occupancy_status: string
        score_breakdown: Record<string, number>
      }[]
    }
  }[]
}

// ─── geometry ─────────────────────────────────────────────────────────────────

describe('geometry', () => {
  it('haversine of identical points is zero', () => {
    expect(haversineKm(26.2, 78.18, 26.2, 78.18)).toBe(0)
  })

  it('one degree of latitude is ~111.19 km', () => {
    const d = haversineKm(26, 78, 27, 78)
    expect(d).toBeGreaterThan(110.5)
    expect(d).toBeLessThan(111.8)
  })

  it('20 km at 40 km/h city speed takes 30 minutes', () => {
    expect(estimateTravelMinutes(20)).toBe(30)
  })
})

// ─── occupancy ────────────────────────────────────────────────────────────────

describe('occupancy classification', () => {
  it.each([
    [1, 10, 'critical'],
    [3, 10, 'high'],
    [6, 10, 'moderate'],
    [8, 10, 'low'],
    [0, 0, 'unknown'],
  ])('%i/%i free → %s', (available, total, status) => {
    expect(occupancyInfo(available as number, total as number).status).toBe(status)
  })
})

// ─── triage severity ──────────────────────────────────────────────────────────

describe('computeSeverity', () => {
  it('defaults keep the baseline severity', () => {
    expect(computeSeverity('Medium', DEFAULT_TRIAGE)).toBe('Medium')
    expect(computeSeverity('Critical', DEFAULT_TRIAGE)).toBe('Critical')
  })

  it('unresponsive always escalates to Critical', () => {
    expect(computeSeverity('Medium', { age: 'adult', consciousness: 'unresponsive', casualties: 'single' })).toBe('Critical')
  })

  it('mass casualties always escalate to Critical', () => {
    expect(computeSeverity('Medium', { age: 'adult', consciousness: 'alert', casualties: 'mass' })).toBe('Critical')
  })

  it('voice response raises Medium to High', () => {
    expect(computeSeverity('Medium', { age: 'adult', consciousness: 'voice', casualties: 'single' })).toBe('High')
  })

  it('infants raise Medium to High', () => {
    expect(computeSeverity('Medium', { age: 'infant', consciousness: 'alert', casualties: 'single' })).toBe('High')
  })

  it('never de-escalates', () => {
    expect(computeSeverity('Critical', { age: 'adult', consciousness: 'alert', casualties: 'single' })).toBe('Critical')
  })
})

// ─── recommendation engine ────────────────────────────────────────────────────

describe('computeRecommendation', () => {
  it('returns three results sorted by score, from eight hospitals', () => {
    const r = computeRecommendation(...CITY, 'cardiology', 3, undefined, 12)
    expect(r.total_hospitals_checked).toBe(8)
    expect(r.recommendations).toHaveLength(3)
    const scores = r.recommendations.map((x) => x.score)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('never dispatches a busy ambulance', () => {
    const busy = new Set(AMBULANCES.filter((a) => a.status === 'busy').map((a) => a.id))
    const r = computeRecommendation(...CITY, 'trauma', 3, undefined, 12)
    expect(busy.has(r.nearest_ambulance!.id)).toBe(false)
  })

  it('applies the pediatric nudge only for young patients, non-pediatric emergencies', () => {
    const child: Triage = { age: 'child', consciousness: 'alert', casualties: 'single' }
    const run = (triage?: Triage, type = 'cardiology') =>
      computeRecommendation(...CITY, type, 8, triage, 12).recommendations.find((r) =>
        r.hospital.specialties.includes('pediatrics') && r.hospital.specialties.includes('cardiology'),
      )!
    expect(run(child).score_breakdown.specialty_score).toBe(1.8)
    expect(run(DEFAULT_TRIAGE).score_breakdown.specialty_score).toBe(1.5)
    expect(run(child, 'pediatrics').score_breakdown.specialty_score).toBe(1.5)
  })

  it('wait predictions respond to the diurnal peak (19:00 > 03:00)', () => {
    const at = (hour: number) =>
      computeRecommendation(...CITY, 'cardiology', 3, undefined, hour).recommendations[0].hospital.adjusted_wait_minutes
    expect(at(19)).toBeGreaterThan(at(3))
  })
})

// ─── cross-runtime parity (golden fixtures from the Python engine) ────────────

describe('parity with the Python engine', () => {
  it.each(cases.map((c) => [c.name, c] as const))('%s', (_name, c) => {
    const r = computeRecommendation(c.lat, c.lon, c.type, 3, c.triage ?? undefined, c.hour)

    expect(r.total_hospitals_checked).toBe(c.expected.total_hospitals_checked)
    expect(r.nearest_ambulance!.id).toBe(c.expected.nearest_ambulance.id)
    expect(r.nearest_ambulance!.distance_km).toBeCloseTo(c.expected.nearest_ambulance.distance_km, 9)
    expect(r.nearest_ambulance!.eta_minutes).toBeCloseTo(c.expected.nearest_ambulance.eta_minutes, 9)

    expect(r.recommendations).toHaveLength(c.expected.recommendations.length)
    r.recommendations.forEach((got, i) => {
      const want = c.expected.recommendations[i]
      expect(got.hospital.id).toBe(want.hospital_id)
      expect(got.score).toBeCloseTo(want.score, 9)
      expect(got.distance_km).toBeCloseTo(want.distance_km, 9)
      expect(got.route.estimated_minutes).toBeCloseTo(want.eta_minutes, 9)
      expect(got.hospital.adjusted_wait_minutes).toBeCloseTo(want.adjusted_wait_minutes, 9)
      expect(got.hospital.occupancy_rate).toBeCloseTo(want.occupancy_rate, 9)
      expect(got.hospital.occupancy_status).toBe(want.occupancy_status)
      for (const [key, val] of Object.entries(want.score_breakdown)) {
        expect(got.score_breakdown[key as keyof typeof got.score_breakdown]).toBeCloseTo(val, 9)
      }
    })
  })
})
