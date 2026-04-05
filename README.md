# Clipchain — AI Video Bounty Network

> **DiamondHacks 2026 Submission**

Clipchain is a decentralized platform where users submit rare or viral video clips and earn **SOL bounties** based on AI-scored rarity — powered by Twelve Labs video intelligence, Google Gemini scene analysis, Vultr object storage, and Solana on-chain payments.

---

## How It Works

1. **Connect Wallet** — Link your Phantom or Solflare Solana wallet
2. **Upload Clip** — Submit a video clip (MP4, MOV, WebM)
3. **Add Metadata** — Title, category, and description
4. **AI Pipeline** — Clip is stored on Vultr, indexed by Twelve Labs, and analyzed by Gemini
5. **Rarity Score** — AI assigns a rarity score (0–10); higher scores earn more SOL
6. **Claim Bounty** — SOL is transferred on-chain to your wallet instantly

### Bounty Formula
```
bounty = score² × 0.025 SOL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Wallet | Solana Wallet Adapter (Phantom, Solflare) |
| Video AI | Twelve Labs — scene indexing & event detection |
| Scene Analysis | Google Gemini — rarity classification |
| Storage | Vultr Object Storage |
| Blockchain | Solana (Devnet) — on-chain SOL transfers |
| Backend | Node.js / Express |

---

## Local Development

### Prerequisites
- Node.js 18+
- A Solana wallet (Phantom or Solflare browser extension)
- API keys: Twelve Labs, Google Gemini, Vultr

### Setup

```bash
# Clone the repo
git clone https://github.com/DV1277/diamondhacks2026.git
cd diamondhacks2026

# Install backend deps
npm install

# Install frontend deps
cd frontend && npm install

# Configure environment
cp .env.example .env
# Fill in your API keys

# Run backend
cd ..
node backend/index.js

# Run frontend (separate terminal)
cd frontend
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:4000](http://localhost:4000)

---

## Environment Variables

```env
TWELVELABS_API_KEY=
GEMINI_API_KEY=
VULTR_ACCESS_KEY=
VULTR_SECRET_KEY=
VULTR_BUCKET=
SOLANA_PRIVATE_KEY=
```

---

## Team

Built at **DiamondHacks 2026**
