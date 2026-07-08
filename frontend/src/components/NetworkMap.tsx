import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Plus, Minus } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

export interface HospitalPin {
  id: string
  name: string
  lat: number
  lon: number
  available: number
  total: number
  color: string // occupancy status color
}

export interface AmbulancePin {
  id: string
  name: string
  lat: number
  lon: number
  status: 'available' | 'busy'
}

export interface EventPin {
  id: number
  lat: number
  lon: number
  label: string
  color: string
  latest: boolean
}

interface Props {
  hospitals: HospitalPin[]
  ambulances: AmbulancePin[]
  events: EventPin[]
  focus: { lat: number; lon: number; ts: number } | null
}

const hospitalIcon = (color: string) =>
  L.divIcon({
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;background:#1D4ED8;border-radius:8px;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px ${color}66">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
    </div>`,
  })

const ambulanceIcon = (status: 'available' | 'busy') =>
  L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="position:relative;width:20px;height:20px">
      ${status === 'available' ? '<div class="iehn-ping" style="position:absolute;inset:0;border-radius:50%;background:rgba(5,150,105,0.35)"></div>' : ''}
      <div style="position:absolute;inset:3px;border-radius:50%;background:${status === 'available' ? '#059669' : '#F59E0B'};border:2px solid white;box-shadow:0 0 8px ${status === 'available' ? 'rgba(5,150,105,0.6)' : 'rgba(245,158,11,0.5)'}"></div>
    </div>`,
  })

const eventIcon = (color: string, latest: boolean) =>
  L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="position:relative;width:22px;height:22px">
      ${latest ? `<div class="iehn-ping" style="position:absolute;inset:0;border-radius:50%;background:${color}59"></div>` : ''}
      <div style="position:absolute;inset:6px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 10px ${color}99"></div>
    </div>`,
  })

function FitOnce({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(L.latLngBounds(points).pad(0.15), { maxZoom: 14 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  return null
}

function FlyToFocus({ focus }: { focus: Props['focus'] }) {
  const map = useMap()
  useEffect(() => {
    if (focus) map.flyTo([focus.lat, focus.lon], 15, { duration: 0.8 })
  }, [map, focus])
  return null
}

export default function NetworkMap({ hospitals, ambulances, events, focus }: Props) {
  const [map, setMap] = useState<L.Map | null>(null)

  const allPoints = useMemo<[number, number][]>(
    () => [...hospitals.map((h) => [h.lat, h.lon] as [number, number]), ...ambulances.map((a) => [a.lat, a.lon] as [number, number])],
    [hospitals, ambulances],
  )

  return (
    <div className="relative h-full w-full">
      {/* Zoom controls */}
      <div className="flex flex-col gap-1.5" style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 1000 }}>
        <button onClick={() => map?.zoomIn()} aria-label="Zoom in"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
          <Plus className="w-4 h-4" strokeWidth={2.5} />
        </button>
        <button onClick={() => map?.zoomOut()} aria-label="Zoom out"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-white/80 hover:text-white hover:bg-black/90 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#60A5FA] focus-visible:outline-none">
          <Minus className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Legend */}
      <div
        className="flex items-center gap-3 bg-black/75 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 flex-wrap"
        style={{ position: 'absolute', bottom: 14, left: 14, zIndex: 1000 }}
      >
        {([['#1D4ED8', 'Hospital'], ['#059669', 'Ambulance free'], ['#F59E0B', 'Ambulance busy'], ['#EF4444', 'Incident']] as const).map(([c, l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: c }} />
            <span className="text-[10px] text-white/50 font-medium">{l}</span>
          </div>
        ))}
      </div>

      <MapContainer
        ref={setMap}
        center={[26.218, 78.19]}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0a0f1a' }}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        keyboard={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />
        <FitOnce points={allPoints} />
        <FlyToFocus focus={focus} />

        {hospitals.map((h) => (
          <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon(h.color)}>
            <Tooltip direction="top" offset={[0, -14]} opacity={1}>
              <span className="font-semibold">{h.name}</span> · ICU {h.available}/{h.total}
            </Tooltip>
          </Marker>
        ))}

        {ambulances.map((a) => (
          <Marker key={a.id} position={[a.lat, a.lon]} icon={ambulanceIcon(a.status)}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="font-semibold">{a.name}</span> · {a.status}
            </Tooltip>
          </Marker>
        ))}

        {events.map((e) => (
          <Marker key={e.id} position={[e.lat, e.lon]} icon={eventIcon(e.color, e.latest)}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>{e.label}</Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
