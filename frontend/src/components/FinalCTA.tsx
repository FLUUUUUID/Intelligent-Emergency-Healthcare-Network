import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, ExternalLink } from 'lucide-react'

export default function FinalCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="contact" className="py-36 bg-[#0B1220] relative overflow-hidden">
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 50% -10%, rgba(37,99,235,0.3) 0%, transparent 65%)',
        }}
      />
      {/* Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(to right,rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(to bottom,rgba(255,255,255,0.5) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[11px] font-semibold text-white/50 tracking-widest uppercase">
              Open to Collaboration
            </span>
          </div>

          <h2 className="text-[2.8rem] sm:text-[3.5rem] lg:text-[4rem] font-bold text-white leading-[1.06] tracking-[-0.04em] mb-6">
            Help build the future of
            <br />
            <span className="text-white/30">emergency healthcare.</span>
          </h2>

          <p className="text-[17px] text-white/45 leading-[1.7] mb-12 max-w-lg mx-auto">
            Whether you are a hospital system, ambulance network, government body,
            researcher, or investor — there's a meaningful role in this network.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:anant1000028304@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 text-[14px] font-semibold text-[#0B1220] bg-white rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer group shadow-lg"
            >
              Join Research
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="mailto:anant1000028304@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 text-[14px] font-semibold text-white border border-white/20 rounded-full hover:border-white/40 hover:bg-white/5 transition-all duration-200 cursor-pointer"
            >
              Contact Us
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
