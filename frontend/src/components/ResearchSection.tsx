import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Award, BookOpen, Globe, Zap } from 'lucide-react'

const cards = [
  {
    icon: Award,
    title: "Master's Research",
    institution: 'Germany — M.Sc. Program',
    description:
      "Developed as part of postgraduate research exploring AI-driven approaches to emergency healthcare optimization in developing economies, with a focus on India's unique infrastructure.",
  },
  {
    icon: Zap,
    title: 'Data-Driven Architecture',
    institution: 'Evidence-Based Design',
    description:
      'All routing algorithms, capacity models, and prediction engines are built on real-world hospital utilization data from NITI Aayog, HMIS, and published emergency medicine studies.',
  },
  {
    icon: BookOpen,
    title: 'Publication Roadmap',
    institution: 'Upcoming Research',
    description:
      'Targeting IEEE, Elsevier, and Springer publications covering intelligent ambulance routing, ICU demand forecasting, and machine learning systems for emergency triage.',
  },
  {
    icon: Globe,
    title: 'Global Impact Focus',
    institution: 'India First, Global Vision',
    description:
      "Designed for India's unique healthcare topology — high-density cities, mixed infrastructure, resource constraints — with a long-term thesis for global scaling and adaptation.",
  },
]

const dataSources = [
  'India HMIS hospital utilization data',
  'NITI Aayog healthcare access reports',
  'Emergency response benchmarks (WHO)',
  'ICU demand & occupancy studies',
]

export default function ResearchSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="research" className="py-32 bg-[#060D18]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[11px] font-bold text-[#2563EB] uppercase tracking-widest mb-4">
              Research
            </p>
            <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em] mb-6">
              Designed for real-world{' '}
              <span className="gradient-text">healthcare impact.</span>
            </h2>
            <p className="text-[17px] text-white/55 leading-[1.7] mb-10">
              IEHN is not a concept project. It is grounded in clinical data, informed by field
              research, and architected for real deployment in Indian healthcare contexts.
            </p>
            <div className="space-y-3">
              {dataSources.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  </div>
                  <span className="text-[14px] text-white/60">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <div className="space-y-4">
            {cards.map((c, i) => {
              const Icon = c.icon
              return (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, x: 24 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.55, delay: i * 0.1 + 0.15 }}
                  className="flex gap-4 p-5 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 cursor-default group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-[#2563EB]/40 transition-colors">
                    <Icon className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-[14px] font-bold text-white">{c.title}</p>
                      <span className="text-white/20">·</span>
                      <span className="text-[12px] text-white/40">{c.institution}</span>
                    </div>
                    <p className="text-[13px] text-white/50 leading-relaxed">{c.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
