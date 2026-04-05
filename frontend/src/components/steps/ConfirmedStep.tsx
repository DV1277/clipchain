'use client'
import { useState } from 'react'
import { Clip } from '@/lib/api'

interface ConfirmedStepProps {
  clip: Clip
  txHash: string
  walletAddress: string
  onReset: () => void
}

function AnimatedCheckmark() {
  return (
    <div className="flex items-center justify-center w-18 h-18 rounded-xl" style={{ width: 72, height: 72, background: 'rgba(122,184,62,0.08)', border: '1px solid rgba(122,184,62,0.25)' }}>
      <svg width="44" height="44" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="30" stroke="#7ab83e" strokeWidth="3" strokeLinecap="round"
          style={{ strokeDasharray: 188, strokeDashoffset: 0, animation: 'checkmark-draw 0.8s ease-out forwards' }} />
        <path d="M24 40L35 52L56 28" stroke="#7ab83e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: 'checkmark-draw 0.5s 0.5s ease-out forwards' }} />
      </svg>
    </div>
  )
}

export default function ConfirmedStep({ clip, txHash, walletAddress, onReset }: ConfirmedStepProps) {
  const [copied, setCopied] = useState(false)
  const shortHash = txHash ? `${txHash.slice(0, 8)}...${txHash.slice(-8)}` : ''
  const shortWallet = walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : ''

  const copyHash = () => {
    navigator.clipboard.writeText(txHash).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
  }

  return (
    <div
      className="rounded-2xl p-9 flex flex-col items-center gap-7"
      style={{ background: 'rgba(8,8,12,0.97)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)' }}
    >
      {/* Step header */}
      <div className="w-full flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>BOUNTY CONFIRMED</h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>STEP 06 / 06</span>
      </div>

      <AnimatedCheckmark />

      {/* Amount */}
      <div className="text-center flex flex-col gap-1.5">
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em' }}>BOUNTY PAID</span>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '2.4rem', fontWeight: 700, color: '#7ab83e', textShadow: '0 0 24px rgba(122,184,62,0.5)' }}>
          {clip.bountySOL?.toFixed(4) ?? '0.0000'} SOL
        </span>
      </div>

      {/* Transaction */}
      <div className="w-full flex flex-col gap-3 p-5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em' }}>TRANSACTION</span>
        <div className="flex items-center gap-3">
          <span className="flex-1 text-sm font-mono text-white truncate" style={{ letterSpacing: '0.03em' }}>{shortHash}</span>
          <button onClick={copyHash} className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0"
            style={{ background: copied ? 'rgba(122,184,62,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(122,184,62,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
            {copied
              ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#7ab83e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="9" rx="1" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" /><path d="M2 9.5V2.5A1 1 0 0 1 3 1.5H10" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" /></svg>
            }
          </button>
          <a href={`https://explorer.solana.com/tx/${txHash}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.55rem', color: '#22d3ee', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
            VIEW ON EXPLORER
          </a>
        </div>
      </div>

      {/* Paid to */}
      <div className="w-full flex items-center justify-between px-5 py-3.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.18em' }}>PAID TO</span>
        <span className="text-base font-mono text-white" style={{ letterSpacing: '0.04em' }}>{shortWallet}</span>
      </div>

      {/* Stats */}
      <div className="w-full grid grid-cols-3 gap-3">
        {[
          { label: 'RARITY SCORE', value: `${clip.rarityScore ?? '—'}/10` },
          { label: 'PROCESSING',   value: '~12S' },
          { label: 'NETWORK',      value: 'SOLANA' },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textAlign: 'center' }}>{label}</span>
            <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.82rem', color: 'white', fontWeight: 700, letterSpacing: '0.06em' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="w-full px-6 py-4 rounded-xl transition-all"
        style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.72rem', letterSpacing: '0.15em', fontWeight: 700, color: 'rgba(34,211,238,0.8)', background: 'transparent', border: '1px solid rgba(34,211,238,0.25)' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.5)'; e.currentTarget.style.color = '#22d3ee' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.25)'; e.currentTarget.style.color = 'rgba(34,211,238,0.8)' }}
      >
        SUBMIT ANOTHER CLIP
      </button>
    </div>
  )
}
