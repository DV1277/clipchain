'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import { PublicKey } from '@solana/web3.js'

const DEMO_WALLET = '2Rw2mk3x559JRpJGwL1nMvTjGfVTd2MAunVqoMh5dPMM'

interface WalletConnectProps {
  onConnect: (address: string, balance: number) => void
}

async function fetchBalance(
  connection: ReturnType<typeof useConnection>['connection'],
  pubkey: PublicKey
): Promise<number> {
  try {
    const lamports = await connection.getBalance(pubkey)
    return lamports / 1e9
  } catch {
    return 0
  }
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const { select, connect, connected, publicKey, wallets, connecting: adapterConnecting } = useWallet()
  const { connection } = useConnection()
  const [pendingWallet, setPendingWallet] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!connected || !publicKey || !pendingWallet) return
    fetchBalance(connection, publicKey).then((balance) => {
      setPendingWallet(null)
      onConnect(publicKey.toBase58(), balance)
    })
  }, [connected, publicKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const isInstalled = (name: string) => {
    const adapter = wallets.find((w) => w.adapter.name === name)
    return (
      adapter?.readyState === WalletReadyState.Installed ||
      adapter?.readyState === WalletReadyState.Loadable
    )
  }

  const handleConnect = async (walletName: 'Phantom' | 'Solflare') => {
    setError(null)
    if (!isInstalled(walletName)) {
      setPendingWallet('demo')
      await new Promise((r) => setTimeout(r, 1200))
      try {
        const demoKey = new PublicKey(DEMO_WALLET)
        const balance = await fetchBalance(connection, demoKey)
        setPendingWallet(null)
        onConnect(DEMO_WALLET, balance)
      } catch {
        setPendingWallet(null)
        onConnect(DEMO_WALLET, 0)
      }
      return
    }
    try {
      setPendingWallet(walletName)
      select(walletName as Parameters<typeof select>[0])
      await connect()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[WalletConnect] ${walletName} rejected:`, msg)
      setError(`${walletName} cancelled. Connecting demo wallet...`)
      await new Promise((r) => setTimeout(r, 1000))
      try {
        const demoKey = new PublicKey(DEMO_WALLET)
        const balance = await fetchBalance(connection, demoKey)
        setPendingWallet(null)
        setError(null)
        onConnect(DEMO_WALLET, balance)
      } catch {
        setPendingWallet(null)
        setError(null)
        onConnect(DEMO_WALLET, 0)
      }
    }
  }

  const isConnecting = !!pendingWallet || adapterConnecting

  return (
    <div
      className="rounded-2xl p-9 flex flex-col items-center gap-7"
      style={{
        background: 'rgba(8,8,12,0.97)',
        border: '1px solid rgba(34,211,238,0.18)',
        boxShadow: '0 0 0 1px rgba(34,211,238,0.06), 0 24px 48px rgba(0,0,0,0.5)',
      }}
    >
      {/* Step header */}
      <div className="w-full flex items-center justify-between">
        <h2 style={{ fontFamily: 'var(--font-orbitron)', fontSize: '1.05rem', color: 'white', letterSpacing: '0.1em', fontWeight: 700 }}>
          CONNECT WALLET
        </h2>
        <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.62rem', color: 'rgba(34,211,238,0.5)', letterSpacing: '0.2em' }}>
          STEP 01 / 06
        </span>
      </div>

      {/* Icon */}
      <div
        className="flex items-center justify-center w-16 h-16 rounded-xl"
        style={{ background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.2)' }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="13" stroke="#22d3ee" strokeWidth="1.5" />
          <path d="M9 20.5L12.5 17 9 13.5H23L19.5 17 23 20.5H9Z" fill="#22d3ee" />
        </svg>
      </div>

      {/* Subtitle */}
      <p className="text-base text-center leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Your Solana wallet is your account.
        <br />No email required.
      </p>

      {/* Wallet buttons */}
      <div className="w-full flex flex-col gap-3">
        <WalletButton
          label="PHANTOM"
          accentColor="#7c3aed"
          isConnecting={pendingWallet === 'Phantom' || (adapterConnecting && pendingWallet === 'Phantom')}
          disabled={isConnecting}
          demoMode={!isInstalled('Phantom')}
          onClick={() => handleConnect('Phantom')}
          icon={
            <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-white font-black" style={{ background: '#7c3aed', fontSize: '0.7rem' }}>
              P
            </div>
          }
        />
        <WalletButton
          label="SOLFLARE"
          accentColor="#f97316"
          isConnecting={pendingWallet === 'Solflare'}
          disabled={isConnecting}
          demoMode={!isInstalled('Solflare')}
          onClick={() => handleConnect('Solflare')}
          icon={<SunIcon />}
        />
      </div>

      {/* Error notice */}
      {error && (
        <div
          className="w-full px-4 py-3 rounded-lg text-sm text-center"
          style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)', color: 'rgba(34,211,238,0.7)' }}
        >
          {error}
        </div>
      )}

      {/* Extension status */}
      <div className="w-full flex flex-col gap-2">
        <ExtensionStatus name="Phantom" installed={isInstalled('Phantom')} />
        <ExtensionStatus name="Solflare" installed={isInstalled('Solflare')} />
      </div>

      <p className="text-sm text-center" style={{ color: 'rgba(255,255,255,0.22)', lineHeight: 1.6 }}>
        No extension installed? Buttons connect in demo mode using the test wallet.
      </p>
    </div>
  )
}

function WalletButton({ label, accentColor, isConnecting, disabled, demoMode, onClick, icon }: {
  label: string; accentColor: string; isConnecting: boolean; disabled: boolean; demoMode: boolean; onClick: () => void; icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all disabled:opacity-50"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.borderColor = accentColor + '80' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
    >
      {isConnecting ? (
        <>
          <Spinner />
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.72rem', letterSpacing: '0.15em' }}>CONNECTING...</span>
        </>
      ) : (
        <>
          {icon}
          <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.72rem', letterSpacing: '0.15em', fontWeight: 700 }}>{label}</span>
          {demoMode && (
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-orbitron)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>
              DEMO MODE
            </span>
          )}
        </>
      )}
    </button>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin flex-shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#22d3ee" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="12" cy="12" r="4" fill="#f97316" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        return (
          <line key={deg} x1={12 + 7 * Math.cos(rad)} y1={12 + 7 * Math.sin(rad)} x2={12 + 9.5 * Math.cos(rad)} y2={12 + 9.5 * Math.sin(rad)} stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" />
        )
      })}
    </svg>
  )
}

function ExtensionStatus({ name, installed }: { name: string; installed: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em' }}>{name.toUpperCase()}</span>
      {installed
        ? <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.6rem', color: '#7ab83e', letterSpacing: '0.12em' }}>DETECTED</span>
        : <span style={{ fontFamily: 'var(--font-orbitron)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.12em' }}>NOT INSTALLED</span>
      }
    </div>
  )
}
