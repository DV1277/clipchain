# Clipchain
 
> Upload rare video clips. Earn SOL. The world's extraordinary moments, captured and rewarded on-chain.
 
![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)
![Vultr](https://img.shields.io/badge/Vultr-007BFC?style=flat&logo=vultr&logoColor=white)
![TwelveLabs](https://img.shields.io/badge/TwelveLabs-FF4F00?style=flat&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini_API-4285F4?style=flat&logo=google&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
 
---
 
## What is Clipchain?
 
Clipchain is a decentralized video bounty network. Users upload clips of rare real-world events — lightning strikes, meteors, wildlife encounters, extreme weather — and an AI pipeline automatically scores the footage for rarity. If your clip crosses the threshold, a Solana smart contract pays you in SOL instantly, with no human review and no middlemen. Clips scoring above 8.5/10 are also minted as NFTs and listed on an auction marketplace for collectors.
 
The rarity score is computed by two independent AI systems running in parallel: **TwelveLabs** for deep semantic video understanding, and **Gemini API** for scene classification and global frequency estimation. Together they produce a score from 0–10, which feeds a quadratic bounty formula:
 
```
SOL payout = rarity² × 0.025 × demand_coeff
```
 
A score of 9.0 yields ~2.0 SOL. A score of 5.0 yields ~0.6 SOL. The `demand_coeff` multiplier rises for categories that collectors actively follow, creating a live market for specific types of rare events.
 
---
 
## Features
 
- **Wallet-native auth** — connect Phantom or Solflare; no email or password required
- **Direct-to-Vultr upload** — clips go from browser to Vultr Object Storage via presigned URL, never routing through the backend
- **Parallel AI analysis** — TwelveLabs and Gemini run concurrently and cross-validate each other's outputs
- **Instant SOL payouts** — smart contract releases bounty automatically on rarity score confirmation
- **NFT minting** — high-rarity clips (8.5+) are minted via Metaplex with TwelveLabs semantic embeddings stored as on-chain metadata
- **Live processing dashboard** — real-time pipeline status from upload to payout confirmation
- **Collector marketplace** — bid on rare-event NFTs; secondary sale royalties flow back to original uploaders
 
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Wallet | Phantom SDK, Solflare SDK |
| Video storage | Vultr Object Storage (presigned multipart upload) |
| GPU inference | Vultr A100 compute instance |
| Video AI | TwelveLabs (semantic indexing + embeddings) |
| Scene AI | Google Gemini API (classification + rarity estimation) |
| Blockchain | Solana (devnet → mainnet), Metaplex NFT standard |
| Backend API | Node.js on Vultr (oracle + pipeline orchestration) |
| Smart contract | Anchor framework (Rust) |
 
---
 
## Architecture
 
```
Browser
  │
  ├── Presigned URL ──────────────────► Vultr Object Storage
  │                                             │
  │                                     Vultr GPU Instance
  │                                      ┌─────┴──────┐
  │                                 TwelveLabs     Gemini API
  │                                  (video AI)  (scene AI)
  │                                      └─────┬──────┘
  │                                    Rarity score engine
  │                                             │
  │                                   Solana smart contract
  │                                      ┌─────┴──────┐
  │                               SOL bounty       NFT mint
  │                                payout        (Metaplex)
  │◄──────────────────────────── Wallet notification
```
 
---
 
## Getting Started
 
### Prerequisites
 
- Node.js 18+
- A Solana wallet (Phantom or Solflare) with devnet SOL
- API keys for [TwelveLabs](https://twelvelabs.io), [Gemini](https://ai.google.dev), [Vultr](https://vultr.com)
- Vultr Object Storage bucket and GPU compute instance
- Anchor CLI for smart contract deployment
 
### Installation
 
```bash
git clone https://github.com/your-org/clipchain.git
cd clipchain
npm install
```
 
### Environment variables
 
Create a `.env.local` file in the project root:
 
```env
# Vultr
VULTR_ACCESS_KEY=your_vultr_access_key
VULTR_SECRET_KEY=your_vultr_secret_key
VULTR_BUCKET_NAME=clipchain-videos
VULTR_REGION=ewr
 
# TwelveLabs
TWELVELABS_API_KEY=your_twelvelabs_api_key
TWELVELABS_INDEX_ID=your_index_id
 
# Gemini
GEMINI_API_KEY=your_gemini_api_key
 
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
ORACLE_KEYPAIR_PATH=./oracle-keypair.json
PROGRAM_ID=your_deployed_program_id
 
# Metaplex
METAPLEX_COLLECTION_ADDRESS=your_collection_address
```
 
### Run locally
 
```bash
# Start the Next.js frontend + API server
npm run dev
 
# In a separate terminal, deploy the Anchor smart contract to devnet
cd programs/clipchain
anchor build
anchor deploy --provider.cluster devnet
```
 
Open [http://localhost:3000](http://localhost:3000) and connect your wallet.
 
---
 
## Smart Contract
 
The Clipchain escrow program is written in Rust using the Anchor framework. The core instruction is `claim_bounty`, which accepts:
 
- `clip_hash` — SHA-256 of the uploaded clip
- `uploader_wallet` — recipient public key
- `rarity_score` — u8 (0–100, scaled from 0–10)
- `oracle_signature` — ed25519 signature from the oracle keypair
 
The contract verifies the oracle signature, computes the SOL amount using the quadratic formula, and releases payment from the escrow pool atomically. For clips with `rarity_score >= 85`, it additionally invokes the Metaplex `create_nft` CPI to mint a token.
 
```bash
# Run contract tests on localnet
anchor test
```
 
---
 
## Rarity Scoring
 
Scores are computed by the Vultr-hosted orchestration layer in three stages:
 
1. **TwelveLabs indexing** (~4s) — generates a semantic embedding capturing objects, actions, motion, and scene context
2. **Gemini classification** (~3s) — identifies event category and estimates global occurrence frequency
3. **Score fusion** — weighted average of TwelveLabs confidence and Gemini rarity class, normalized to 0–10
 
Rarity classes defined by Gemini:
 
| Class | Frequency | Score range |
|---|---|---|
| Common | Top 50% of events | 0.0 – 4.9 |
| Uncommon | Top 20% | 5.0 – 6.9 |
| Rare | Top 5% | 7.0 – 8.4 |
| Extreme | Top 1% | 8.5 – 9.4 |
| Once-in-a-lifetime | Top 0.1% | 9.5 – 10.0 |
 
Only clips scoring **≥ 6.0** trigger a payout. Clips scoring **≥ 8.5** are additionally NFT-eligible.
 
---
 
## Submission Flow
 
1. Connect Phantom or Solflare wallet
2. Drop a video clip (MP4 / MOV, max 500MB, 10s – 10min)
3. File uploads directly to Vultr via presigned URL
4. TwelveLabs and Gemini analyze the clip in parallel
5. Rarity score computed and oracle signature generated
6. Smart contract verifies signature and releases SOL to wallet
7. If eligible, NFT is minted and listed on the marketplace
 
Total time from upload completion to SOL in wallet: **under 15 seconds**.
 
---
 
## Project Structure
 
```
clipchain/
├── app/                    # Next.js app router
│   ├── page.tsx            # Landing / wallet connect
│   ├── submit/             # Upload + processing flow
│   ├── dashboard/          # User clips and earnings
│   └── marketplace/        # NFT auction browser
├── components/             # UI components
├── lib/
│   ├── vultr.ts            # Presigned URL + storage helpers
│   ├── twelvelabs.ts       # Video indexing client
│   ├── gemini.ts           # Scene classification client
│   ├── scoring.ts          # Rarity score fusion logic
│   └── solana.ts           # Contract interaction helpers
├── programs/
│   └── clipchain/          # Anchor smart contract (Rust)
│       └── src/lib.rs
├── oracle/                 # Standalone oracle signing service
└── .env.local.example
```
 
---
 
## Roadmap
 
- [ ] Per-category rarity baselines (weather vs. wildlife vs. astronomical)
- [ ] Temporal rarity decay (same event twice in a day scores lower)
- [ ] Collector wishlists that dynamically boost `demand_coeff`
- [ ] Native iOS and Android app with in-camera direct upload
- [ ] Snapdragon on-device pre-screening to filter low-rarity clips before upload
- [ ] DAO governance for rarity thresholds and bounty formula parameters
- [ ] Decentralized oracle validator network
- [ ] Secondary sale royalty splits to original uploaders
 
---
 
## Team
 
Built at [Hackathon Name] 2026.
 
---
 
## License
 
MIT — see [LICENSE](./LICENSE) for details.
