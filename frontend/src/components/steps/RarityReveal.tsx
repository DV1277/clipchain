'use client'
import { useState, useEffect, useRef } from 'react'
import { Clip } from '@/lib/api'

interface RarityRevealProps {
  clip: Clip
  metadata: { title: string; category: string }
  onClaim: () => void
}

function getScoreColor(score: number): string {
  if (score >= 8.5) return '#7ab83e'
  if (score >= 7.5) return '#f97316'
  if (score >= 5)  return '#facc15'
  return '#9ca3af'
}

function useCountUp(target: number, duration = 1500): number {
  const [count, setCount] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  useEffect(() => {
    startRef.current = null
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * target * 10) / 10)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])
  return count
}

export default function RarityReveal({ clip, metadata, onClaim }: RarityRevealProps) {
  const score = clip.rarityScore ?? 0
  const bounty = clip.bountySOL ?? 0
  const displayScore = useCountUp(score)
  const isNFTEligible = score >= 8.5
  const scoreColor = getScoreColor(score)

  const gemini = clip.geminiAnalysis
  const eventType = gemini?.event_type || metadata.category || 'Unknown Event'
  const description = gemini?.description || 'AI analysis complete.'
  const tags = gemini?.tags || []

  return (
    <div
      className="rounded-2xl p-9 flex flex-col gap-7"
      style={{ background: 'rgba(8,8,12,0.97)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)' }}
    >
      {/* Step header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>RARITY SCORE</h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>STEP 05 / 06</span>
      </div>

      {/* Score */}
      <div className="flex flex-col items-center gap-4 py-4 score-reveal">
        <div className="flex items-end gap-2">
          <span
            className={`font-black tabular-nums leading-none ${isNFTEligible ? 'gold-shimmer' : ''}`}
            style={{ fontFamily: 'var(--font-orbitron)', fontSize: 'clamp(4.5rem, 16vw, 6.5rem)', color: scoreColor, textShadow: `0 0 40px ${scoreColor}55` }}
          >
            {displayScore.toFixed(1)}
          </span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>/10</span>
        </div>
        {isNFTEligible && (
          <div className="flex items-center gap-2 px-4 py-2 rounded" style={{ border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', boxShadow: '0 0 12px rgba(245,158,11,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', letterSpacing: '0.18em', fontWeight: 700 }}>NFT ELIGIBLE</span>
          </div>
        )}
      </div>

      {/* Event details */}
      <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.72rem', color: 'white', letterSpacing: '0.1em', fontWeight: 600 }}>
          {eventType.toUpperCase()}
        </p>
        <p className="text-base leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.45)' }}>{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {tags.slice(0, 5).map((tag: string) => (
              <span key={tag} className="px-2.5 py-1 rounded" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', color: 'rgba(34,211,238,0.7)', fontFamily: 'var(--font-orbitron)', fontSize: '0.52rem', letterSpacing: '0.1em' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bounty */}
      <div className="flex items-center justify-between p-5 rounded-xl" style={{ background: 'rgba(122,184,62,0.05)', border: '1px solid rgba(122,184,62,0.2)' }}>
        <div className="flex flex-col gap-1.5">
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em' }}>YOUR BOUNTY</span>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.9rem', fontWeight: 700, color: '#7ab83e', textShadow: '0 0 20px rgba(122,184,62,0.4)' }}>
            {bounty.toFixed(4)} SOL
          </span>
        </div>
        <span className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>{score}² × 0.025</span>
      </div>

      {/* Claim */}
      <button
        onClick={onClaim}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-5 rounded-xl transition-opacity"
        style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.8rem', letterSpacing: '0.15em', fontWeight: 700, color: '#0b0b0f', background: '#22d3ee', boxShadow: '0 0 24px rgba(34,211,238,0.3)' }}
      >
        CLAIM {bounty.toFixed(4)} SOL
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="#0b0b0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}
