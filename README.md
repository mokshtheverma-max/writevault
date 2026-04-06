# WriteVault

> Prove your writing is human. Cryptographic proof of authorship for students.

## What It Does

WriteVault silently records your complete writing process — every keystroke, pause, and revision — creating tamper-proof behavioral evidence that you wrote your essay yourself.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt
- **Payments:** Stripe
- **Scoring:** 5-layer behavioral analysis engine
- **Crypto:** SHA-256 session verification

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/writevault

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Environment Variables

Copy `server/.env.example` to `server/.env` and fill in values.

### Running Locally

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173

## Architecture

- **5-Layer Engine** — Temporal, revision, cognitive, biometric, and linguistic analysis run in parallel on raw keystroke events
- **Writing DNA** — Builds a unique typing fingerprint across sessions for long-term identity proof
- **SHA-256 Verification** — Both client and server compute hashes to ensure data integrity
- **Stripe Billing** — Free (3 sessions), Student ($7/mo), Teacher ($19/mo), Institution ($299/mo)

## Founder

Built by Moksh Verma, age 14.
