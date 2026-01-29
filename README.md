# 🧺 BSKT (Basket) - Trustless Stablecoin Factory

**BSKT** is a decentralized infrastructure platform that enables the creation of compliant, oracle-backed stablecoins using Chainlink's **Proof-of-Reserve (PoR)** Secure Mint pattern.

## 🚀 Quick Start for Developers

This repository contains the full stack for the BSKT protocol:
- **Smart Contracts**: Foundry-based Solidity contracts (Sepolia).
- **Backend API**: Node/Express server simulating the CRE/Oracle flow.

### 1. Prerequisites
- Node.js (v18+)
- Foundry (`forge`, `cast`)
- Bun (optional, for workflow simulation)

### 2. Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd bskt

# Install Backend Dependencies
cd backend
npm install
cp .env.example .env
# Edit .env and add your SEPOLIA_RPC_URL and PRIVATE_KEY (Deployer)

# Install Contract Dependencies
cd ../basket-contracts
forge install
cp .env.example .env
# Edit .env with your keys
```

### 3. Run the Backend API
The backend acts as the Oracle Node simulator for the demo.

```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

### 4. Live Demo (Sepolia)

The system is currently deployed on Sepolia Testnet.

- **Stablecoin (DemoUSD)**: `0xd7b6f62a6a01bd7626c8cf6252ed717243c8f2f8`
- **Consumer Contract**: `0xf07ed51bc946bf21bf0f366f9e12cf3b2931166a`

#### ⚡ Test Minting

Trigger a Proof-of-Reserve verified mint via the backend:

```bash
curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary": "0x60105EC2b4Eb1A8a27F4090d4B05F15F33A7FBFd",
    "amount": "1000",
    "stablecoinAddress": "0xd7b6f62a6a01bd7626c8cf6252ed717243c8f2f8",
    "mintingConsumerAddress": "0xf07ed51bc946bf21bf0f366f9e12cf3b2931166a"
  }'
```

## 📚 Documentation

- [Project Overview](docs/PROJECT_OVERVIEW.md) - Vision & Architecture
- [Integration Guide](docs/INTEGRATION_GUIDE.md) - Technical Deep Dive
- [Changelog](docs/CHANGELOG.md) - Development History
