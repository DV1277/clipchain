'use client'

import { useEffect, useRef } from 'react'
import { motion, MotionValue, useTransform } from 'framer-motion'

/* ── Matrix rain canvas ─────────────────────────────────── */
function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const cols = Math.floor(window.innerWidth / 18)
    const drops: number[] = Array(cols).fill(0)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%DELTASIGMAOMEGA'

    const draw = () => {
      ctx.fillStyle = 'rgba(11,11,15,0.055)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drops.forEach((y, i) => {
        const bright = Math.random() > 0.95
        ctx.fillStyle = bright ? 'rgba(34,211,238,0.6)' : 'rgba(59,130,246,0.35)'
        ctx.font = `${bright ? 'bold ' : ''}13px "Courier New", monospace`
        const ch = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillText(ch, i * 18, y * 18)

        if (y * 18 > canvas.height && Math.random() > 0.972) drops[i] = 0
        else drops[i] += 1
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.07 }}
    />
  )
}

/* ── Background glow orbs (far layer) ──────────────────── */
function GlowOrbs({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  const ox = useTransform(x, (v) => v * 0.012)
  const oy = useTransform(y, (v) => v * 0.012)

  const orbs = [
    { cx: '20%', cy: '30%', size: 500, color: '#3b82f6', opacity: 0.14, delay: 0 },
    { cx: '75%', cy: '60%', size: 420, color: '#8b5cf6', opacity: 0.12, delay: 1.5 },
    { cx: '50%', cy: '80%', size: 360, color: '#22d3ee', opacity: 0.09, delay: 0.8 },
  ]

  return (
    <>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: o.cx,
            top: o.cy,
            width: o.size,
            height: o.size,
            marginLeft: -o.size / 2,
            marginTop: -o.size / 2,
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            opacity: o.opacity,
            filter: 'blur(80px)',
            translateX: ox,
            translateY: oy,
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [o.opacity, o.opacity * 1.4, o.opacity] }}
          transition={{ duration: 7 + i * 2, repeat: Infinity, delay: o.delay, ease: 'easeInOut' }}
        />
      ))}
    </>
  )
}

/* ── Grid overlay (mid layer) ────────────────────────────── */
function GridOverlay({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  const gx = useTransform(x, (v) => v * 0.025)
  const gy = useTransform(y, (v) => v * 0.025)

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        translateX: gx,
        translateY: gy,
        backgroundImage: `
          linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }}
    />
  )
}

/* ── Particle dots (scattered depth) ───────────────────── */
const PARTICLE_COUNT = 28
const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: `${(i * 37 + 7) % 100}%`,
  top: `${(i * 53 + 13) % 100}%`,
  size: (i % 4) * 0.6 + 1.5,
  depth: 0.02 + (i % 5) * 0.012,
  delay: (i % 7) * 0.6,
  color: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#8b5cf6' : '#3b82f6',
}))

function Particles({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  return (
    <>
      {particles.map((p) => (
        <ParticleDot key={p.id} p={p} x={x} y={y} />
      ))}
    </>
  )
}

function ParticleDot({
  p,
  x,
  y,
}: {
  p: (typeof particles)[number]
  x: MotionValue<number>
  y: MotionValue<number>
}) {
  const px = useTransform(x, (v) => v * p.depth)
  const py = useTransform(y, (v) => v * p.depth)

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: p.left,
        top: p.top,
        width: p.size,
        height: p.size,
        backgroundColor: p.color,
        translateX: px,
        translateY: py,
        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
      }}
      animate={{ opacity: [0.3, 0.9, 0.3] }}
      transition={{
        duration: 3 + (p.id % 3),
        repeat: Infinity,
        delay: p.delay,
        ease: 'easeInOut',
      }}
    />
  )
}

/* ── Exports ─────────────────────────────────────────────── */
export { MatrixRain, GlowOrbs, GridOverlay, Particles }
