import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { AlertCircle, Cpu, Building2, Truck } from 'lucide-react'

const steps = [
  {
    n: '01',
    icon: AlertCircle,
    title: 'Emergency Occurs',
    description: 'A distress call or IoT sensor event triggers the network. Patient vitals, location, and incident type are captured instantly.',
    details: ['Automatic dispatch initiation', 'GPS location lock', 'Severity classification'],
    color: '#EF4444',
  },
  {
    n: '02',
    icon: Cpu,
    title: 'AI Assessment',
    description: 'The AI engine cross-references severity with real-time hospital data, scoring every available facility within range.',
    details: ['Multi-variable scoring', 'Capacity modeling', 'Specialist matching'],
    color: '#2563EB',
  },
  {
    n: '03',
    icon: Building2,
    title: 'Hospital Recommendation',
    description: 'Within 1.8 seconds, the system surfaces the optimal hospital — chosen by readiness and clinical fit, not just proximity.',
    details: ['Ranked shortlist', 'Live bed count', 'Predicted wait time'],
    color: '#8B5CF6',
  },
  {
    n: '04',
    icon: Truck,
    title: 'Patient Transfer',
    description: 'The nearest available ambulance is dispatched on an optimized route. Hospital pre-notification ensures a team is ready on arrival.',
    details: ['Pre-alert to hospital', 'Family notification', 'Live ETA tracking'],
    color: '#10B981',
  },
]

export default function HowItWorks() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [active, setActive] = useState(0)

  return (
    <section id="how-it-works" className="py-32 bg-[#0B1220] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 25% 50%, #2563EB, transparent 55%), radial-gradient(ellipse at 75% 50%, #10B981, transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(to right,rgba(255,255,255,0.4) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.4) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
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
            How It Works
          </p>
          <h2 className="text-4xl lg:text-[3.2rem] font-bold text-white leading-[1.1] tracking-[-0.03em]">
            From emergency to care
            <br />
            <span className="text-white/30">in under 10 minutes.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon
            const isActive = active === i
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 + 0.2 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 cursor-default group ${
                  isActive
                    ? 'border-white/15 bg-white/[0.07]'
                    : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
                onMouseEnter={() => setActive(i)}
              >
                <div className="text-[11px] font-mono text-white/20 mb-4 tracking-widest">{s.n}</div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${s.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="text-[17px] font-bold text-white mb-3 tracking-tight">{s.title}</h3>
                <p className="text-[13px] text-white/45 leading-relaxed mb-5">{s.description}</p>
                <div className="space-y-1.5">
                  {s.details.map((d) => (
                    <div key={d} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color, opacity: 0.7 }} />
                      <span className="text-[12px] text-white/30">{d}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-8 h-px bg-white/5 rounded-full overflow-hidden"
        >
          <motion.div
            animate={{ width: `${((active + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#2563EB] to-[#10B981]"
          />
        </motion.div>
      </div>
    </section>
  )
}
