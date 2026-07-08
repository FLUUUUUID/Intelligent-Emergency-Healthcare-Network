import { useEffect, useRef } from 'react'

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260530_042513_df96a13b-6155-4f6e-8b93-c9dee66fba08.mp4'

const SENSITIVITY = 0.8

export default function VideoBackground() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const targetRef  = useRef(0)
  const prevXRef   = useRef<number | null>(null)
  const seekingRef = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onSeeked = () => {
      seekingRef.current = false
      const vid = videoRef.current
      if (!vid) return
      if (Math.abs(vid.currentTime - targetRef.current) > 0.02) {
        seekingRef.current = true
        vid.currentTime = targetRef.current
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (prevXRef.current === null) {
        prevXRef.current = e.clientX
        return
      }
      const vid = videoRef.current
      if (!vid || !vid.duration || isNaN(vid.duration)) return

      const delta = e.clientX - prevXRef.current
      prevXRef.current = e.clientX

      const offset = (delta / window.innerWidth) * SENSITIVITY * vid.duration
      targetRef.current = Math.max(0, Math.min(vid.duration, targetRef.current + offset))

      if (!seekingRef.current) {
        seekingRef.current = true
        vid.currentTime = targetRef.current
      }
    }

    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      video.removeEventListener('seeked', onSeeked)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={VIDEO_URL}
      muted
      playsInline
      preload="auto"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: '70% center',
        zIndex: 0,
      }}
    />
  )
}
