'use client'
import { Clip } from '@/lib/api'

interface PipelineStepProps {
  clip: Clip | null
  filename: string
}

type PipelineStatus = 'pending' | 'in-progress' | 'done' | 'error'

function StatusIcon({ status }: { status: PipelineStatus }) {
  if (status === 'done') return (
    <div className="flex items-center justify-center w-8 h-8 rounded flex-shrink-0" style={{ background: 'rgba(122,184,62,0.15)', border: '1px solid rgba(122,184,62,0.4)' }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="#7ab83e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </div>
  )
  if (status === 'in-progress') return (
    <div className="w-8 h-8 rounded border-2 flex-shrink-0 animate-spin" style={{ borderColor: '#22d3ee', borderTopColor: 'transparent' }} />
  )
  if (status === 'error') return (
    <div className="flex items-center justify-center w-8 h-8 rounded flex-shrink-0" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </div>
  )
  return <div className="w-8 h-8 rounded flex-shrink-0" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
}

function StatusBadge({ status }: { status: PipelineStatus }) {
  const styles: Record<PipelineStatus, React.CSSProperties> = {
    done:         { background: 'rgba(122,184,62,0.1)',  color: '#7ab83e', border: '1px solid rgba(122,184,62,0.25)' },
    'in-progress':{ background: 'rgba(34,211,238,0.07)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' },
    error:        { background: 'rgba(248,113,113,0.08)',color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' },
    pending:      { background: 'rgba(255,255,255,0.04)',color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.08)' },
  }
  const labels: Record<PipelineStatus, string> = { done: 'DONE', 'in-progress': 'PROCESSING', error: 'ERROR', pending: 'PENDING' }
  return (
    <span className="px-2.5 py-1 rounded" style={{ ...styles[status], fontFamily: 'var(--font-orbitron)', fontSize: '0.55rem', letterSpacing: '0.12em' }}>
      {labels[status]}
    </span>
  )
}

function getStatus(raw: string | undefined | null, inProgressValue: string): PipelineStatus {
  if (!raw || raw === 'pending') return 'pending'
  if (raw === 'done') return 'done'
  if (raw === 'error') return 'error'
  return 'in-progress'
}

export default function PipelineStep({ clip, filename }: PipelineStepProps) {
  const vultrStatus: PipelineStatus = 'done'
  const twelvelabsStatus = getStatus(clip?.twelvelabsStatus, 'indexing')
  const geminiStatus = getStatus(clip?.geminiStatus, 'processing')
  const isComplete = clip?.status === 'complete'

  const steps = [
    { key: 'vultr',      label: 'VULTR OBJECT STORAGE',   sublabel: 'Clip stored in object storage',     status: vultrStatus },
    { key: 'twelvelabs', label: 'TWELVELABS VIDEO AI',     sublabel: 'Scene indexing & event detection',  status: twelvelabsStatus },
    { key: 'gemini',     label: 'GEMINI SCENE ANALYSIS',   sublabel: 'Rarity classification',             status: geminiStatus },
  ]

  return (
    <div
      className="rounded-2xl p-9 flex flex-col gap-7"
      style={{ background: 'rgba(8,8,12,0.97)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)' }}
    >
      {/* Step header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>ANALYZING CLIP</h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>STEP 04 / 06</span>
      </div>

      {/* Filename */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="9" height="12" rx="1.5" stroke="rgba(34,211,238,0.6)" strokeWidth="1.2" />
          <path d="M10 4l3 3-3 3" stroke="rgba(34,211,238,0.6)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-mono truncate" style={{ color: 'rgba(34,211,238,0.6)', letterSpacing: '0.04em' }}>{filename || 'video.mp4'}</span>
      </div>

      {/* Pipeline rows */}
      <div className="flex flex-col gap-0">
        {steps.map((step, idx) => (
          <div key={step.key} className="relative flex gap-4">
            {idx < steps.length - 1 && (
              <div className="absolute left-4 top-8 w-px" style={{ height: 'calc(100% - 4px)', background: step.status === 'done' ? 'rgba(122,184,62,0.4)' : 'rgba(255,255,255,0.07)', transition: 'background 0.5s ease' }} />
            )}
            <div className="flex gap-4 pb-7 flex-1">
              <StatusIcon status={step.status} />
              <div className="flex-1 flex items-start justify-between pt-1">
                <div>
                  <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.7rem', color: 'white', letterSpacing: '0.12em', fontWeight: 600 }}>{step.label}</p>
                  <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{step.sublabel}</p>
                </div>
                <StatusBadge status={step.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Complete banner */}
      {isComplete && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg" style={{ background: 'rgba(122,184,62,0.08)', border: '1px solid rgba(122,184,62,0.25)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#7ab83e" /><path d="M4.5 8L7 10.5L11.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: '#7ab83e', letterSpacing: '0.12em' }}>ANALYSIS COMPLETE — REVEALING RESULTS</span>
        </div>
      )}

      {/* Note */}
      <div className="px-4 py-3.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
          YOU CAN CLOSE THIS TAB — YOUR WALLET WILL BE NOTIFIED WHEN READY.
        </span>
      </div>
    </div>
  )
}
