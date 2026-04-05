import type { Metadata } from 'next'
import './globals.css'
import WalletContextProvider from '@/providers/WalletContextProvider'
import { Space_Grotesk, Orbitron } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Clipchain — AI Video Bounty Network',
  description: 'Upload video clips, AI detects rare events, SOL bounties paid automatically',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${orbitron.variable}`}>
      <body style={{ backgroundColor: '#1c1f1a', minHeight: '100vh' }}>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  )
}
