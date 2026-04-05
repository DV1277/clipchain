'use client'
import { useState, useRef, useCallback } from 'react'
import { getPresignedUrl, uploadClip } from '@/lib/api'

interface UploadStepProps {
  walletAddress: string
  onUploaded: (vultrUrl: string, filename: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadStep({ walletAddress, onUploaded }: UploadStepProps) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    setCurrentFile(file)
    setUploading(true)
    setProgress(0)
    setError(null)
    setStatusText('Getting upload URL...')
    try {
      let publicUrl: string
      try {
        setStatusText('Uploading to Vultr...')
        const { url: presignedUrl, publicUrl: pUrl } = await getPresignedUrl(file.name, file.type || 'video/mp4')
        publicUrl = pUrl
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)) }
          xhr.onload = () => { xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)) }
          xhr.onerror = () => reject(new Error('Network error during upload'))
          xhr.open('PUT', presignedUrl)
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
          xhr.setRequestHeader('x-amz-acl', 'public-read')
          xhr.send(file)
        })
        setStatusText('Storing to Vultr Object Storage...')
      } catch (presignErr) {
        console.warn('[UploadStep] Presign failed, falling back:', presignErr)
        setStatusText('Uploading via server...')
        const result = await uploadClip(file)
        const { getClip } = await import('@/lib/api')
        let vultrUrl: string | null = null
        for (let i = 0; i < 20; i++) {
          await new Promise(r => setTimeout(r, 1000))
          const clip = await getClip(result.clipId)
          if (clip.vultrUrl) { vultrUrl = clip.vultrUrl; break }
        }
        if (!vultrUrl) throw new Error('Could not get upload URL from server')
        publicUrl = vultrUrl
      }
      setProgress(100)
      setStatusText('Upload complete.')
      await new Promise(r => setTimeout(r, 400))
      onUploaded(publicUrl, file.name)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      setError(message)
      setUploading(false)
      setCurrentFile(null)
    }
  }, [onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      className="rounded-2xl p-9 flex flex-col gap-7"
      style={{ background: 'rgba(8,8,12,0.97)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)' }}
    >
      {/* Step header */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>
          UPLOAD CLIP
        </h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>
          STEP 02 / 06
        </span>
      </div>

      {uploading && currentFile ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.12)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="15" height="16" rx="2" stroke="#22d3ee" strokeWidth="1.5" />
              <path d="M17 9l5-3v12l-5-3V9Z" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-base text-white font-medium truncate">{currentFile.name}</p>
              <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{formatSize(currentFile.size)}</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}>
                {statusText.toUpperCase()}
              </span>
              <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: '#22d3ee' }}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-300" style={{ background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.5)', width: `${progress}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className="flex flex-col items-center gap-6 p-12 rounded-xl cursor-pointer transition-all"
          style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: dragging ? '#22d3ee' : 'rgba(34,211,238,0.2)', background: dragging ? 'rgba(34,211,238,0.04)' : 'transparent' }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-xl" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
            <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
              <path d="M36 32a8 8 0 0 0-8-16 12 12 0 0 0-12 12 8 8 0 0 0 0 16h20a8 8 0 0 0 0-16Z" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" />
              <path d="M24 28v-8M20 24l4-4 4 4" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center flex flex-col gap-2">
            <p className="text-base text-white">Drop a video clip or click to browse</p>
            <p style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.58rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.18em' }}>
              MP4 · MOV · MAX 500MB
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
