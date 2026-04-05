'use client'
import { useState } from 'react'

interface MetadataStepProps {
  filename: string
  metadata: { title: string; location: string; category: string }
  onChange: (m: { title: string; location: string; category: string }) => void
  onSubmit: () => Promise<void>
}

const CATEGORIES = ['Natural Event', 'Weather', 'Wildlife', 'Astronomical', 'Sports', 'Other']

const inputStyle = {
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(34,211,238,0.15)',
  borderRadius: 8,
  padding: '14px 18px',
  color: 'white',
  fontSize: '1rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--font-space-grotesk)',
} as React.CSSProperties

const labelStyle = {
  fontFamily: 'var(--font-orbitron)',
  fontSize: '0.62rem',
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.18em',
  display: 'block',
  marginBottom: 8,
} as React.CSSProperties

export default function MetadataStep({ filename, metadata, onChange, onSubmit }: MetadataStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-9 flex flex-col gap-7"
      style={{ background: 'rgba(8,8,12,0.97)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)' }}
    >
      {/* Step header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>
          CONFIRM DETAILS
        </h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>
          STEP 03 / 06
        </span>
      </div>

      {/* AI notice */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0 cursor-blink" style={{ backgroundColor: '#22d3ee', boxShadow: '0 0 4px #22d3ee' }} />
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.7)', letterSpacing: '0.12em' }}>
          AI PRE-FILLED FROM VIDEO ANALYSIS
        </span>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        <div>
          <label style={labelStyle}>TITLE</label>
          <input type="text" value={metadata.title} onChange={(e) => onChange({ ...metadata, title: e.target.value })} style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = '#22d3ee' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.15)' }} />
        </div>
        <div>
          <label style={labelStyle}>LOCATION</label>
          <input type="text" value={metadata.location} onChange={(e) => onChange({ ...metadata, location: e.target.value })} placeholder="GPS not found — add manually"
            style={{ ...inputStyle, color: metadata.location ? 'white' : 'rgba(255,255,255,0.3)' }}
            onFocus={(e) => { e.target.style.borderColor = '#22d3ee' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.15)' }} />
        </div>
        <div>
          <label style={labelStyle}>CATEGORY</label>
          <select value={metadata.category} onChange={(e) => onChange({ ...metadata, category: e.target.value })}
            style={{ ...inputStyle, appearance: 'none' }}
            onFocus={(e) => { e.target.style.borderColor = '#22d3ee' }} onBlur={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.15)' }}>
            {CATEGORIES.map((cat) => <option key={cat} value={cat} style={{ background: '#0b0b0f' }}>{cat}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl transition-opacity disabled:opacity-50"
        style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, color: '#0b0b0f', background: '#22d3ee', boxShadow: '0 0 20px rgba(34,211,238,0.25)' }}
      >
        {submitting ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#0b0b0f" strokeWidth="3" strokeOpacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="#0b0b0f" strokeWidth="3" strokeLinecap="round" />
            </svg>
            STARTING ANALYSIS...
          </>
        ) : 'SUBMIT FOR ANALYSIS'}
      </button>
    </div>
  )
}
