import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Brain, Navigation, BarChart2, Wifi } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Smart Hospital Matching',
    description: 'Our AI evaluates real-time ICU availability, specialist presence, trauma readiness, and predicted load — recommending the optimal facility, not just the closest.',
    tag: 'Machine Learning',
    accent: '#2563EB',
    metrics: ['97.3% accuracy', '< 2s decision', 'Multi-factor scoring'],
  },
  {
    icon: Navigation,
    title: 'Ambulance Optimization',
    description: 'Dynamic routing that adapts to live traffic, road conditions, and hospital entry protocols — cutting average transit time by up to 34%.',
    tag: 'Real-time Routing',
    accent: '#10B981',
    metrics: ['34% faster', 'Live traffic', 'Fleet-aware dispatch'],
  },
  {
    icon: BarChart2,
    title: 'Capacity Prediction',
    description: 'Predictive models built on historical patient flow, event calendars, and seasonal patterns proactively flag hospitals before they become critically overloaded.',
    tag: 'Predictive Analytics',
    accent: '#8B5CF6',
    metrics: ['4-hour forecast', '89% precision', 'Seasonal modeling'],
  },
  {
    icon: Wifi,
    title: 'Emergency Coordination',
    description: 'A unified command layer that synchronizes first responders, hospitals, and families — replacing fragmented phone chains with a single real-time source of truth.',
    tag: 'IoT + Communication',
    accent: '#F59E0B',
    metrics: ['Real-time sync', 'Multi-party alerts', 'Zero handoff delay'],
  },
]

export default function PlatformSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="platform" className="py-32 bg-[#060D18]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-16 max-w-xl mx-auto"
        >
          <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
            Platform
          </p>
          <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-5">
            One intelligent<br />emergency network.
          </h2>
          <p className="text-[17px] text-white/55 leading-[1.7]">
            Four interconnected capabilities working in concert to deliver the right patient
            to the right hospital in the right time.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: i * 0.1 + 0.15 }}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-8 hover:bg-white/[0.05] hover:border-white/15 hover:-translate-y-0.5 transition-all duration-300 cursor-default group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${f.accent}12` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: f.accent }} />
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: f.accent, background: `${f.accent}12` }}
                  >
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-[20px] font-bold text-white tracking-tight mb-3">
                  {f.title}
                </h3>
                <p className="text-[14px] text-white/50 leading-relaxed mb-6">
                  {f.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {f.metrics.map((m) => (
                    <span
                      key={m}
                      className="text-[12px] font-medium px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/55"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
