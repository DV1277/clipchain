'use client'

import { useState, useRef, useCallback } from 'react'
import { Clip, uploadClip, formatFileSize, formatUploadTime } from '@/lib/api'

interface UploadPanelProps {
  clip: Clip | null
  onUpload: (clipId: string) => void
}

function StatusRow({
  label,
  status,
}: {
  label: string
  status: 'pending' | 'done' | 'processing' | 'indexing' | 'error'
}) {
  const isDone = status === 'done'
  const isProcessing = status === 'processing' || status === 'indexing'
  const isError = status === 'error'
  const isPending = status === 'pending'

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        {/* Status dot */}
        {isDone && (
          <div className="w-4 h-4 rounded-full bg-[#7ab83e] flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {isProcessing && (
          <div className="w-4 h-4 rounded-full border-2 border-[#9aaa8a] pulse-dot" />
        )}
        {isError && (
          <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
        {isPending && (
          <div className="w-4 h-4 rounded-full border-2 border-[#3a3f35]" />
        )}
        <span className="text-sm text-white">{label}</span>
      </div>
      {/* Badge */}
      {isDone && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-[#2a3d10] text-[#7ab83e] font-medium border border-[#3a5a15]">
          done
        </span>
      )}
      {isProcessing && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-[#3d2a00] text-[#d97706] font-medium border border-[#5a3a00]">
          processing
        </span>
      )}
      {isError && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-red-900/40 text-red-400 font-medium border border-red-800">
          error
        </span>
      )}
      {isPending && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-[#1e2218] text-[#9aaa8a] font-medium border border-[#3a3f35]">
          pending
        </span>
      )}
    </div>
  )
}

function RarityBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, (score / 10) * 100))
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#9aaa8a]">Estimated rarity</span>
        <span className="text-sm font-semibold text-white">{score.toFixed(1)}/10</span>
      </div>
      <div className="w-full h-2 bg-[#1c1f1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[#7ab83e] rarity-bar-fill"
          style={{ '--target-width': `${pct}%`, width: `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

export default function UploadPanel({ clip, onUpload }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      // Validate
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
      const validExt = /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)
      if (!validTypes.includes(file.type) && !validExt) {
        setError('Please upload a video file (MP4, MOV, AVI, WebM)')
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        setError('File too large. Maximum size is 500MB.')
        return
      }

      setError(null)
      setIsUploading(true)
      setUploadProgress(10)

      try {
        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
          setUploadProgress((p) => Math.min(p + 5, 85))
        }, 300)

        const result = await uploadClip(file)
        clearInterval(progressInterval)
        setUploadProgress(100)
        onUpload(result.clipId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
      } finally {
        setIsUploading(false)
        setTimeout(() => setUploadProgress(0), 1000)
      }
    },
    [onUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // Map clip status to service statuses
  const getVultrStatus = () => {
    if (!clip) return 'pending'
    if (clip.vultrStatus === 'done') return 'done'
    if (clip.vultrStatus === 'error') return 'error'
    if (clip.status === 'uploading') return 'processing'
    return 'pending'
  }

  const getTwelvelabsStatus = () => {
    if (!clip) return 'pending'
    if (clip.twelvelabsStatus === 'done') return 'done'
    if (clip.twelvelabsStatus === 'error') return 'error'
    if (clip.twelvelabsStatus === 'indexing') return 'indexing'
    if (['stored', 'indexing', 'classifying', 'complete'].includes(clip.status)) return 'indexing'
    return 'pending'
  }

  const getGeminiStatus = () => {
    if (!clip) return 'pending'
    if (clip.geminiStatus === 'done') return 'done'
    if (clip.geminiStatus === 'error') return 'error'
    if (clip.geminiStatus === 'processing') return 'processing'
    if (['classifying', 'complete'].includes(clip.status)) return 'processing'
    return 'pending'
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold tracking-widest text-[#9aaa8a] uppercase">
        My Clips
      </h2>

      {/* Drop zone */}
      {!clip && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 text-center
            ${isDragging
              ? 'border-[#7ab83e] bg-[#7ab83e]/5'
              : 'border-[#3a3f35] hover:border-[#4a5a3a] hover:bg-[#252822]/60'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm,.mkv"
            className="hidden"
            onChange={handleInputChange}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#7ab83e] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white">Uploading...</p>
              <div className="w-full max-w-[160px] h-1.5 bg-[#1c1f1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7ab83e] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              {/* Upload icon */}
              <div className="flex justify-center mb-3">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  className={isDragging ? 'text-[#7ab83e]' : 'text-[#3a3f35]'}
                >
                  <rect width="40" height="40" rx="8" fill="currentColor" opacity="0.3" />
                  <path
                    d="M20 26V20M20 20L17 23M20 20L23 23"
                    stroke={isDragging ? '#7ab83e' : '#9aaa8a'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 28H26"
                    stroke={isDragging ? '#7ab83e' : '#9aaa8a'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-white mb-1">
                {isDragging ? 'Drop to upload' : 'Drag & drop video clip'}
              </p>
              <p className="text-xs text-[#9aaa8a]">MP4 · MOV · max 500MB</p>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Clip card */}
      {clip && (
        <div className="bg-[#252822] border border-[#3a3f35] rounded-xl overflow-hidden">
          {/* Clip header */}
          <div className="p-4 border-b border-[#3a3f35]">
            <div className="flex items-start gap-3">
              {/* Thumbnail placeholder */}
              <div className="w-16 h-12 bg-[#1c1f1a] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#3a3f35]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="#3a3f35" strokeWidth="1.5" />
                  <path d="M8 7.5L13 10L8 12.5V7.5Z" fill="#9aaa8a" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {clip.originalName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#9aaa8a]">
                    {formatUploadTime(clip.uploadedAt)}
                  </span>
                  <span className="text-[#3a3f35]">·</span>
                  <span className="text-xs text-[#9aaa8a]">
                    {formatFileSize(clip.size)}
                  </span>
                </div>
              </div>

              {/* Overall status indicator */}
              {clip.status === 'complete' ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-[#2a3d10] text-[#7ab83e] font-medium border border-[#3a5a15] flex-shrink-0">
                  complete
                </span>
              ) : clip.status === 'error' ? (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-900/40 text-red-400 font-medium border border-red-800 flex-shrink-0">
                  error
                </span>
              ) : (
                <div className="w-4 h-4 border-2 border-[#7ab83e] border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>

          {/* Status rows */}
          <div className="px-4 divide-y divide-[#2d3229]">
            <StatusRow label="Stored to Vultr" status={getVultrStatus()} />
            <StatusRow label="TwelveLabs indexing" status={getTwelvelabsStatus()} />
            <StatusRow label="Gemini classification" status={getGeminiStatus()} />
          </div>

          {/* Rarity score */}
          <div className="px-4 py-3 border-t border-[#3a3f35]">
            {clip.rarityScore !== null ? (
              <RarityBar score={clip.rarityScore} />
            ) : (
              <div className="mt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[#9aaa8a]">Estimated rarity</span>
                  <span className="text-xs text-[#9aaa8a]">analyzing...</span>
                </div>
                <div className="w-full h-2 bg-[#1c1f1a] rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-[#3a3f35] rounded-full animate-pulse" />
                </div>
              </div>
            )}

            {/* Event type from Gemini */}
            {clip.geminiAnalysis && (
              <div className="mt-2">
                <p className="text-xs text-[#7ab83e] font-medium">
                  {clip.geminiAnalysis.event_type}
                </p>
                <p className="text-xs text-[#9aaa8a] mt-0.5 line-clamp-2">
                  {clip.geminiAnalysis.description}
                </p>
              </div>
            )}
          </div>

          {/* SOL bounty bar */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: '#2a3d10' }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" fill="#7ab83e" opacity="0.3" />
                <path d="M4 7h6M7 4v6" stroke="#7ab83e" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-[#7ab83e] font-medium">
                {clip.bountySOL !== null
                  ? `Pending SOL bounty ~${clip.bountySOL.toFixed(2)} SOL`
                  : clip.status === 'complete'
                  ? 'Bounty queued'
                  : 'Pending SOL bounty...'}
              </span>
            </div>
            {clip.bountySOL !== null && (
              <span className="text-sm font-bold text-[#7ab83e] sol-value">
                {clip.bountySOL.toFixed(2)}
              </span>
            )}
          </div>

          {/* Error message */}
          {clip.errorMessage && (
            <div className="px-4 py-2 text-xs text-red-400 border-t border-[#3a3f35]">
              Error: {clip.errorMessage}
            </div>
          )}

          {/* Footer note */}
          <div className="px-4 py-2 border-t border-[#3a3f35]">
            <p className="text-xs text-[#9aaa8a]/60">
              Bounty queued — funds release on-chain when threshold reached
            </p>
          </div>

          {/* Upload another button */}
          {(clip.status === 'complete' || clip.status === 'error') && (
            <div className="px-4 pb-4">
              <button
                onClick={() => {
                  fileInputRef.current?.click()
                }}
                className="w-full py-2 text-xs text-[#9aaa8a] border border-[#3a3f35] rounded-lg hover:bg-[#2d3229] transition-colors"
              >
                Upload another clip
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm,.mkv"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
