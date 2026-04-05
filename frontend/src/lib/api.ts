const API_BASE = 'http://localhost:3001/api'

export interface Clip {
  id: string
  filename: string
  originalName: string
  size: number
  uploadedAt: string
  filePath: string
  vultrUrl: string | null
  vultrStatus: 'pending' | 'done' | 'error'
  twelvelabsTaskId: string | null
  twelvelabsVideoId: string | null
  twelvelabsStatus: 'pending' | 'indexing' | 'done' | 'error'
  geminiStatus: 'pending' | 'processing' | 'done' | 'error'
  twelvelabsAnalysis: {
    topics: string[]
    title: string
    confidence: number
  } | null
  geminiAnalysis: {
    event_type: string
    description: string
    rarity_score: number
    tags: string[]
    confidence: number
  } | null
  rarityScore: number | null
  bountySOL: number | null
  status: 'uploading' | 'stored' | 'indexing' | 'classifying' | 'complete' | 'error'
  errorMessage: string | null
}

export async function uploadClip(file: File): Promise<{ clipId: string; status: string }> {
  const formData = new FormData()
  formData.append('video', file)

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }

  return response.json()
}

export async function getClip(id: string): Promise<Clip> {
  const response = await fetch(`${API_BASE}/clips/${id}`)

  if (!response.ok) {
    throw new Error('Clip not found')
  }

  return response.json()
}

export async function getAllClips(): Promise<Clip[]> {
  const response = await fetch(`${API_BASE}/clips`)

  if (!response.ok) {
    throw new Error('Failed to fetch clips')
  }

  return response.json()
}

export async function getSolBalance(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/solana/balance`)
    if (!response.ok) return 0
    const data = await response.json()
    return data.balance ?? 0
  } catch {
    return 0
  }
}

export async function getPresignedUrl(filename: string, contentType: string): Promise<{ url: string; key: string; publicUrl: string }> {
  const params = new URLSearchParams({ filename, contentType })
  const response = await fetch(`${API_BASE}/presign?${params}`)
  if (!response.ok) throw new Error('Failed to get presigned URL')
  return response.json()
}

export async function processClip(vultrUrl: string, filename: string, walletAddress: string): Promise<{ clipId: string; status: string }> {
  const response = await fetch(`${API_BASE}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vultrUrl, filename, walletAddress }),
  })
  if (!response.ok) throw new Error('Failed to start processing')
  return response.json()
}

export function generateTxHash(clipId: string): string {
  // Generate deterministic-looking Solana tx hash from clip ID
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let hash = ''
  let seed = clipId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  for (let i = 0; i < 88; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff
    hash += chars[Math.abs(seed) % chars.length]
  }
  return hash
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatUploadTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
