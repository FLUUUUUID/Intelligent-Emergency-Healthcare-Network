import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Brain, TrendingUp, Map, Eye, Wifi, Cloud, Cpu, Activity } from 'lucide-react'

const technologies = [
  { icon: Brain, name: 'Artificial Intelligence', description: 'Neural networks for clinical decision support and routing', color: '#2563EB', tag: 'Core' },
  { icon: TrendingUp, name: 'Machine Learning', description: 'Supervised & unsupervised models trained on real patient flow data', color: '#8B5CF6', tag: 'Core' },
  { icon: Activity, name: 'Predictive Analytics', description: 'Time-series forecasting for ICU demand and hospital overload', color: '#10B981', tag: 'Core' },
  { icon: Map, name: 'GIS Mapping', description: 'Geospatial intelligence and dynamic ambulance route optimization', color: '#F59E0B', tag: 'Infrastructure' },
  { icon: Eye, name: 'Computer Vision', description: 'Automated trauma severity assessment from imaging and video', color: '#EF4444', tag: 'Future' },
  { icon: Wifi, name: 'IoT Integration', description: 'Real-time sensor telemetry from ambulances, wards, and devices', color: '#06B6D4', tag: 'Infrastructure' },
  { icon: Cloud, name: 'Cloud Infrastructure', description: 'Scalable, HIPAA-aware multi-region cloud deployment', color: '#64748B', tag: 'Infrastructure' },
  { icon: Cpu, name: 'ROS2 Integration', description: 'Autonomous robotic emergency response systems (roadmap)', color: '#7C3AED', tag: 'Future' },
]

const tagColors: Record<string, string> = {
  Core: '#2563EB',
  Infrastructure: '#10B981',
  Future: '#8B5CF6',
}

export default function TechnologySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="technology" className="py-32 bg-[#0B1220] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% -20%, #2563EB 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-16"
        >
          <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
            Technology
          </p>
          <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em]">
            Built on the frontier
            <br />
            <span className="text-white/30">of intelligent systems.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {technologies.map((t, i) => {
            const Icon = t.icon
            return (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.07 + 0.15 }}
                className="group p-5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 cursor-default"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${t.color}18` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: tagColors[t.tag],
                      background: `${tagColors[t.tag]}18`,
                    }}
                  >
                    {t.tag}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold text-white mb-2 tracking-tight">{t.name}</h3>
                <p className="text-[12px] text-white/35 leading-relaxed">{t.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
