'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface LoaderProps {
  visible: boolean
}

const words = ["It's", 'time', 'to', 'be', 'unchained.']

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.25 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

const word = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
}

export default function Loader({ visible }: LoaderProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] } }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ backgroundColor: '#0b0b0f' }}
        >
          {/* Faint radial glow behind text */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden
          >
            <div
              className="w-[600px] h-[300px] rounded-full"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }}
            />
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center gap-8 px-8 select-none"
          >
            {/* Logo mark */}
            <motion.img
              src="/logo.png"
              alt="Clipchain"
              variants={word}
              style={{
                height: 72,
                width: 'auto',
                filter: 'drop-shadow(0 0 16px rgba(34,211,238,0.6))',
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-x-[0.45em] gap-y-2">
            {words.map((w, i) => (
              <motion.span
                key={i}
                variants={word}
                className="text-4xl sm:text-5xl md:text-6xl tracking-tight select-none"
                style={{
                  fontFamily: 'var(--font-orbitron)',
                  fontWeight: 700,
                  textShadow:
                    '0 0 20px rgba(255,255,255,0.12), 0 0 60px rgba(34,211,238,0.15)',
                  color: w === 'unchained.' ? '#22d3ee' : 'white',
                  letterSpacing: w === 'unchained.' ? '-0.01em' : '0.04em',
                }}
              >
                {w}
              </motion.span>
            ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
