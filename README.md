# 🧺 BSKT (Basket) - Trustless Stablecoin Factory

**BSKT** is a decentralized stablecoin infrastructure platform that enables anyone to create compliant, oracle-backed stablecoins through a permissionless factory smart contract.

## 🎯 Project Vision

Basket eliminates trust assumptions by moving **all enforcement on-chain**:

1.  **Chainlink ACE (Advanced Compliance Engine)**: Enforces policy requirements (whitelist, KYC/AML, volume limits).
2.  **Chainlink CRE (Composable Reserve Engine)**: Provides cryptographic Proof-of-Reserve validation.
3.  **On-chain Factory**: Permissionless deployment of compliant stablecoins.
4.  **Trustless Minting**: Tokens are ONLY minted if BOTH policy AND reserve checks pass.

**Result**: Transparent, auditable stablecoin issuance with zero trust assumptions.

---

## 🏗️ Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    BASKET ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Frontend   │  User creates basket, requests mint
│     dApp     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Backend    │  Coordinates CRE workflow execution
│   API Server │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              SMART CONTRACTS (Sepolia)                    │
├──────────────────────────────────────────────────────────┤
│  BasketFactory                                            │
│  ├─> Creates StablecoinERC20 (per basket)                │
│  ├─> Creates MintingConsumerWithACE (per basket)         │
│  └─> Wires roles and permissions                         │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│         CHAINLINK CRE WORKFLOW (Off-chain)                │
├──────────────────────────────────────────────────────────┤
│  1. Receive mint request                                  │
│  2. ACE Policy Check (whitelist, limits, KYC/AML)        │
│  3. CRE Proof-of-Reserve Validation                      │
│  4. Generate DON-signed report                            │
│  5. Call MintingConsumerWithACE.onReport()               │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│              MINTING EXECUTION                            │
├──────────────────────────────────────────────────────────┤
│  ✓ ACE validates policies                                │
│  ✓ CRE validates reserves ≥ mint amount                  │
│  ✓ Cryptographic guarantee of backing                    │
│  ✓ Tokens minted to beneficiary                          │
│  ✗ Failure: Halt mint, return error                      │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start for Developers

### 1. Prerequisites
- Node.js (v18+)
- Foundry (`forge`, `cast`)
- Bun (for CRE workflow execution)

### 2. Setup

```bash
# Install Backend Dependencies
cd backend
npm install
cp .env.example .env # Add your RPC_URL and PRIVATE_KEY

# Install CRE Workflow Dependencies
cd ../bank-stablecoin-por-ace-ccip-workflow
bun install
cp .env.example .env

# Install Contract Dependencies
cd ../basket-contracts
forge install
```

## 🎮 BSKT Demo Guide

Follow these steps to run the end-to-end demo, covering registration and Proof-of-Reserve (PoR) Secure Minting.

### 1. Start the Demo Environment
The system requires two components to be running in separate terminals/background:

**Start the Mock Bank API (Reserves):**
```bash
bun run backend/src/mock-bank-api.ts
```

**Start the Backend Gateway (Port 3001):**
```bash
bun run backend/src/server.ts
```

### 2. Register a New Stablecoin (Registry Sync)
Register a test stablecoin (`AUDT`) so the Gateway knows which contracts to interact with:
```bash
wsl bash -c "curl -s -X POST http://localhost:3001/baskets -H 'Content-Type: application/json' -d @\$(wslpath -a ./backend/test_basket.json)"
```

### 3. Run PoR Secure Mint Verification
Verify the "Killer Feature" — checking on-chain supply vs off-chain reserves:
```bash
wsl bun run ./backend/src/verify-por.ts
```
*This simulates both valid minting and over-minting rejection scenarios.*

### 4. Test Full Mint Trigger
Simulate a bank webhook triggering a mint for a specific user:
```bash
curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "1000",
    "stablecoinAddress": "0x1234567890123456789012345678901234567890",
    "mintingConsumerAddress": "0x0987654321098765432109876543210987654321"
  }'
```

## 🛡️ Key Innovation: PoR Secure Mint

Traditional stablecoins are vulnerable to "infinite mint" attacks. Basket implements Chainlink's **PoR Secure Mint** pattern to ensure cryptographic backing.

### How Reserve Verification Works

```
Mint Request Received
    ↓
1. ACE Policy Check (Whitelist, Limits, KYC)
    ↓
2. Proof-of-Reserve Validation (Query Bank API)
    ↓
3. DON Consensus (Chainlink OCR)
    ↓
4. Reserve Sufficiency Check (Reserves ≥ Current Supply + New Mint)
    ↓
5. On-chain Execution (Mint to Beneficiary)
```

---

## 🔄 Technical Deep Dive

### Components
1.  **Backend API Server** ([server.ts](file:///c:/Users/shiny/Linux/bskt/backend/src/server.ts)): Exposes `/mint` and `/baskets` endpoints.
2.  **Workflow Runner** ([workflow-runner.ts](file:///c:/Users/shiny/Linux/bskt/backend/src/workflow-runner.ts)): Bridges the API to the CRE workflow.
3.  **CRE Workflow** ([main.ts](file:///c:/Users/shiny/Linux/bskt/bank-stablecoin-por-ace-ccip-workflow/main.ts)): Executes the decentralized logic.
4.  **Smart Contracts** ([basket-contracts/src](file:///c:/Users/shiny/Linux/bskt/basket-contracts/src)): The on-chain foundation.

### Production Architecture
To move beyond the demo, the following refinements are planned:
- **API Gateway Service**: For robust bank message normalization (MT103).
- **Off-Chain Datastore**: For transaction reconciliation and audit trails.
- **Idempotency Layer**: Replay protection for bank references.

---

## 📊 Project Status

- ✓ Factory contract deployed and tested on Sepolia.
- ✓ PoR Secure Mint logic implemented in CRE workflow.
- ✓ ACE policy enforcement integrated.
- ✓ Backend simulation for demo purposes.
- 🚧 Frontend dApp development in progress.

---

## 💡 Resources
- [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)
- [Chainlink Proof of Reserve](https://docs.chain.link/proof-of-reserve)
- [Foundry Book](https://book.getfoundry.sh/)

**Basket: Building the trustless infrastructure for compliant stablecoin issuance.**
