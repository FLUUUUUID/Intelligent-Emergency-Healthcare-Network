import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const partners = [
  'AIIMS India', 'Ministry of Health', 'NITI Aayog', 'IIT Delhi',
  'Apollo Hospitals', 'Fortis Healthcare', 'ICMR', 'WHO India',
  'Medanta', 'Max Healthcare', 'Narayana Health', 'NHM India',
]

const categories = ['Hospitals', 'Ambulance Networks', 'Government Agencies', 'Research Institutions']

export default function TrustSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="trust" className="py-24 bg-[#060D18] border-t border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-3">
            Built for the future of emergency healthcare
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Designed with{' '}
            <span className="gradient-text">healthcare institutions</span>{' '}
            in mind
          </h2>
        </motion.div>

        {/* Marquee */}
        <div className="relative mb-10">
          <div className="absolute left-0 top-0 w-24 sm:w-40 h-full z-10 bg-gradient-to-r from-[#060D18] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 w-24 sm:w-40 h-full z-10 bg-gradient-to-l from-[#060D18] to-transparent pointer-events-none" />
          <div className="overflow-hidden">
            <div className="flex gap-3 animate-marquee w-max">
              {[...partners, ...partners].map((p, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 px-5 py-2.5 bg-white/[0.04] rounded-full border border-white/10 text-[13px] font-medium text-white/60 whitespace-nowrap"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-3"
        >
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/10 rounded-full cursor-default"
            >
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-[13px] font-medium text-white/80">{cat}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
