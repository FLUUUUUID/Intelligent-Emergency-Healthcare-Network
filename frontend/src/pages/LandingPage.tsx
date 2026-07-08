import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import TrustSection from '../components/TrustSection'
import ProblemSection from '../components/ProblemSection'
import PlatformSection from '../components/PlatformSection'
import HowItWorks from '../components/HowItWorks'
import ResearchSection from '../components/ResearchSection'
import TechnologySection from '../components/TechnologySection'
import FutureVision from '../components/FutureVision'
import FinalCTA from '../components/FinalCTA'
import Footer from '../components/Footer'

export default function LandingPage() {
  // React Router doesn't scroll to #hash targets on initial load (content
  // mounts after the browser's native anchor jump) — do it once things exist.
  useEffect(() => {
    const { hash } = window.location
    if (!hash) return
    const t = setTimeout(() => {
      document.querySelector(hash)?.scrollIntoView({ block: 'start' })
    }, 150)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <TrustSection />
      <ProblemSection />
      <PlatformSection />
      <HowItWorks />
      <ResearchSection />
      <TechnologySection />
      <FutureVision />
      <FinalCTA />
      <Footer />
    </div>
  )
}
