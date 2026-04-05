'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { Clip, getClip, getSolBalance, generateTxHash } from '@/lib/api'
import WalletConnect from '@/components/steps/WalletConnect'
import UploadStep from '@/components/steps/UploadStep'
import MetadataStep from '@/components/steps/MetadataStep'
import PipelineStep from '@/components/steps/PipelineStep'
import RarityReveal from '@/components/steps/RarityReveal'
import ConfirmedStep from '@/components/steps/ConfirmedStep'

type Step = 'wallet' | 'upload' | 'metadata' | 'pipeline' | 'reveal' | 'confirmed'

export default function Home() {
  const [step, setStep] = useState<Step>('wallet')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [clipId, setClipId] = useState<string | null>(null)
  const [clip, setClip] = useState<Clip | null>(null)
  const [vultrUrl, setVultrUrl] = useState<string | null>(null)
  const [uploadedFilename, setUploadedFilename] = useState<string>('')
  const [metadata, setMetadata] = useState({ title: '', location: '', category: 'Natural Event' })
  const [txHash, setTxHash] = useState<string | null>(null)
  const [solBalance, setSolBalance] = useState<number>(0)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  // SOL balance — uses real wallet when connected, backend fallback for demo wallet
  const fetchBal = useCallback(async () => {
    if (connected && publicKey) {
      try {
        const lamports = await connection.getBalance(publicKey)
        setSolBalance(lamports / 1e9)
        return
      } catch { /* fall through to backend */ }
    }
    getSolBalance().then(setSolBalance)
  }, [connected, publicKey, connection])

  useEffect(() => {
    fetchBal()
    const id = setInterval(fetchBal, 30000)
    return () => clearInterval(id)
  }, [fetchBal])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (id: string) => {
      stopPolling()
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await getClip(id)
          setClip(updated)
          if (updated.status === 'complete' || updated.status === 'error') {
            stopPolling()
            if (updated.status === 'complete') setStep('reveal')
          }
        } catch {
          /* ignore */
        }
      }, 2000)
    },
    [stopPolling]
  )

  useEffect(() => () => stopPolling(), [stopPolling])

  const stepNumber: Record<Step, number> = {
    wallet: 1,
    upload: 2,
    metadata: 3,
    pipeline: 4,
    reveal: 5,
    confirmed: 6,
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0b0b0f' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: '1px solid rgba(34,211,238,0.1)',
          backdropFilter: 'blur(14px)',
          backgroundColor: 'rgba(11,11,15,0.92)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 select-none">
            <img
              src="/logo.png"
              alt="Clipchain"
              style={{
                height: 32,
                width: 'auto',
                filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.55))',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-orbitron)',
                fontSize: '0.95rem',
                color: 'white',
                letterSpacing: '0.12em',
                fontWeight: 700,
              }}
            >
              CLIPCHAIN
            </span>
          </div>

          {/* Wallet info */}
          <div className="flex items-center gap-3">
            {walletAddress && (
              <span
                className="text-sm font-mono hidden sm:block"
                style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}
              >
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </span>
            )}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded select-none"
              style={{
                background: 'rgba(122,184,62,0.08)',
                border: '1px solid rgba(122,184,62,0.25)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: '#7ab83e', boxShadow: '0 0 4px #7ab83e' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontSize: '0.72rem',
                  color: '#7ab83e',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                }}
              >
                {solBalance.toFixed(4)} SOL
              </span>
            </div>
          </div>
        </div>

        {/* Step progress bar */}
        {step !== 'wallet' && (
          <div className="h-px" style={{ background: 'rgba(34,211,238,0.08)' }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                background: '#22d3ee',
                boxShadow: '0 0 6px rgba(34,211,238,0.5)',
                width: `${(stepNumber[step] / 6) * 100}%`,
              }}
            />
          </div>
        )}
      </header>

      {/* Wizard content */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          {step === 'wallet' && (
            <WalletConnect
              onConnect={(addr, balance) => {
                setWalletAddress(addr)
                setSolBalance(balance)
                setStep('upload')
              }}
            />
          )}

          {step === 'upload' && (
            <UploadStep
              walletAddress={walletAddress!}
              onUploaded={(url, filename) => {
                setVultrUrl(url)
                setUploadedFilename(filename)
                // Pre-fill metadata from filename
                const clean = filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
                setMetadata({ title: clean, location: '', category: 'Natural Event' })
                setStep('metadata')
              }}
            />
          )}

          {step === 'metadata' && (
            <MetadataStep
              filename={uploadedFilename}
              metadata={metadata}
              onChange={setMetadata}
              onSubmit={async () => {
                const { processClip: doProcess } = await import('@/lib/api')
                const { clipId: id } = await doProcess(vultrUrl!, uploadedFilename, walletAddress!)
                setClipId(id)
                const initial = await getClip(id)
                setClip(initial)
                setStep('pipeline')
                startPolling(id)
              }}
            />
          )}

          {step === 'pipeline' && (
            <PipelineStep clip={clip} filename={uploadedFilename} />
          )}

          {step === 'reveal' && clip && (
            <RarityReveal
              clip={clip}
              metadata={metadata}
              onClaim={() => {
                const hash = generateTxHash(clip.id)
                setTxHash(hash)
                // Optimistic credit — add bounty to displayed balance immediately
                setSolBalance(prev => prev + (clip.bountySOL ?? 0))
                setStep('confirmed')
              }}
            />
          )}

          {step === 'confirmed' && clip && (
            <ConfirmedStep
              clip={clip}
              txHash={txHash!}
              walletAddress={walletAddress!}
              onReset={() => {
                setStep('upload')
                setClipId(null)
                setClip(null)
                setVultrUrl(null)
                setTxHash(null)
              }}
            />
          )}
        </div>
      </main>
    </div>
  )
}
