import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { Activity, ArrowRight, Home } from 'lucide-react'

/**
 * Branded fallback for router errors and unknown routes.
 * Used both as `errorElement` (crashes, 404 error responses) and as the
 * element of the `*` catch-all route (`notFound`).
 */
export default function ErrorPage({ notFound = false }: { notFound?: boolean }) {
  const error = useRouteError()
  const is404 = notFound || (isRouteErrorResponse(error) && error.status === 404)

  return (
    <div className="min-h-screen min-h-screen-safe bg-[#060D18] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Atmospheric glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[480px] rounded-full bg-[#2563EB]/10 blur-[130px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md">
        <div className="w-12 h-12 rounded-xl bg-[#2563EB] flex items-center justify-center mb-6 shadow-[0_0_32px_rgba(37,99,235,0.4)]">
          <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>

        <p className="text-[11px] font-bold text-[#60A5FA] uppercase tracking-widest mb-3">
          {is404 ? 'Error 404' : 'Unexpected error'}
        </p>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {is404 ? 'This route doesn’t exist.' : 'Something went off-route.'}
        </h1>
        <p className="text-[14px] text-white/55 leading-relaxed mb-8">
          {is404
            ? 'The page you’re looking for isn’t part of the network. The emergency demo, however, is fully operational.'
            : 'The app hit an unexpected error. Your best route from here is back to base — everything else is still operational.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[13px] font-semibold text-white bg-[#2563EB] rounded-full hover:bg-[#1D4ED8] transition-all duration-200 cursor-pointer shadow-[0_0_28px_rgba(37,99,235,0.35)]"
          >
            <Home className="w-4 h-4" /> Back to home
          </Link>
          <Link
            to="/demo"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[13px] font-semibold text-white/80 border border-white/15 rounded-full hover:border-white/30 hover:text-white hover:bg-white/5 transition-all duration-200 cursor-pointer"
          >
            Launch Live Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
