import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Activity, ArrowLeft, Bed, Building2, Radio, Truck } from 'lucide-react'
import NetworkMap, { type EventPin } from '../components/NetworkMap'
import { HOSPITALS, AMBULANCES } from '../data/gwalior'
import { computeRecommendation, occupancyInfo } from '../lib/recommender'

// ─── Simulated incident feed ──────────────────────────────────────────────────

const INCIDENT_TYPES = [
  { type: 'cardiology', label: 'Cardiac event', color: '#EF4444' },
  { type: 'trauma', label: 'Road trauma', color: '#F59E0B' },
  { type: 'neurology', label: 'Suspected stroke', color: '#8B5CF6' },
  { type: 'burns', label: 'Burn injury', color: '#F97316' },
  { type: 'pediatrics', label: 'Pediatric emergency', color: '#10B981' },
]

const AREAS = [
  'Maharaj Bada', 'Lashkar', 'Morar', 'Thatipur', 'Hazira',
  'Phool Bagh', 'Padav', 'DD Nagar', 'Gwalior Fort area', 'Baija Taal',
]

interface Incident {
  id: number
  time: string
  label: string
  color: string
  area: string
  lat: number
  lon: number
  hospital: string
  ambulance: string
}

let nextId = 1

function makeIncident(): Incident {
  const kind = INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)]
  const area = AREAS[Math.floor(Math.random() * AREAS.length)]
  const lat = 26.212 + (Math.random() - 0.5) * 0.05
  const lon = 78.185 + (Math.random() - 0.5) * 0.06
  // Run the real scoring engine for this simulated call
  const result = computeRecommendation(lat, lon, kind.type)
  return {
    id: nextId++,
    time: new Date().toLocaleTimeString('en-GB'),
    label: kind.label,
    color: kind.color,
    area,
    lat,
    lon,
    hospital: result.recommendations[0]?.hospital.name ?? '—',
    ambulance: result.nearest_ambulance?.name ?? '—',
  }
}

const statusColor: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  moderate: '#FBBF24',
  low: '#10B981',
  unknown: '#94A3B8',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString('en-GB'))
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [focus, setFocus] = useState<{ lat: number; lon: number; ts: number } | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-GB')), 1000)
    return () => clearInterval(id)
  }, [])

  // Simulated incoming incidents — each one runs the real recommender
  useEffect(() => {
    const push = () => setIncidents((prev) => [makeIncident(), ...prev].slice(0, 7))
    timers.current.push(setTimeout(push, 800))
    timers.current.push(setTimeout(push, 4200))
    const id = setInterval(push, 9500)
    return () => {
      timers.current.forEach(clearTimeout)
      clearInterval(id)
    }
  }, [])

  const hospitals = useMemo(
    () =>
      HOSPITALS.map((h) => {
        const occ = occupancyInfo(h.available_icu_beds, h.total_icu_beds)
        return { ...h, rate: occ.rate, status: occ.status, color: statusColor[occ.status] }
      }),
    [],
  )

  const stats = useMemo(() => {
    const totalBeds = HOSPITALS.reduce((s, h) => s + h.total_icu_beds, 0)
    const freeBeds = HOSPITALS.reduce((s, h) => s + h.available_icu_beds, 0)
    const freeAmb = AMBULANCES.filter((a) => a.status === 'available').length
    return {
      hospitals: HOSPITALS.length,
      freeBeds,
      totalBeds,
      freeAmb,
      totalAmb: AMBULANCES.length,
      occupancy: Math.round((1 - freeBeds / totalBeds) * 100),
    }
  }, [])

  const eventPins: EventPin[] = incidents.map((i, idx) => ({
    id: i.id,
    lat: i.lat,
    lon: i.lon,
    label: `${i.label} · ${i.area}`,
    color: i.color,
    latest: idx === 0,
  }))

  const focusHospital = (h: { id: string; lat: number; lon: number }) => {
    setSelectedHospital(h.id)
    setFocus({ lat: h.lat, lon: h.lon, ts: Date.now() })
  }

  return (
    <div className="h-screen min-h-screen-safe bg-[#060D18] text-white flex flex-col overflow-hidden">

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" aria-label="Back to site" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /><span className="text-[12px] font-medium hidden sm:inline">Back to site</span>
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center flex-shrink-0"><Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} /></div>
            <span className="text-[13px] font-semibold text-white truncate">IEHN Command Center</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#10B981]/25 bg-[#10B981]/8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] font-semibold text-[#34D399] tracking-widest uppercase">System Operational</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[13px] font-mono text-white/55 tabular-nums">{clock}</span>
          <Link to="/demo" className="hidden sm:flex items-center px-4 py-1.5 text-[12px] font-semibold text-[#0B1220] bg-white rounded-full hover:bg-[#DBEAFE] transition-colors cursor-pointer">
            Launch Demo
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-rows-[42vh_1fr] lg:grid-rows-1 lg:grid-cols-[1fr_390px]">

        {/* Map */}
        <div className="relative min-h-0 border-b lg:border-b-0 lg:border-r border-white/5">
          <NetworkMap
            hospitals={hospitals.map((h) => ({ id: h.id, name: h.name, lat: h.lat, lon: h.lon, available: h.available_icu_beds, total: h.total_icu_beds, color: h.color }))}
            ambulances={AMBULANCES.map((a) => ({ id: a.id, name: a.name, lat: a.lat, lon: a.lon, status: a.status }))}
            events={eventPins}
            focus={focus}
          />
        </div>

        {/* Side panel */}
        <div className="min-h-0 overflow-y-auto p-4 space-y-5">

          {/* Network stats */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Building2, label: 'Hospitals online', value: String(stats.hospitals), color: '#60A5FA' },
              { icon: Bed, label: 'ICU beds free', value: `${stats.freeBeds}/${stats.totalBeds}`, color: '#34D399' },
              { icon: Truck, label: 'Ambulances free', value: `${stats.freeAmb}/${stats.totalAmb}`, color: '#10B981' },
              { icon: Activity, label: 'Network occupancy', value: `${stats.occupancy}%`, color: '#F59E0B' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
                  <Icon className="w-3.5 h-3.5 mb-2" style={{ color: s.color }} />
                  <div className="text-[18px] font-bold leading-none mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[10px] text-white/50">{s.label}</div>
                </div>
              )
            })}
          </div>

          {/* Hospital capacity */}
          <div>
            <p className="text-[10px] text-white/45 uppercase tracking-[0.13em] font-semibold mb-2.5">Hospital Capacity</p>
            <div className="space-y-1.5">
              {hospitals.map((h) => (
                <button key={h.id} onClick={() => focusHospital(h)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 text-left focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none ${
                    selectedHospital === h.id ? 'bg-white/[0.07] ring-1 ring-white/10' : 'hover:bg-white/[0.04]'
                  }`}>
                  <div className="text-[12px] text-white/65 font-medium flex-1 min-w-0 truncate">{h.name}</div>
                  <div className="w-20 sm:w-24 h-[5px] bg-white/8 rounded-full overflow-hidden flex-shrink-0">
                    <div className="h-full rounded-full" style={{ width: `${Math.round(h.rate * 100)}%`, background: h.color }} />
                  </div>
                  <div className="text-[11px] text-white/40 w-9 text-right flex-shrink-0">{Math.round(h.rate * 100)}%</div>
                  <div className="text-[11px] font-bold w-6 text-right flex-shrink-0" style={{ color: h.color }}>{h.available_icu_beds}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-1.5 gap-4">
              <span className="text-[10px] text-white/25">% Occupancy</span>
              <span className="text-[10px] text-white/25">ICU free</span>
            </div>
          </div>

          {/* Incident feed */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Radio className="w-3.5 h-3.5 text-[#EF4444]" />
              <p className="text-[10px] text-white/45 uppercase tracking-[0.13em] font-semibold">Incoming Emergencies</p>
              <span className="text-[9px] text-white/30 px-1.5 py-0.5 rounded-full border border-white/10 uppercase tracking-wider">Simulated feed</span>
            </div>
            <div className="space-y-2">
              {incidents.length === 0 && (
                <div className="text-[12px] text-white/35 border border-white/8 rounded-lg p-3">Listening for incidents…</div>
              )}
              {incidents.map((i) => (
                <motion.div key={i.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
                  className="border border-white/8 bg-white/[0.03] rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: i.color }} />
                      <span className="text-[12px] font-bold truncate" style={{ color: i.color }}>{i.label}</span>
                      <span className="text-[12px] text-white/55 truncate">· {i.area}</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/35 flex-shrink-0">{i.time}</span>
                  </div>
                  <div className="text-[11px] text-white/50">
                    → <span className="text-white/75 font-medium">{i.hospital}</span> · {i.ambulance} dispatched
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-white/30 leading-relaxed pb-2">
            Live network view of the Gwalior pilot — 8 hospitals · 8 ambulances. Incidents are simulated;
            each one is routed by the same AI scoring engine that powers the <Link to="/demo" className="text-[#60A5FA] hover:underline cursor-pointer">live demo</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
