'use client'

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { useMemo } from 'react'

// Mainnet endpoint — balance reads reflect real SOL
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com'

export default function WalletContextProvider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  )

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={() => {}}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  )
}
