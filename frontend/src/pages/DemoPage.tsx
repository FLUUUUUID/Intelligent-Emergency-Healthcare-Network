import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, ArrowLeft, AlertCircle, Brain, Heart,
  Zap, AlertTriangle, CheckCircle, Clock, Cpu, Bed,
  Navigation, Shield, MapPin, ChevronRight, RotateCcw, SkipForward,
} from 'lucide-react'
import LiveMap from '../components/LiveMap'
import {
  computeRecommendation, computeSeverity, DEFAULT_TRIAGE,
  type ApiResult, type Triage, type Severity, type AgeBand, type Consciousness, type Casualties,
} from '../lib/recommender'

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserLocation { lat: number; lon: number; address?: string; accuracy?: number }
interface EmergencyType {
  id: string; icon: React.ElementType; title: string
  severity: Severity; type: string; color: string; description: string
}
interface Scenario extends EmergencyType { location: string; lat: number; lon: number; triage: Triage }

type DemoState = 'detecting' | 'selecting' | 'triage' | 'processing' | 'results'

// ─── Triage options ───────────────────────────────────────────────────────────

const AGE_OPTIONS: { id: AgeBand; label: string }[] = [
  { id: 'infant', label: 'Infant' },
  { id: 'child', label: 'Child' },
  { id: 'adult', label: 'Adult' },
  { id: 'elderly', label: 'Elderly' },
]
const CONSCIOUSNESS_OPTIONS: { id: Consciousness; label: string }[] = [
  { id: 'alert', label: 'Alert' },
  { id: 'voice', label: 'Responds to voice' },
  { id: 'unresponsive', label: 'Unresponsive' },
]
const CASUALTY_OPTIONS: { id: Casualties; label: string }[] = [
  { id: 'single', label: 'Single patient' },
  { id: 'few', label: '2–3 people' },
  { id: 'mass', label: '4+ (mass)' },
]

// ─── Emergency types ──────────────────────────────────────────────────────────

const emergencyTypes: EmergencyType[] = [
  { id: 'cardiac', icon: Heart, title: 'Cardiac Arrest', severity: 'Critical', type: 'cardiology', color: '#EF4444', description: 'Patient unresponsive, chest pain, or cardiac event.' },
  { id: 'trauma', icon: AlertTriangle, title: 'Road Trauma', severity: 'Critical', type: 'trauma', color: '#F59E0B', description: 'Accident, collision, or serious physical injury.' },
  { id: 'neuro', icon: Brain, title: 'Stroke', severity: 'High', type: 'neurology', color: '#8B5CF6', description: 'Sudden confusion, speech difficulty, or arm weakness.' },
  { id: 'burns', icon: Zap, title: 'Severe Burns', severity: 'High', type: 'burns', color: '#F97316', description: 'Burn injuries from fire, chemical, or electrical source.' },
  { id: 'pediatric', icon: Shield, title: 'Pediatric Emergency', severity: 'Medium', type: 'pediatrics', color: '#10B981', description: 'Child with high fever, seizures, or unresponsive.' },
]

// ─── Processing steps ─────────────────────────────────────────────────────────

const getSteps = (s: Scenario, total: number) => [
  { text: `Pinpointing patient location — ${s.location}`, color: '#60A5FA' },
  { text: `Querying ${total} registered hospitals in Gwalior region`, color: '#60A5FA' },
  { text: `Checking real-time ICU and bed availability`, color: '#60A5FA' },
  { text: `Matching specialist filter: ${s.type}`, color: '#A78BFA' },
  { text: `Running AI scoring model (distance · ICU · specialty · wait)`, color: '#A78BFA' },
  { text: `Computing nearest ambulance dispatch route`, color: '#34D399' },
  { text: `Recommendation generated.`, color: '#34D399' },
]

// ─── Helper components ────────────────────────────────────────────────────────

const severityColors: Record<string, string> = { Critical: '#EF4444', High: '#F59E0B', Medium: '#10B981' }

function SeverityBadge({ level }: { level: string }) {
  const color = severityColors[level] ?? '#94A3B8'
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest" style={{ color, background: `${color}18` }}>{level}</span>
}

function ScoreBar({ label, pct, color, weight }: { label: string; pct: number; color: string; weight: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] text-white/50 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/45">{weight}</span>
          <span className="text-[12px] font-bold" style={{ color }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full" style={{ background: color }} />
      </div>
    </div>
  )
}

function OccupancyBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100)
  const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#F59E0B' : '#10B981'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-medium flex-shrink-0" style={{ color }}>{pct}%</span>
    </div>
  )
}

function TriageRow({ label, options, value, onPick, color }: {
  label: string
  options: { id: string; label: string }[]
  value: string
  onPick: (id: string) => void
  color: string
}) {
  return (
    <div>
      <div className="text-[12px] font-semibold text-white/55 uppercase tracking-wider mb-2.5">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const active = o.id === value
          return (
            <button key={o.id} onClick={() => onPick(o.id)} aria-pressed={active}
              className={`px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none ${active ? 'text-white' : 'text-white/55 border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:text-white/80'}`}
              style={active ? { background: `${color}22`, borderColor: `${color}80` } : undefined}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function triageSummary(t: Triage): string {
  const find = (arr: { id: string; label: string }[], id: string) => arr.find(o => o.id === id)?.label ?? id
  return [find(AGE_OPTIONS, t.age), find(CONSCIOUSNESS_OPTIONS, t.consciousness), find(CASUALTY_OPTIONS, t.casualties)].join(' · ')
}

// Gwalior city centre (Maharaj Bada area) — deliberately not on top of any
// hospital, so the recommendation spreads across candidates.
const GW_DEFAULT: UserLocation = { lat: 26.2120, lon: 78.1850, address: 'Gwalior City Centre (default)' }

// ─── Main component ───────────────────────────────────────────────────────────

export default function DemoPage() {
  const [state, setState] = useState<DemoState>('detecting')
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [usingDefault, setUsingDefault] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null)
  const [pendingType, setPendingType] = useState<EmergencyType | null>(null)
  const [triage, setTriage] = useState<Triage>(DEFAULT_TRIAGE)
  const [result, setResult] = useState<ApiResult | null>(null)
  const [simulationMode, setSimulationMode] = useState(false)
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const geoSession = useRef(0)

  // Commit a resolved location and advance to the selecting screen.
  const applyLocation = useCallback((loc: UserLocation, isDefault: boolean, errMsg: string | null, delay: number) => {
    setUserLocation(loc)
    setUsingDefault(isDefault)
    setLocationError(errMsg)
    setTimeout(() => setState('selecting'), delay)
  }, [])

  const startGeolocation = useCallback(() => {
    const session = ++geoSession.current
    setState('detecting')
    setLocationError(null)
    setUserLocation(null)
    const live = () => session === geoSession.current // false if user skipped / re-detected

    // Hard fallback: never block the UI waiting on the browser.
    const hardTimer = setTimeout(() => { if (live()) applyLocation(GW_DEFAULT, true, 'Location detection timed out', 1200) }, 4500)

    if (!navigator.geolocation) {
      clearTimeout(hardTimer)
      applyLocation(GW_DEFAULT, true, 'Geolocation not supported by this browser', 1200)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon, accuracy } }) => {
        clearTimeout(hardTimer)
        if (!live()) return
        let address: string | undefined
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`)
          const d = await res.json()
          const parts = [d.address?.suburb, d.address?.city || d.address?.town, d.address?.state].filter(Boolean)
          address = parts.length ? parts.join(', ') : d.display_name?.split(',').slice(0, 2).join(', ')
        } catch { /* ignore */ }
        if (live()) applyLocation({ lat, lon, accuracy, address }, false, null, 600)
      },
      (err) => { clearTimeout(hardTimer); if (live()) applyLocation(GW_DEFAULT, true, err.message, 1200) },
      { timeout: 7000 }
    )
  }, [applyLocation])

  // Skip the wait entirely and use the Gwalior city-centre default immediately.
  const skipToDefault = useCallback(() => {
    geoSession.current++ // invalidate any in-flight geolocation callback
    applyLocation(GW_DEFAULT, true, null, 0)
  }, [applyLocation])

  useEffect(() => { startGeolocation() }, [startGeolocation])

  const buildScenario = (et: EmergencyType, t: Triage): Scenario => ({
    ...et,
    severity: computeSeverity(et.severity, t),
    location: userLocation!.address
      ? userLocation!.address.split(',').slice(0, 2).join(',').trim()
      : `${userLocation!.lat.toFixed(4)}°N ${userLocation!.lon.toFixed(4)}°E`,
    lat: userLocation!.lat,
    lon: userLocation!.lon,
    triage: t,
  })

  // Pick an emergency → quick triage step (defaults pre-filled).
  const handleEmergency = (et: EmergencyType) => {
    if (!userLocation) return
    setPendingType(et)
    setTriage(DEFAULT_TRIAGE)
    setState('triage')
  }

  // Dispatch from the triage screen with the chosen findings.
  const dispatchTriage = () => {
    if (!pendingType || !userLocation) return
    runScenario(buildScenario(pendingType, triage))
  }

  // Direct dispatch with given findings (used by the ?go= quick-launch link).
  const runWith = (et: EmergencyType, t: Triage) => {
    if (!userLocation) return
    runScenario(buildScenario(et, t))
  }

  const runScenario = async (scenario: Scenario) => {
    setActiveScenario(scenario)
    setResult(null)
    setSimulationMode(false)
    setVisibleSteps(0)
    setState('processing')
    const t0 = Date.now()
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < 7; i++) timers.push(setTimeout(() => setVisibleSteps(i + 1), i * 380))
    let apiData: ApiResult | null = null
    try {
      const [res] = await Promise.all([
        fetch('/api/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patient_lat: scenario.lat, patient_lon: scenario.lon, emergency_type: scenario.type, triage: scenario.triage }) }).then(r => r.json()),
        new Promise(r => setTimeout(r, 2700)),
      ])
      apiData = res
    } catch {
      setSimulationMode(true)
      await new Promise(r => setTimeout(r, Math.max(0, 2700 - (Date.now() - t0))))
      // Compute a real, location-aware recommendation in-browser (mirrors the
      // Flask scoring) so distances/scores reflect the user's actual position.
      apiData = computeRecommendation(scenario.lat, scenario.lon, scenario.type, 3, scenario.triage)
    }
    timers.forEach(clearTimeout)
    setVisibleSteps(7)
    setElapsedMs(Date.now() - t0)
    setResult(apiData)
    setTimeout(() => setState('results'), 400)
  }

  const reset = () => { setState('selecting'); setActiveScenario(null); setResult(null); setVisibleSteps(0) }

  // Keyboard shortcuts: skip detection, pick an emergency by number, reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state === 'detecting' && (e.key === 'Enter' || e.key === 'Escape')) { skipToDefault(); return }
      if (state === 'selecting' && userLocation) {
        const idx = parseInt(e.key, 10)
        if (idx >= 1 && idx <= emergencyTypes.length) handleEmergency(emergencyTypes[idx - 1])
      }
      if (state === 'triage') {
        if (e.key === 'Enter') dispatchTriage()
        else if (e.key === 'Escape') setState('selecting')
      }
      if (state === 'results' && e.key === 'Escape') reset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, userLocation, pendingType, triage])

  // Quick-launch via shareable link, e.g. /demo?go=cardiac (or trauma/neuro/burns/pediatric).
  // Auto-dispatches that emergency once a location is available — handy for demos and deep links.
  const autoRan = useRef(false)
  useEffect(() => {
    if (state !== 'selecting' || !userLocation || autoRan.current) return
    const go = new URLSearchParams(window.location.search).get('go')
    if (!go) return
    const et = emergencyTypes.find(e => e.id === go || e.type === go)
    if (et) { autoRan.current = true; runWith(et, DEFAULT_TRIAGE) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, userLocation])

  const top = result?.recommendations[0]
  const alts = result?.recommendations.slice(1) ?? []
  const amb = result?.nearest_ambulance
  const locLabel = userLocation?.address ?? (userLocation ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lon.toFixed(4)}°E` : '')

  return (
    <div className="min-h-screen-safe bg-[#060D18] text-white flex flex-col">

      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Back to site" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" /><span className="text-[12px] font-medium hidden sm:inline">Back to site</span>
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.5} /></div>
            <span className="text-[13px] font-semibold text-white">IEHN</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] font-semibold text-white/60 tracking-widest uppercase">Live Demo</span>
        </div>

        <div className="flex items-center gap-1.5">
          {state === 'detecting' && (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-white/10 border-t-white/40" /><span className="text-[12px] text-white/55">Locating…</span></>)}
          {state === 'selecting' && (<><Cpu className="w-3.5 h-3.5 text-white/30" /><span className="text-[12px] text-white/55">AI Engine ready</span></>)}
          {state === 'triage' && (<><Activity className="w-3.5 h-3.5 text-white/40" /><span className="text-[12px] text-white/55">Triage</span></>)}
          {state === 'processing' && (<><motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB]" /><span className="text-[12px] text-[#60A5FA]">AI processing…</span></>)}
          {state === 'results' && (<><CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /><span className="text-[12px] text-[#10B981]">Decision in {(elapsedMs / 1000).toFixed(1)}s</span></>)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Single keyed screen: remounts + fades in on each state change.
            (AnimatePresence mode="wait" exit-tracking is unreliable here, so we
            animate enter-only and let the key change swap screens cleanly.) */}
        <motion.div key={state} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

          {/* DETECTING */}
          {state === 'detecting' && (
            <div className="flex flex-col items-center justify-center min-h-[75vh] px-6">
              <div className="relative w-48 h-48 mb-10 flex items-center justify-center">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="absolute rounded-full border border-[#2563EB]/20"
                    style={{ width: '100%', height: '100%', animation: 'iehn-radar 2.8s ease-out infinite', animationDelay: `${i * 0.7}s` }} />
                ))}
                <div className="w-20 h-20 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/30 flex items-center justify-center z-10"
                  style={{ animation: 'iehn-breathe 2s ease-in-out infinite' }}>
                  <MapPin className="w-8 h-8 text-[#60A5FA]" />
                </div>
              </div>
              {locationError ? (
                <>
                  <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-yellow-400" /><span className="text-[17px] font-semibold text-yellow-300">Couldn’t access your location</span></div>
                  <p className="text-[14px] text-white/55 text-center max-w-sm leading-relaxed">No problem — we’ll use Gwalior city centre as your default. Taking you to the demo…</p>
                </>
              ) : (
                <>
                  <h2 className="text-[22px] font-bold text-white mb-2">Detecting your location…</h2>
                  <p className="text-[14px] text-white/55 text-center max-w-sm leading-relaxed mb-7">Allow location access for accurate hospital routing — or skip and use Gwalior city centre.</p>
                  <button onClick={skipToDefault}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-[13px] font-semibold text-white/80 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA]">
                    <SkipForward className="w-3.5 h-3.5" /> Skip — use Gwalior centre
                  </button>
                </>
              )}
            </div>
          )}

          {/* SELECTING */}
          {state === 'selecting' && userLocation && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

              {/* Location banner */}
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                className={`flex items-center gap-3 p-4 rounded-xl border mb-8 sm:mb-10 ${usingDefault ? 'border-[#2563EB]/20 bg-[#2563EB]/5' : 'border-[#10B981]/20 bg-[#10B981]/5'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${usingDefault ? 'bg-[#2563EB]/12 border border-[#2563EB]/25' : 'bg-[#10B981]/15 border border-[#10B981]/20'}`}>
                  {usingDefault ? <MapPin className="w-4 h-4 text-[#60A5FA]" /> : <CheckCircle className="w-4 h-4 text-[#34D399]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${usingDefault ? 'text-[#60A5FA]' : 'text-[#34D399]'}`}>
                    {usingDefault ? 'Default Location' : 'Location Detected'}
                  </div>
                  <div className="text-[13px] text-white/75 truncate">{locLabel}</div>
                  {userLocation.accuracy && !usingDefault && (
                    <div className="text-[11px] text-white/45 mt-0.5">Accurate to ±{Math.round(userLocation.accuracy)} m</div>
                  )}
                </div>
                <button onClick={startGeolocation} title="Re-detect location" aria-label="Re-detect my location"
                  className="p-3 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors cursor-pointer flex-shrink-0 focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </motion.div>

              {/* Heading */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/20 bg-[#2563EB]/8 mb-5">
                  <Cpu className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-widest">IEHN AI Engine</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">What is the emergency?</h1>
                <p className="text-[15px] text-white/55 max-w-md mx-auto leading-relaxed">
                  Select the type and the AI will find the best hospital from your current location.
                </p>
              </div>

              {/* Emergency cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyTypes.map((et, i) => {
                  const Icon = et.icon
                  return (
                    <motion.button key={et.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.4 }}
                      onClick={() => handleEmergency(et)}
                      aria-label={`Dispatch AI for ${et.title} — ${et.severity} severity`}
                      className="group text-left p-5 rounded-2xl border border-white/6 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/12 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${et.color}18` }}>
                          <Icon className="w-5 h-5" style={{ color: et.color }} />
                        </div>
                        <div className="flex items-center gap-2">
                          <kbd className="hidden sm:flex w-5 h-5 items-center justify-center rounded border border-white/15 bg-white/5 text-[10px] font-mono text-white/55" aria-hidden="true">{i + 1}</kbd>
                          <SeverityBadge level={et.severity} />
                        </div>
                      </div>
                      <h3 className="text-[16px] font-bold text-white mb-2">{et.title}</h3>
                      <p className="text-[12px] text-white/45 leading-relaxed mb-4">{et.description}</p>
                      <div className="flex items-center gap-1 text-[12px] font-semibold opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" style={{ color: et.color }}>
                        Dispatch AI <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </motion.button>
                  )
                })}
              </div>

              <p className="hidden sm:block text-center text-[12px] text-white/45 mt-8">
                Press <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 font-mono text-white/60">1</kbd>–<kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 font-mono text-white/60">5</kbd> to choose quickly
              </p>
              <p className="text-center text-[12px] text-white/50 mt-3">
                Powered by real hospital data from Gwalior, India · 8 hospitals · 8 ambulances
              </p>
            </div>
          )}

          {/* TRIAGE */}
          {state === 'triage' && pendingType && (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
              <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setState('selecting')} aria-label="Back to emergency types"
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${pendingType.color}18` }}>
                  <pendingType.icon style={{ color: pendingType.color, width: 22, height: 22 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[18px] font-bold text-white">{pendingType.title}</h2>
                    <SeverityBadge level={computeSeverity(pendingType.severity, triage)} />
                  </div>
                  <p className="text-[12px] text-white/45">Add quick patient details so the AI can prioritise correctly</p>
                </div>
              </div>

              <div className="space-y-6 rounded-2xl border border-white/8 bg-white/[0.02] p-5 sm:p-6">
                <TriageRow label="Patient age" color={pendingType.color} options={AGE_OPTIONS}
                  value={triage.age} onPick={(v) => setTriage(t => ({ ...t, age: v as AgeBand }))} />
                <TriageRow label="Responsiveness" color={pendingType.color} options={CONSCIOUSNESS_OPTIONS}
                  value={triage.consciousness} onPick={(v) => setTriage(t => ({ ...t, consciousness: v as Consciousness }))} />
                <TriageRow label="People affected" color={pendingType.color} options={CASUALTY_OPTIONS}
                  value={triage.casualties} onPick={(v) => setTriage(t => ({ ...t, casualties: v as Casualties }))} />
              </div>

              <div className="flex items-center justify-between gap-3 mt-8">
                <button onClick={() => setState('selecting')}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-white/55 border border-white/10 rounded-full hover:text-white hover:border-white/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button onClick={dispatchTriage}
                  className="flex items-center gap-2 px-6 py-2.5 text-[14px] font-semibold text-white rounded-full transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none hover:brightness-110"
                  style={{ background: pendingType.color }}>
                  Dispatch AI <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[12px] text-white/45 mt-5">
                <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 rounded border border-white/15 bg-white/5 font-mono text-white/60">Enter</kbd> to dispatch — defaults</span>
                <span className="sm:hidden">Defaults</span> are fine for a quick run
              </p>
            </div>
          )}

          {/* PROCESSING */}
          {state === 'processing' && activeScenario && (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
              <div className="flex items-center gap-3 p-4 rounded-xl border border-white/6 bg-white/[0.03] mb-6">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${activeScenario.color}18` }}>
                  <activeScenario.icon style={{ color: activeScenario.color, width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-white">{activeScenario.title}</span>
                    <SeverityBadge level={activeScenario.severity} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-white/45" />
                    <span className="text-[12px] text-white/55">{activeScenario.location}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#030810] border border-white/8 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" /><div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" /><div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
                  <span className="text-[11px] text-white/40 font-mono ml-2">iehn-ai --dispatch</span>
                </div>
                <div className="p-5 font-mono text-[13px] space-y-2 min-h-[240px]">
                  {getSteps(activeScenario, 8).map((step, i) => (
                    <AnimatePresence key={i}>
                      {visibleSteps > i && (
                        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="flex items-start gap-2.5">
                          {i === visibleSteps - 1 && visibleSteps < 7 ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 rounded-full border-2 border-[#2563EB]/30 border-t-[#60A5FA] flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 flex items-center justify-center">
                              {i === 6 ? <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" /> : <div className="w-1.5 h-1.5 rounded-full" style={{ background: step.color }} />}
                            </div>
                          )}
                          <span style={{ color: i === 6 ? '#34D399' : 'rgba(255,255,255,0.55)' }}>
                            {i === 6 ? <span className="font-semibold">{step.text}</span> : step.text}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESULTS */}
          {state === 'results' && top && activeScenario && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                    <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-widest">AI Decision Complete</span>
                    {simulationMode && <span className="text-[10px] text-white/50 px-2 py-0.5 rounded-full border border-white/10">simulation mode</span>}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">{activeScenario.title} · {activeScenario.location}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <SeverityBadge level={activeScenario.severity} />
                    <span className="text-[12px] text-white/45">{triageSummary(activeScenario.triage)}</span>
                  </div>
                </div>
                <button onClick={reset} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-white/50 border border-white/10 rounded-full hover:text-white hover:border-white/20 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
                  <ArrowLeft className="w-3.5 h-3.5" /> Run another
                </button>
              </div>

              {/* Live dispatch map */}
              <LiveMap
                key={activeScenario.id}
                patientLat={activeScenario.lat}
                patientLon={activeScenario.lon}
                hospitalLat={top.hospital.lat}
                hospitalLon={top.hospital.lon}
                hospitalName={top.hospital.name}
                ambulanceLat={amb?.lat ?? activeScenario.lat + 0.012}
                ambulanceLon={amb?.lon ?? activeScenario.lon - 0.012}
                ambulanceName={amb?.name ?? amb?.id ?? 'Ambulance'}
                alternates={alts.map((r, i) => ({ lat: r.hospital.lat, lon: r.hospital.lon, name: r.hospital.name, rank: i + 2 }))}
              />

              <div className="grid lg:grid-cols-[1fr_380px] gap-5">
                <div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-[#2563EB]/30 bg-gradient-to-br from-[#2563EB]/8 to-[#10B981]/5 p-5 sm:p-6 mb-5">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#2563EB] flex items-center justify-center text-[11px] font-bold text-white">#1</div>
                        <span className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-widest">AI Recommended</span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${top.hospital.type === 'government' ? 'text-blue-400 bg-blue-400/10' : 'text-purple-400 bg-purple-400/10'}`}>
                        {top.hospital.type === 'government' ? 'Govt.' : 'Private'}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight mb-5">{top.hospital.name}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {[
                        { icon: Bed, label: 'ICU Available', value: `${top.hospital.available_icu_beds}/${top.hospital.total_icu_beds}`, color: top.hospital.available_icu_beds < 5 ? '#EF4444' : top.hospital.available_icu_beds < 10 ? '#F59E0B' : '#10B981' },
                        { icon: Navigation, label: 'Distance', value: `${top.distance_km} km`, color: '#60A5FA' },
                        { icon: Clock, label: 'ETA', value: `${top.route.estimated_minutes} min`, color: '#34D399' },
                        { icon: Clock, label: 'Adj. Wait', value: `${top.hospital.adjusted_wait_minutes} min`, color: '#A78BFA' },
                      ].map(m => { const MIcon = m.icon; return (
                        <div key={m.label} className="bg-white/4 rounded-xl p-3 border border-white/5">
                          <MIcon className="w-3.5 h-3.5 mb-2" style={{ color: m.color }} />
                          <div className="text-[18px] font-bold leading-none mb-1" style={{ color: m.color }}>{m.value}</div>
                          <div className="text-[10px] text-white/50">{m.label}</div>
                        </div>
                      )})}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {top.hospital.specialties.map(sp => {
                        const matched = sp === activeScenario.type
                        return <span key={sp} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${matched ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#34D399]' : 'border-white/8 text-white/55'}`}>{matched && '✓ '}{sp}</span>
                      })}
                    </div>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] text-white/50">ICU Occupancy</span>
                        <span className={`text-[11px] font-semibold capitalize ${top.hospital.occupancy_status === 'critical' ? 'text-red-400' : top.hospital.occupancy_status === 'high' ? 'text-yellow-400' : 'text-emerald-400'}`}>{top.hospital.occupancy_status}</span>
                      </div>
                      <OccupancyBar rate={top.hospital.occupancy_rate} />
                    </div>
                    <div className="border-t border-white/8 pt-5">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] text-white/50 uppercase tracking-widest font-semibold">AI Score Breakdown</p>
                        <div className="text-[20px] font-bold text-white">{Math.round(top.score * 100)}<span className="text-[13px] text-white/45 font-normal ml-0.5">/ 100</span></div>
                      </div>
                      <div className="space-y-3">
                        <ScoreBar label="Distance" weight="40%" color="#60A5FA" pct={Math.min(100, (top.score_breakdown.distance_score / 1.0) * 60)} />
                        <ScoreBar label="ICU Capacity" weight="30%" color="#34D399" pct={Math.round(top.score_breakdown.icu_score * 100)} />
                        <ScoreBar label="Specialty Match" weight="20%" color="#A78BFA" pct={top.score_breakdown.specialty_score >= 1.5 ? 100 : 33} />
                        <ScoreBar label="Wait Time" weight="10%" color="#FBBF24" pct={Math.min(100, top.score_breakdown.wait_score * 800)} />
                      </div>
                    </div>
                  </motion.div>

                  {alts.length > 0 && alts[0].distance_km < top.distance_km && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                      className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/15 bg-yellow-500/5">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-semibold text-yellow-300 mb-0.5">Why not the nearest hospital?</p>
                        <p className="text-[12px] text-white/55 leading-relaxed">
                          <span className="text-white/75 font-medium">{alts[0].hospital.name}</span> is {alts[0].distance_km} km closer but scored lower due to{' '}
                          {!alts[0].hospital.specialties.includes(activeScenario.type) ? `no ${activeScenario.type} specialist on duty` : `higher ICU occupancy (${Math.round(alts[0].hospital.occupancy_rate * 100)}%)`}. The AI prioritises readiness over proximity.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-4">
                  {alts.map((rec, i) => (
                    <motion.div key={rec.hospital.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }}
                      className="p-4 rounded-xl border border-white/6 bg-white/[0.03]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/60">#{i + 2}</div>
                          <span className="text-[13px] font-bold text-white">{rec.hospital.name}</span>
                        </div>
                        <span className="text-[12px] font-bold text-white/50">{Math.round(rec.score * 100)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[{ label: 'ICU', value: `${rec.hospital.available_icu_beds}/${rec.hospital.total_icu_beds}` }, { label: 'Dist', value: `${rec.distance_km}km` }, { label: 'ETA', value: `${rec.route.estimated_minutes}m` }].map(m => (
                          <div key={m.label} className="bg-white/4 rounded-lg p-2 text-center">
                            <div className="text-[13px] font-semibold text-white">{m.value}</div>
                            <div className="text-[10px] text-white/50">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {rec.hospital.specialties.map(sp => (
                          <span key={sp} className={`text-[10px] px-2 py-0.5 rounded-full border ${sp === activeScenario.type ? 'border-[#10B981]/30 text-[#34D399]' : 'border-white/8 text-white/45'}`}>{sp}</span>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  {amb && (
                    <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
                      className="p-4 rounded-xl border border-[#10B981]/25 bg-[#10B981]/6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#34D399] uppercase tracking-widest">Ambulance Dispatched</span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[15px] font-bold text-white">{amb.name ?? amb.id}</span>
                        <span className="text-[11px] text-[#34D399] font-semibold">En route</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/4 rounded-lg p-3"><div className="text-[18px] font-bold text-white leading-none">{amb.eta_minutes} <span className="text-[12px] font-normal text-white/40">min</span></div><div className="text-[10px] text-white/50 mt-0.5">ETA</div></div>
                        <div className="bg-white/4 rounded-lg p-3"><div className="text-[18px] font-bold text-white leading-none">{amb.distance_km} <span className="text-[12px] font-normal text-white/40">km</span></div><div className="text-[10px] text-white/50 mt-0.5">Distance</div></div>
                      </div>
                      <p className="text-[11px] text-white/45 mt-3">Contact: 108 · Hospital pre-alerted</p>
                    </motion.div>
                  )}

                  <div className="p-3 rounded-xl border border-white/5 text-center">
                    <p className="text-[12px] text-white/45">
                      <span className="text-white/70 font-semibold">{result?.total_hospitals_checked}</span> hospitals evaluated ·{' '}
                      <span className="text-white/70 font-semibold">{(elapsedMs / 1000).toFixed(2)}s</span> total time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  )
}
