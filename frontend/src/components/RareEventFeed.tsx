'use client'

import { Clip } from '@/lib/api'

interface SeedEvent {
  name: string
  rarity: number
  sol: number
  color: string
}

const seedEvents: SeedEvent[] = [
  { name: 'Double lightning arc', rarity: 9.2, sol: 2.12, color: '#4a5e2a' },
  { name: 'Meteor over city', rarity: 8.5, sol: 1.81, color: '#5e4a1a' },
  { name: 'Double rainbow full arc', rarity: 7.8, sol: 1.44, color: '#1a3a5e' },
  { name: 'Dolphin pod beaching', rarity: 5.2, sol: 0.68, color: '#2a2a2a' },
]

interface FeedEntry {
  name: string
  rarity: number
  sol: number
  color: string
  isReal?: boolean
}

function RarityBar({ score, compact = false }: { score: number; compact?: boolean }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mt-1'}`}>
      <div className={`flex-1 h-1.5 bg-[#1c1f1a] rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full bg-[#7ab83e]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-[#9aaa8a] w-8 text-right flex-shrink-0">{score.toFixed(1)}</span>
    </div>
  )
}

function EventCard({ entry }: { entry: FeedEntry }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#2d3229] last:border-0">
      {/* Colored thumbnail */}
      <div
        className="w-14 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: entry.color }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <path d="M6.5 5.5L11 8L6.5 10.5V5.5Z" fill="rgba(255,255,255,0.7)" />
        </svg>
      </div>

      {/* Event info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{entry.name}</p>
        <RarityBar score={entry.rarity} compact />
      </div>

      {/* SOL value */}
      <div className="flex-shrink-0 text-right">
        <span className="text-sm font-bold text-[#7ab83e]">{entry.sol.toFixed(2)}</span>
        <p className="text-xs text-[#9aaa8a]">SOL</p>
      </div>
    </div>
  )
}

interface RareEventFeedProps {
  clips: Clip[]
}

export default function RareEventFeed({ clips }: RareEventFeedProps) {
  // Build feed entries from completed clips + seed data
  const completedClips = clips.filter((c) => c.status === 'complete' && c.rarityScore !== null)

  const liveEntries: FeedEntry[] = completedClips.map((c) => ({
    name: c.geminiAnalysis?.event_type || c.originalName || 'Unknown Event',
    rarity: c.rarityScore!,
    sol: c.bountySOL!,
    color: '#2a4a2a',
    isReal: true,
  }))

  // Combine: live entries first, then seed data
  const allEntries: FeedEntry[] = [...liveEntries, ...seedEvents]

  // Sort by rarity descending
  allEntries.sort((a, b) => b.rarity - a.rarity)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold tracking-widest text-[#9aaa8a] uppercase">
          Rare Event Feed
        </h2>
        <span className="text-xs text-[#9aaa8a]">{allEntries.length} events</span>
      </div>

      {/* Feed list */}
      <div className="bg-[#252822] border border-[#3a3f35] rounded-xl overflow-hidden">
        <div className="px-4 divide-y divide-[#2d3229]">
          {allEntries.map((entry, idx) => (
            <EventCard key={`${entry.name}-${idx}`} entry={entry} />
          ))}
        </div>

        {allEntries.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#9aaa8a]">No events yet. Upload a clip to get started.</p>
          </div>
        )}
      </div>

      {/* Bounty formula box */}
      <div className="bg-[#1a1d18] border border-[#3a3f35] rounded-xl p-4">
        <p className="text-xs text-[#9aaa8a] uppercase tracking-widest mb-2 font-semibold">
          Bounty Formula
        </p>
        <p className="font-mono text-sm text-white">
          SOL = rarity² × 0.025 × demand
        </p>
        <div className="mt-2 pt-2 border-t border-[#3a3f35] flex flex-col gap-1">
          <p className="text-xs text-[#9aaa8a]">
            <span className="text-white">rarity</span> — AI score from 0–10 (Gemini + TwelveLabs)
          </p>
          <p className="text-xs text-[#9aaa8a]">
            <span className="text-white">demand</span> — market coefficient (default 1.0)
          </p>
          <p className="text-xs text-[#9aaa8a] mt-1">
            Example: score 8.8 → 8.8² × 0.025 × 1.0 = <span className="text-[#7ab83e]">1.93 SOL</span>
          </p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-[#7ab83e] pulse-dot" />
        <span className="text-xs text-[#9aaa8a]">Live — updates as events are detected</span>
      </div>
    </div>
  )
}
