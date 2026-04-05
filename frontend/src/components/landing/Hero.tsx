'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { MatrixRain, GlowOrbs, GridOverlay, Particles } from './FloatingElements'

/* ── Waveform heights (stable, no Math.random in render) ── */
const WAVEFORM = [14, 26, 10, 32, 18, 36, 12, 28, 8, 22, 30, 16]

/* ── Terminal analysis panel (right "image") ──────────────── */
function ClipAnalysisPanel() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* Outer glow */}
      <div
        className="absolute -inset-6 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
      />

      {/* Panel */}
      <div
        className="scanlines relative rounded-xl overflow-hidden"
        style={{
          background: 'rgba(8,8,12,0.97)',
          border: '1px solid rgba(34,211,238,0.2)',
          boxShadow:
            '0 0 0 1px rgba(34,211,238,0.08), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(34,211,238,0.1)',
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            borderBottom: '1px solid rgba(34,211,238,0.12)',
            background: 'rgba(34,211,238,0.04)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: '0.6rem',
              color: '#22d3ee',
              letterSpacing: '0.2em',
            }}
          >
            CLIPCHAIN // NEURAL ENGINE v2.1
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full cursor-blink"
              style={{ backgroundColor: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }}
            />
            <span
              style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '0.55rem',
                color: 'rgba(34,211,238,0.7)',
                letterSpacing: '0.15em',
              }}
            >
              LIVE
            </span>
          </span>
        </div>

        {/* Video frame */}
        <div className="px-4 pt-4">
          <div
            className="relative"
            style={{
              height: 148,
              background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(34,211,238,0.1)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {/* Grid */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            {/* Scan line */}
            <motion.div
              className="absolute left-0 right-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(34,211,238,0.8), transparent)',
              }}
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
            {/* Corner markers */}
            {[
              'top-2 left-2 border-t border-l',
              'top-2 right-2 border-t border-r',
              'bottom-2 left-2 border-b border-l',
              'bottom-2 right-2 border-b border-r',
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute ${cls} w-3.5 h-3.5`}
                style={{ borderColor: 'rgba(34,211,238,0.45)' }}
              />
            ))}
            {/* Waveform visualiser */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: 'rgba(34,211,238,0.55)',
                  letterSpacing: '0.2em',
                }}
              >
                ANALYZING CLIP
              </span>
              <div className="flex items-end gap-0.5">
                {WAVEFORM.map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-sm"
                    style={{ height: h, backgroundColor: '#22d3ee', opacity: 0.65 }}
                    animate={{ height: [h, h * 0.4, h] }}
                    transition={{
                      duration: 0.8 + (i % 4) * 0.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.06,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
          {/* Rarity */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.15em',
                }}
              >
                RARITY INDEX
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: '#22d3ee',
                }}
              >
                8.4 / 10
              </span>
            </div>
            <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: '84%' }}
                transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.15em',
                }}
              >
                AI CONFIDENCE
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: '#3b82f6',
                }}
              >
                0.91
              </span>
            </div>
            <div className="h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#3b82f6', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
                initial={{ width: 0 }}
                animate={{ width: '91%' }}
                transition={{ duration: 1.6, delay: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(34,211,238,0.08)' }} />

          {/* Bounty */}
          <div className="flex items-center justify-between">
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.15em',
                  marginBottom: 5,
                }}
              >
                CALCULATED BOUNTY
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '1.3rem',
                  color: '#7ab83e',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textShadow: '0 0 20px rgba(122,184,62,0.5)',
                }}
              >
                1.760 SOL
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded"
              style={{
                border: '1px solid rgba(122,184,62,0.35)',
                background: 'rgba(122,184,62,0.07)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.5rem',
                  color: '#7ab83e',
                  letterSpacing: '0.12em',
                }}
              >
                READY TO CLAIM
              </span>
            </div>
          </div>

          {/* Pipeline status */}
          <div style={{ borderTop: '1px solid rgba(34,211,238,0.08)', paddingTop: 12 }}>
            <div className="flex items-center gap-2">
              <span
                className="w-1.5 h-1.5 rounded-full cursor-blink flex-shrink-0"
                style={{ backgroundColor: '#22d3ee', boxShadow: '0 0 4px #22d3ee' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.55rem',
                  color: 'rgba(34,211,238,0.7)',
                  letterSpacing: '0.12em',
                }}
              >
                PIPELINE: INDEXING COMPLETE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main Hero component ────────────────────────────────── */
export default function Hero() {
  const router = useRouter()

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const x = useSpring(rawX, { stiffness: 38, damping: 18, mass: 0.8 })
  const y = useSpring(rawY, { stiffness: 38, damping: 18, mass: 0.8 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      rawX.set(e.clientX - window.innerWidth / 2)
      rawY.set(e.clientY - window.innerHeight / 2)
    }
    window.addEventListener('mousemove', handleMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMove)
  }, [rawX, rawY])

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0b0b0f' }}>

      {/* ── Navbar ────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-8 py-4"
        style={{
          borderBottom: '1px solid rgba(34,211,238,0.1)',
          backdropFilter: 'blur(14px)',
          backgroundColor: 'rgba(11,11,15,0.88)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 select-none">
          <img
            src="/logo.png"
            alt="Clipchain"
            style={{
              height: 36,
              width: 'auto',
              filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.55))',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-orbitron)',
              fontSize: '0.82rem',
              color: 'white',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            CLIPCHAIN
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {['HOW IT WORKS', 'ABOUT', 'DOCS'].map((label) => (
            <span
              key={label}
              className="cursor-pointer"
              style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '0.58rem',
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.15em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(34,211,238,0.8)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Launch App */}
        <motion.button
          onClick={() => router.push('/app')}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex items-center gap-2 px-5 py-2 rounded"
          style={{
            fontFamily: 'var(--font-orbitron)',
            fontSize: '0.62rem',
            letterSpacing: '0.15em',
            fontWeight: 700,
            color: '#0b0b0f',
            background: '#22d3ee',
            boxShadow: '0 0 20px rgba(34,211,238,0.3)',
          }}
        >
          LAUNCH APP
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="#0b0b0f"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </nav>

      {/* ── Main ──────────────────────────────────────────── */}
      <main className="flex-1 relative flex items-center overflow-hidden">
        {/* Background effects (parallax) */}
        <MatrixRain />
        <GlowOrbs x={x} y={y} />
        <GridOverlay x={x} y={y} />
        <Particles x={x} y={y} />

        {/* Top / bottom fade */}
        <div
          className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, #0b0b0f, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #0b0b0f, transparent)' }}
        />

        {/* Two-column content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-8 py-16 flex flex-col lg:flex-row items-center gap-16 lg:gap-12">

          {/* Left: text */}
          <div className="flex-1 flex flex-col gap-7">

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <div className="w-6 h-px" style={{ backgroundColor: '#22d3ee' }} />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.58rem',
                  color: '#22d3ee',
                  letterSpacing: '0.22em',
                }}
              >
                SOLANA NATIVE // AI-POWERED
              </span>
            </motion.div>

            {/* Headline with glitch */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-1 select-none"
            >
              <h1
                className="glitch leading-none"
                data-text="CAPTURE THE"
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: 'clamp(2.4rem, 5vw, 4.8rem)',
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.01em',
                }}
              >
                CAPTURE THE
              </h1>
              <h1
                className="glitch leading-none"
                data-text="UNCHAINABLE."
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: 'clamp(2.4rem, 5vw, 4.8rem)',
                  fontWeight: 900,
                  color: '#22d3ee',
                  letterSpacing: '-0.01em',
                  textShadow: '0 0 40px rgba(34,211,238,0.35)',
                }}
              >
                UNCHAINABLE.
              </h1>
            </motion.div>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.8 }}
              className="max-w-sm leading-relaxed"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'rgba(255,255,255,0.42)',
                fontSize: '1rem',
              }}
            >
              Upload your footage. AI detects rare events in real time.
              Solana pays the bounty. Automatically. No middlemen.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="flex items-center gap-10 pt-1"
            >
              {[
                { label: 'CLIPS PROCESSED', value: '482' },
                { label: 'SOL PAID OUT', value: '23.4' },
                { label: 'ACTIVE HUNTERS', value: '142' },
              ].map(({ label, value }, i) => (
                <div key={label} className="flex items-center gap-10">
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-orbitron)',
                        fontSize: 'clamp(1.2rem, 2.5vw, 1.6rem)',
                        color: 'white',
                        fontWeight: 700,
                      }}
                    >
                      {value}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-orbitron)',
                        fontSize: '0.48rem',
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.14em',
                        marginTop: 3,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                  {i < 2 && (
                    <div className="w-px h-8" style={{ backgroundColor: 'rgba(34,211,238,0.15)' }} />
                  )}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: terminal panel */}
          <motion.div
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex justify-center lg:justify-end"
          >
            <ClipAnalysisPanel />
          </motion.div>
        </div>
      </main>

    </div>
  )
}
