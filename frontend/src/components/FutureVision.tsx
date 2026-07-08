import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const milestones = [
  {
    year: '2026',
    title: 'Prototype',
    description:
      'Full-stack working prototype with AI routing engine, hospital capacity dashboard, and ambulance dispatch simulation tested on real Indian hospital data.',
    status: 'current',
  },
  {
    year: '2027',
    title: 'Pilot Deployments',
    description:
      'Partnership with 3–5 hospitals and ambulance networks for live pilot programs with real patient routing.',
    status: 'planned',
  },
  {
    year: '2028',
    title: 'Multi-City Rollout',
    description:
      'Expansion to 10 major Indian cities, integration with NHM infrastructure, and government MoU partnerships for subsidized deployment.',
    status: 'planned',
  },
  {
    year: '2030',
    title: 'National Network',
    description:
      "India's first AI-powered National Healthcare Intelligence Network — the unified operating layer for emergency care across all states.",
    status: 'vision',
  },
]

const statusStyle = {
  current: { label: '→ Active', color: '#60A5FA', bg: 'bg-blue-500/[0.08]', border: 'border-blue-500/20' },
  planned: { label: '◦ Planned', color: '#94A3B8', bg: 'bg-white/[0.03]', border: 'border-white/8' },
  vision: { label: '◇ Vision', color: '#34D399', bg: 'bg-emerald-500/[0.08]', border: 'border-emerald-500/20' },
}

export default function FutureVision() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="vision" className="py-32 bg-[#060D18]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="text-center mb-20 max-w-xl mx-auto"
        >
          <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
            Roadmap
          </p>
          <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-5">
            The operating system for
            <br />
            <span className="gradient-text">emergency healthcare.</span>
          </h2>
          <p className="text-[17px] text-white/55 leading-[1.7]">
            A four-year path from research prototype to national infrastructure.
          </p>
        </motion.div>

        {/* Desktop alternating timeline */}
        <div className="relative hidden lg:block">
          {/* Center line */}
          <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-white/8" />

          <div className="space-y-12">
            {milestones.map((m, i) => {
              const s = statusStyle[m.status as keyof typeof statusStyle]
              const isLeft = i % 2 === 0
              return (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.15 + 0.2 }}
                  className="flex items-center"
                >
                  {/* Left side */}
                  <div className="w-5/12">
                    {isLeft && (
                      <div className={`${s.bg} ${s.border} border rounded-2xl p-6 mr-10`}>
                        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>
                          {s.label}
                        </div>
                        <h3 className="text-[20px] font-bold text-white mb-2 tracking-tight">{m.title}</h3>
                        <p className="text-[14px] text-white/50 leading-relaxed">{m.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Year bubble */}
                  <div className="w-2/12 flex justify-center relative z-10">
                    <div
                      className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-[13px] font-bold border-2 shadow-md"
                      style={
                        m.status === 'current'
                          ? { background: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                          : m.status === 'vision'
                          ? { background: '#10B981', borderColor: '#10B981', color: '#fff' }
                          : { background: '#0B1220', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }
                      }
                    >
                      {m.year}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="w-5/12">
                    {!isLeft && (
                      <div className={`${s.bg} ${s.border} border rounded-2xl p-6 ml-10`}>
                        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>
                          {s.label}
                        </div>
                        <h3 className="text-[20px] font-bold text-white mb-2 tracking-tight">{m.title}</h3>
                        <p className="text-[14px] text-white/50 leading-relaxed">{m.description}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Mobile stacked */}
        <div className="lg:hidden space-y-4">
          {milestones.map((m, i) => {
            const s = statusStyle[m.status as keyof typeof statusStyle]
            return (
              <motion.div
                key={m.year}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 + 0.2 }}
                className={`${s.bg} ${s.border} border rounded-2xl p-5`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold border-2 flex-shrink-0"
                    style={
                      m.status === 'current'
                        ? { background: '#2563EB', borderColor: '#2563EB', color: '#fff' }
                        : m.status === 'vision'
                        ? { background: '#10B981', borderColor: '#10B981', color: '#fff' }
                        : { background: '#0B1220', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }
                    }
                  >
                    {m.year.slice(2)}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.color }}>
                      {s.label}
                    </div>
                    <h3 className="text-[16px] font-bold text-white tracking-tight">{m.title}</h3>
                  </div>
                </div>
                <p className="text-[13px] text-white/50 leading-relaxed">{m.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
