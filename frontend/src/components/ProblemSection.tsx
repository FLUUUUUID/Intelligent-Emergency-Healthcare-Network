import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { AlertTriangle, Clock, TrendingDown, MapPin } from 'lucide-react'

const stats = [
  {
    icon: AlertTriangle,
    value: '40%',
    label: 'ICU Shortage Rate',
    description: 'of Indian hospitals operate above 90% ICU capacity during peak emergencies, leaving critical patients without beds.',
    accent: '#EF4444',
    bg: 'bg-red-500/[0.06]',
    border: 'border-red-500/15',
  },
  {
    icon: Clock,
    value: '34 min',
    label: 'Average Response',
    description: 'average ambulance response time in Indian cities — more than 3× the global benchmark of 8–10 minutes.',
    accent: '#F59E0B',
    bg: 'bg-amber-500/[0.06]',
    border: 'border-amber-500/15',
  },
  {
    icon: TrendingDown,
    value: '1.5M',
    label: 'Preventable Deaths',
    description: 'annual deaths in India attributable to delayed or misrouted emergency care — a crisis hiding in plain sight.',
    accent: '#2563EB',
    bg: 'bg-blue-500/[0.06]',
    border: 'border-blue-500/15',
  },
  {
    icon: MapPin,
    value: '5×',
    label: 'Urban–Rural Gap',
    description: 'disparity in emergency care access between urban centers and rural communities across India.',
    accent: '#10B981',
    bg: 'bg-emerald-500/[0.06]',
    border: 'border-emerald-500/15',
  },
]

export default function ProblemSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="problem" className="py-32 bg-[#0B1220]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="max-w-2xl mb-16"
        >
          <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
            The Problem
          </p>
          <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-6">
            The nearest hospital isn't always{' '}
            <em className="not-italic text-white/35">the best hospital.</em>
          </h2>
          <p className="text-[17px] text-white/55 leading-[1.7]">
            India's emergency healthcare system relies on outdated routing logic — sending patients
            to the closest facility regardless of capacity, specialist availability, or readiness.
            The cost is measured in lives.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                className={`${s.bg} ${s.border} border rounded-2xl p-6 hover:border-white/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${s.accent}18` }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.accent }} />
                </div>
                <div
                  className="text-[2.4rem] font-bold leading-none tracking-tight mb-2"
                  style={{ color: s.accent }}
                >
                  {s.value}
                </div>
                <div className="text-[13px] font-bold text-white mb-2">{s.label}</div>
                <p className="text-[13px] text-white/50 leading-relaxed">{s.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
