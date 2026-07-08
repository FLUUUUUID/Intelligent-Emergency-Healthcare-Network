import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Activity, MapPin, Cpu, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

// Illustrative command-center mockup using the real Gwalior network hospitals
const hospitals = [
  { name: 'JAH Jai Arogya', occupancy: 78, icu: 12, color: '#F59E0B' },
  { name: 'Kamla Raja', occupancy: 94, icu: 3, color: '#EF4444' },
  { name: 'Apollo Gwalior', occupancy: 62, icu: 11, color: '#10B981' },
  { name: 'Birla Hospital', occupancy: 85, icu: 6, color: '#F59E0B' },
]

const ambulances = [
  { id: 'AMB-01', eta: '3 min', dist: '1.2 km', active: true },
  { id: 'AMB-07', eta: '7 min', dist: '2.8 km', active: false },
  { id: 'AMB-12', eta: '11 min', dist: '4.1 km', active: false },
]

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
})

export default function Hero() {
  const [activeHosp, setActiveHosp] = useState(2)

  return (
    <section className="relative min-h-screen-safe bg-[#060D18] flex items-center overflow-hidden pt-16">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 40%, black 40%, transparent 100%)',
        }}
      />
      {/* Atmospheric glows */}
      <div className="absolute -top-40 -left-32 w-[720px] h-[720px] rounded-full bg-[#2563EB]/12 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[640px] h-[640px] rounded-full bg-[#10B981]/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[300px] rounded-full bg-[#2563EB]/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full py-20">
        <div className="grid lg:grid-cols-[1fr_1.08fr] gap-12 xl:gap-20 items-center">

          {/* LEFT */}
          <div>
            <motion.div {...fadeUp(0.05)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#2563EB]/25 bg-[#2563EB]/10 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[11px] font-semibold text-[#60A5FA] tracking-widest uppercase">
                AI-Powered Emergency Network
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.12)}
              className="text-[2.6rem] sm:text-[3.4rem] lg:text-[3.9rem] xl:text-[4.4rem] font-bold leading-[1.06] tracking-[-0.04em] text-white mb-6"
            >
              Emergency Care.{' '}
              <span className="gradient-text">
                Optimized by Intelligence.
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.22)} className="text-[17px] text-white/55 leading-[1.7] max-w-[500px] mb-10">
              An AI-powered network that routes patients, ambulances and hospitals
              together in real time — saving critical minutes when every second matters.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 mb-14">
              <Link
                to="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold text-white bg-[#2563EB] rounded-full hover:bg-[#1D4ED8] transition-all duration-200 cursor-pointer group shadow-[0_0_32px_rgba(37,99,235,0.35)] hover:shadow-[0_0_44px_rgba(37,99,235,0.5)]"
              >
                Launch Live Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#platform"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[13px] font-semibold text-white/80 border border-white/15 rounded-full hover:border-white/30 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                Explore Platform
              </a>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="flex gap-8 pt-8 border-t border-white/10">
              {[
                { v: '2.7M', l: 'Emergency visits / year' },
                { v: '40%', l: 'Preventable deaths' },
                { v: '<3 min', l: 'Target response time' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-[22px] font-bold text-white tracking-tight">{s.v}</div>
                  <div className="text-[11px] text-white/45 mt-0.5 leading-snug">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT: Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            {/* Floating card — top right */}
            <div className="animate-float absolute -top-5 -right-3 z-20 bg-[#0B1220]/95 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-white/10 min-w-[148px] shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                <span className="text-[11px] font-semibold text-white/50">Response Time</span>
              </div>
              <div className="text-[26px] font-bold text-white tracking-tight leading-none">
                4.2<span className="text-[13px] font-normal text-white/40 ml-1">min</span>
              </div>
              <div className="text-[11px] text-[#10B981] font-semibold mt-1">↓ 18% faster</div>
            </div>

            {/* Floating card — bottom left */}
            <div className="animate-float-delayed absolute -bottom-5 -left-3 z-20 bg-[#0B1220]/95 backdrop-blur-xl rounded-2xl px-4 py-3.5 border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
              <div className="text-[11px] text-white/50 font-medium mb-1">Hospitals Online</div>
              <div className="text-[26px] font-bold text-white tracking-tight leading-none mb-2">47</div>
              <div className="flex gap-[3px] items-end">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-[7px] rounded-sm"
                    style={{
                      height: `${10 + Math.abs(Math.sin(i * 0.9 + 1)) * 10}px`,
                      background: i < 9 ? '#10B981' : i < 11 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Main dashboard */}
            <div className="bg-[#0B1220] rounded-[20px] p-5 border border-white/10 relative overflow-hidden shadow-[0_0_80px_rgba(37,99,235,0.18),0_24px_64px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

              {/* Chrome */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                  </div>
                  <span className="text-[11px] text-white/25 font-mono ml-2">IEHN Command Center</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#10B981]/10 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[11px] text-[#10B981] font-bold tracking-wide">LIVE</span>
                </div>
              </div>

              {/* Emergency alert */}
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-3 mb-4 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest mb-0.5">Active Emergency</p>
                  <p className="text-[12px] text-white/45 truncate">Cardiac event · 45yo male · Maharaj Bada, Gwalior</p>
                </div>
                <div className="text-[12px] text-red-400 font-mono font-bold flex-shrink-0">02:47</div>
              </div>

              {/* Hospital capacity */}
              <div className="mb-4">
                <p className="text-[10px] text-white/25 uppercase tracking-[0.13em] font-semibold mb-3">
                  Hospital Capacity
                </p>
                <div className="space-y-2">
                  {hospitals.map((h, i) => (
                    <div
                      key={h.name}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${
                        activeHosp === i
                          ? 'bg-white/[0.07] ring-1 ring-white/10'
                          : 'hover:bg-white/[0.04]'
                      }`}
                      onClick={() => setActiveHosp(i)}
                    >
                      <div className="text-[12px] text-white/55 font-medium w-[105px] flex-shrink-0 truncate">{h.name}</div>
                      <div className="flex-1 h-[5px] bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${h.occupancy}%` }}
                          transition={{ duration: 1.3, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: h.color }}
                        />
                      </div>
                      <div className="text-[11px] text-white/35 w-8 text-right flex-shrink-0">{h.occupancy}%</div>
                      <div className="text-[11px] font-bold w-6 text-right flex-shrink-0" style={{ color: h.color }}>
                        {h.icu}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-1.5 gap-4">
                  <span className="text-[10px] text-white/15">% Occupancy</span>
                  <span className="text-[10px] text-white/15">ICU</span>
                </div>
              </div>

              {/* Ambulances */}
              <div className="mb-4">
                <p className="text-[10px] text-white/25 uppercase tracking-[0.13em] font-semibold mb-3">
                  Nearest Ambulances
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {ambulances.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 rounded-xl border ${
                        a.active
                          ? 'border-[#2563EB]/40 bg-[#2563EB]/10'
                          : 'border-white/5 bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1.5">
                        <MapPin className={`w-3 h-3 ${a.active ? 'text-[#60A5FA]' : 'text-white/20'}`} />
                        <span className="text-[10px] font-mono text-white/45">{a.id}</span>
                      </div>
                      <div className="text-[15px] font-bold text-white leading-none mb-0.5">{a.eta}</div>
                      <div className="text-[10px] text-white/25">{a.dist}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Rec */}
              <div className="bg-gradient-to-br from-[#2563EB]/12 to-[#10B981]/12 border border-[#2563EB]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-[#2563EB]/20 flex items-center justify-center">
                    <Cpu className="w-3 h-3 text-[#60A5FA]" />
                  </div>
                  <span className="text-[10px] font-bold text-[#60A5FA] uppercase tracking-widest">
                    AI Recommendation
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <p className="text-[14px] font-bold text-white">Route to Apollo Gwalior</p>
                </div>
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                  62% capacity · 11 ICU beds · 4.2 km · Est. 8 min · Cardiac specialist on duty
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex-1 h-1 rounded-full" style={{ background: '#10B981', opacity: 0.35 + i * 0.13 }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <Activity className="w-3 h-3 text-[#10B981]" />
                    <span className="text-[12px] font-bold text-[#10B981]">97.3%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-[10px] text-white/25 tracking-[0.2em] uppercase font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-6 bg-gradient-to-b from-white/25 to-transparent"
        />
      </motion.div>
    </section>
  )
}
