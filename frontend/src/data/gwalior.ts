// Real Gwalior hospital + ambulance data — mirrors Data/hospitals.csv and
// Data/ambulances.csv so the demo computes honest, location-aware results
// in the browser even when the Flask backend is offline.

export interface RawHospital {
  id: string
  name: string
  lat: number
  lon: number
  type: 'government' | 'private'
  total_icu_beds: number
  available_icu_beds: number
  specialties: string[]
  avg_wait_minutes: number
  contact: string
}

export interface RawAmbulance {
  id: string
  name: string
  lat: number
  lon: number
  status: 'available' | 'busy'
  hospital_id: string
  contact: string
}

export const HOSPITALS: RawHospital[] = [
  { id: '1', name: 'JAH Jai Arogya Hospital', lat: 26.2183, lon: 78.1828, type: 'government', total_icu_beds: 50, available_icu_beds: 10, specialties: ['cardiology', 'neurology', 'trauma', 'burns', 'orthopedics'], avg_wait_minutes: 30, contact: '0751-2420999' },
  { id: '2', name: 'Kamla Raja Hospital', lat: 26.2167, lon: 78.1833, type: 'government', total_icu_beds: 40, available_icu_beds: 8, specialties: ['cardiology', 'trauma', 'orthopedics'], avg_wait_minutes: 25, contact: '0751-2330000' },
  { id: '3', name: 'Birla Hospital', lat: 26.2256, lon: 78.1751, type: 'private', total_icu_beds: 25, available_icu_beds: 6, specialties: ['cardiology', 'neurology', 'oncology'], avg_wait_minutes: 12, contact: '0751-4050000' },
  { id: '4', name: 'Apollo Gwalior', lat: 26.2074, lon: 78.1977, type: 'private', total_icu_beds: 30, available_icu_beds: 7, specialties: ['cardiology', 'neurology', 'pediatrics', 'orthopedics'], avg_wait_minutes: 10, contact: '0751-4040000' },
  { id: '5', name: 'Ankur Hospital', lat: 26.2280, lon: 78.1990, type: 'private', total_icu_beds: 20, available_icu_beds: 5, specialties: ['neurology', 'cardiology', 'pediatrics'], avg_wait_minutes: 15, contact: '0751-2341000' },
  { id: '6', name: 'Aditi Hospital', lat: 26.2320, lon: 78.2100, type: 'private', total_icu_beds: 15, available_icu_beds: 3, specialties: ['trauma', 'burns', 'orthopedics'], avg_wait_minutes: 20, contact: '0751-2330500' },
  { id: '7', name: 'Mata Gujri Hospital', lat: 26.2445, lon: 78.2012, type: 'private', total_icu_beds: 18, available_icu_beds: 4, specialties: ['cardiology', 'trauma', 'orthopedics'], avg_wait_minutes: 18, contact: '0751-2350000' },
  { id: '8', name: 'Gwalior City Hospital', lat: 26.2198, lon: 78.1764, type: 'private', total_icu_beds: 12, available_icu_beds: 2, specialties: ['burns', 'pediatrics', 'trauma'], avg_wait_minutes: 22, contact: '0751-2320000' },
]

export const AMBULANCES: RawAmbulance[] = [
  { id: 'A1', name: 'Ambulance-01', lat: 26.2190, lon: 78.1840, status: 'available', hospital_id: '1', contact: '108' },
  { id: 'A2', name: 'Ambulance-02', lat: 26.2270, lon: 78.1700, status: 'available', hospital_id: '3', contact: '108' },
  { id: 'A3', name: 'Ambulance-03', lat: 26.1900, lon: 78.2100, status: 'busy', hospital_id: '4', contact: '108' },
  { id: 'A4', name: 'Ambulance-04', lat: 26.2400, lon: 78.2180, status: 'available', hospital_id: '6', contact: '108' },
  { id: 'A5', name: 'Ambulance-05', lat: 26.2060, lon: 78.2010, status: 'available', hospital_id: '4', contact: '108' },
  { id: 'A6', name: 'Ambulance-06', lat: 26.2250, lon: 78.1850, status: 'available', hospital_id: '1', contact: '108' },
  { id: 'A7', name: 'Ambulance-07', lat: 26.2260, lon: 78.1780, status: 'busy', hospital_id: '3', contact: '108' },
  { id: 'A8', name: 'Ambulance-08', lat: 26.2140, lon: 78.1940, status: 'available', hospital_id: '5', contact: '108' },
]
