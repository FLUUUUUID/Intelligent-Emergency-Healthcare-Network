import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus } from 'lucide-react'
import { haversineKm, estimateTravelMinutes } from '../lib/recommender'

// Leaflet's default icon assets don't resolve under the Vite bundler; we use
// pure divIcons below, so neutralise the default to avoid 404 lookups.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

type LatLng = [number, number]

interface AltHospital {
  lat: number
  lon: number
  name: string
  rank: number
}

interface Props {
  patientLat: number
  patientLon: number
  hospitalLat: number
  hospitalLon: number
  hospitalName: string
  ambulanceLat: number
  ambulanceLon: number
  ambulanceName: string
  alternates?: AltHospital[]
}

type Phase = 'loading' | 'to_patient' | 'to_hospital' | 'arrived'

// ─── Marker icons ─────────────────────────────────────────────────────────────

const patientIcon = L.divIcon({
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  html: `<div style="position:relative;width:24px;height:24px" aria-label="Patient location">
    <div class="iehn-ping" style="position:absolute;inset:0;border-radius:50%;background:rgba(239,68,68,0.35)"></div>
    <div style="position:absolute;inset:4px;border-radius:50%;background:#EF4444;border:2.5px solid white;box-shadow:0 0 10px rgba(239,68,68,0.55)"></div>
  </div>`,
})

const hospitalIcon = (name: string) =>
  L.divIcon({
    className: '',
    iconSize: [34, 52],
    iconAnchor: [17, 17],
    html: `<div style="display:flex;flex-direction:column;align-items:center" aria-label="Destination hospital ${name}">
      <div style="width:34px;height:34px;background:#1D4ED8;border-radius:8px;border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(37,99,235,0.55)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
      </div>
      <div style="background:rgba(0,0,0,0.82);color:white;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;white-space:nowrap;font-family:system-ui,sans-serif;border:1px solid rgba(255,255,255,0.12);margin-top:4px">
        ${name.length > 20 ? name.slice(0, 18) + '…' : name}
      </div>
    </div>`,
  })

const ambulanceIcon = L.divIcon({
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
  html: `<div style="width:38px;height:38px;background:#059669;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(5,150,105,0.75)" aria-label="Ambulance">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M5 9h4M7 7v4"/></svg>
  </div>`,
})

// Dimmer pins for the runner-up hospitals the AI also evaluated.
const altHospitalIcon = (rank: number, name: string) =>
  L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:22px;height:22px;background:rgba(30,64,175,0.45);border:1.5px solid rgba(147,197,253,0.65);border-radius:6px;display:flex;align-items:center;justify-content:center" aria-label="Alternative hospital ${rank}: ${name}">
      <span style="color:#DBEAFE;font-size:11px;font-weight:700;font-family:system-ui,sans-serif">${rank}</span>
    </div>`,
  })

// ─── Routing helpers ──────────────────────────────────────────────────────────

interface Leg {
  coords: LatLng[]
  cumKm: number[]
  totalKm: number
  durationMin: number
}

/** Fetch road geometry from the public OSRM server; fall back to a straight line. */
async function fetchLeg(from: LatLng, to: LatLng, signal: AbortSignal): Promise<Leg> {
  const straight = (): Leg => {
    const totalKm = haversineKm(from[0], from[1], to[0], to[1])
    return { coords: [from, to], cumKm: [0, totalKm], totalKm, durationMin: estimateTravelMinutes(totalKm) }
  }
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
    const res = await fetch(url, { signal })
    if (!res.ok) return straight()
    const data = await res.json()
    const route = data?.routes?.[0]
    if (!route?.geometry?.coordinates?.length) return straight()

    const coords: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
    const cumKm: number[] = [0]
    for (let i = 1; i < coords.length; i++) {
      cumKm.push(cumKm[i - 1] + haversineKm(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1]))
    }
    return {
      coords,
      cumKm,
      totalKm: route.distance / 1000,
      durationMin: route.duration / 60,
    }
  } catch {
    return straight()
  }
}

/** Position along a leg at fraction f∈[0,1] of its length. */
function positionAt(leg: Leg, f: number): LatLng {
  if (leg.totalKm === 0 || leg.coords.length < 2) return leg.coords[0]
  const target = f * leg.totalKm
  let i = 0
  while (i < leg.cumKm.length - 2 && leg.cumKm[i + 1] < target) i++
  const segLen = leg.cumKm[i + 1] - leg.cumKm[i] || 1e-9
  const local = Math.min(1, Math.max(0, (target - leg.cumKm[i]) / segLen))
  const [aLat, aLon] = leg.coords[i]
  const [bLat, bLon] = leg.coords[i + 1]
  return [aLat + (bLat - aLat) * local, aLon + (bLon - aLon) * local]
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
const fmtEta = (min: number) =>
  min < 1 ? `${Math.max(0, Math.round(min * 60))}s` : `${min.toFixed(1)} min`

function FitBounds({ coords }: { coords: LatLng[] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length) map.fitBounds(L.latLngBounds(coords).pad(0.18), { maxZoom: 15 })
  }, [map, coords])
  return null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LiveMap({
  patientLat,
  patientLon,
  hospitalLat,
  hospitalLon,
  hospitalName,
  ambulanceLat,
  ambulanceLon,
  ambulanceName,
  alternates = [],
}: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [legA, setLegA] = useState<Leg | null>(null) // ambulance → patient (pickup)
  const [legB, setLegB] = useState<Leg | null>(null) // patient → hospital (transport)
  const [map, setMap] = useState<L.Map | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ambRef = useRef<any>(null)
  const etaRef = useRef<HTMLSpanElement>(null)

  const patient: LatLng = [patientLat, patientLon]
  const hospital: LatLng = [hospitalLat, hospitalLon]
  const ambStart: LatLng = [ambulanceLat, ambulanceLon]

  // Fetch both road legs on mount
  useEffect(() => {
    const ctrl = new AbortController()
    let active = true
    ;(async () => {
      const [a, b] = await Promise.all([
        fetchLeg(ambStart, patient, ctrl.signal),
        fetchLeg(patient, hospital, ctrl.signal),
      ])
      if (!active) return
      setLegA(a)
      setLegB(b)
      setPhase('to_patient')
    })()
    return () => {
      active = false
      ctrl.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drive the ambulance along both legs once routes are ready
  useEffect(() => {
    if (!legA || !legB) return

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    if (prefersReduced) {
      ambRef.current?.setLatLng(hospital)
      setPhase('arrived')
      if (etaRef.current) etaRef.current.textContent = 'Arrived'
      return
    }

    // Compress real travel time into a watchable window (4.5–9s per leg)
    const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
    const wallA = clamp(legA.durationMin * 1500, 4500, 9000)
    const wallB = clamp(legB.durationMin * 1500, 4500, 9000)
    const PAUSE = 700 // brief pickup pause at the patient
    const endA = wallA
    const endPause = wallA + PAUSE
    const endTrip = wallA + PAUSE + wallB

    let raf = 0
    const start = performance.now()
    // Derive the phase from elapsed time every frame (rather than edge-
    // triggering it) so a stalled frame can never skip the transition.
    let current: Phase = 'to_patient'
    const advance = (p: Phase) => {
      if (p !== current) {
        current = p
        setPhase(p)
      }
    }

    const setEta = (min: number | string) => {
      if (etaRef.current) etaRef.current.textContent = typeof min === 'string' ? min : fmtEta(min)
    }

    const frame = (now: number) => {
      const t = now - start

      if (t < endA) {
        advance('to_patient')
        ambRef.current?.setLatLng(positionAt(legA, easeInOut(t / wallA)))
        setEta(legA.durationMin * (1 - t / wallA))
        raf = requestAnimationFrame(frame)
      } else if (t < endPause) {
        advance('to_hospital')
        ambRef.current?.setLatLng(patient)
        setEta(legB.durationMin)
        raf = requestAnimationFrame(frame)
      } else if (t < endTrip) {
        advance('to_hospital')
        const lt = t - endPause
        ambRef.current?.setLatLng(positionAt(legB, easeInOut(lt / wallB)))
        setEta(legB.durationMin * (1 - lt / wallB))
        raf = requestAnimationFrame(frame)
      } else {
        advance('arrived')
        ambRef.current?.setLatLng(hospital)
        setEta('Arrived')
      }
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legA, legB])

  // Memoised so it only changes when the routes/markers actually change — not on
  // every phase re-render. That keeps FitBounds from snapping the user's zoom back.
  const allCoords = useMemo<LatLng[]>(
    () => [
      ...(legA?.coords ?? [ambStart, patient]),
      ...(legB?.coords ?? [patient, hospital]),
      ...alternates.map((a) => [a.lat, a.lon] as LatLng),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [legA, legB, alternates, ambulanceLat, ambulanceLon, patientLat, patientLon, hospitalLat, hospitalLon],
  )
  const totalKm = legA && legB ? legA.totalKm + legB.totalKm : null

  const phaseLabel: Record<Phase, string> = {
    loading: 'Calculating fastest route…',
    to_patient: 'En route to patient',
    to_hospital: 'Patient on board · to hospital',
    arrived: 'Arrived at hospital',
  }
  const live = phase === 'to_patient' || phase === 'to_hospital'

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/8 mb-5 h-[260px] sm:h-[300px]">
      {/* Live status HUD */}
      <div
        className="flex items-center gap-2.5 bg-black/75 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/10"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 1000 }}
      >
        <div
          className={`w-2 h-2 rounded-full ${live ? 'animate-pulse' : ''}`}
          style={{ background: phase === 'arrived' ? '#60A5FA' : '#10B981' }}
        />
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold text-white">{ambulanceName}</span>
            {phase !== 'loading' && phase !== 'arrived' && (
              <span className="text-[12px] font-bold text-[#34D399]">
                <span ref={etaRef}>—</span> ETA
              </span>
            )}
          </div>
          <div className="text-[10px] text-white/45 font-medium">{phaseLabel[phase]}</div>
        </div>
      </div>

      {/* Trip distance badge */}
      {totalKm != null && (
        <div
          className="bg-black/75 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10"
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000 }}
        >
          <span className="text-[11px] text-white/45">Trip </span>
          <span className="text-[12px] font-bold text-white">{totalKm.toFixed(1)} km</span>
        </div>
      )}

      {/* Legend */}
      <div
        className="flex items-center gap-3 bg-black/75 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10"
        style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 1000 }}
      >
        {([['#EF4444', 'Patient'], ['#2563EB', 'Hospital'], ['#059669', 'Ambulance']] as const).map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[10px] text-white/50 font-medium">{l}</span>
          </div>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex flex-col gap-1.5" style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1000 }}>
        <button onClick={() => map?.zoomIn()} aria-label="Zoom in"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button onClick={() => map?.zoomOut()} aria-label="Zoom out"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      <MapContainer
        ref={setMap}
        center={patient}
        zoom={14}
        style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        // On touch devices one-finger drag scrolls the page (no scroll trap);
        // pinch-zoom still works and the +/− buttons cover panning needs.
        dragging={!L.Browser.mobile}
        keyboard={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <FitBounds coords={allCoords} />

        {/* Pickup leg: ambulance → patient */}
        {legA && (
          <Polyline
            positions={legA.coords}
            pathOptions={{
              color: '#10B981',
              weight: 4,
              opacity: phase === 'to_patient' ? 0.95 : 0.3,
              dashArray: phase === 'to_patient' ? undefined : '6 8',
            }}
          />
        )}
        {/* Transport leg: patient → hospital */}
        {legB && (
          <Polyline
            positions={legB.coords}
            pathOptions={{
              color: '#60A5FA',
              weight: 4,
              opacity: phase === 'to_hospital' || phase === 'arrived' ? 0.95 : 0.4,
              dashArray: phase === 'to_hospital' || phase === 'arrived' ? undefined : '6 8',
            }}
          />
        )}

        {/* Runner-up hospitals the AI also evaluated */}
        {alternates.map((a) => (
          <Marker key={a.rank} position={[a.lat, a.lon]} icon={altHospitalIcon(a.rank, a.name)} />
        ))}

        <Marker position={patient} icon={patientIcon} />
        <Marker position={hospital} icon={hospitalIcon(hospitalName)} />
        <Marker ref={ambRef} position={ambStart} icon={ambulanceIcon} />
      </MapContainer>
    </div>
  )
}
