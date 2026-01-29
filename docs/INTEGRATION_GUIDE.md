# CRE-Backend Integration Guide

This guide explains how the Chainlink Runtime Environment (CRE) workflow connects to the backend API server, enabling the frontend to trigger mints.

## Architecture Overview

```
Frontend (dApp)
    ↓ HTTP POST /mint
Backend API Server (Express)
    ↓ Updates config.json & trigger payload
CRE Workflow (Bun/TypeScript)
    ↓ Executes PoR + ACE validation
Smart Contracts (Sepolia)
    ↓ Mints tokens to beneficiary
```

## Components

### 1. Backend API Server (`backend/src/server.ts`)

Express server that exposes a `/mint` endpoint:

**Endpoint**: `POST /mint`

**Request Body**:
```json
{
  "beneficiary": "0x...",
  "amount": "1000",
  "stablecoinAddress": "0x...",
  "mintingConsumerAddress": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "mintTx": "0x...",
  "etherscan": "https://sepolia.etherscan.io/tx/0x..."
}
```

### 2. Workflow Runner (`backend/src/workflow-runner.ts`)

Handles CRE workflow execution:

1. **Updates `config.json`** with stablecoin and consumer addresses
2. **Updates `http_trigger_payload.json`** with beneficiary and amount
3. **Executes workflow** using `bun run main.ts`
4. **Extracts transaction hash** from workflow output

### 3. CRE Workflow (`bank-stablecoin-por-ace-ccip-workflow/`)

The actual Chainlink workflow that:
- Validates PoR (Proof of Reserves)
- Checks ACE policies (blacklist)
- Generates DON-signed report
- Calls `MintingConsumerWithACE.onReport()`

## Proof-of-Reserve Secure Mint

**Critical Security Feature**: The CRE workflow implements Chainlink's **PoR Secure Mint** pattern, which provides cryptographic guarantees that new tokens are backed by reserves before minting.

### How Reserve Verification Works

```
Mint Request Received
    ↓
1. ACE Policy Check
   ├─> Whitelist verification
   ├─> Volume limit check
   ├─> KYC/AML validation
   └─> Jurisdictional rules
    ↓
2. Proof-of-Reserve Validation
   ├─> Query reserve data source
   │   ├─> Bank API (production)
   │   ├─> Custodian API
   │   └─> Mock response (hackathon)
   ├─> DON nodes independently verify
   ├─> Consensus via Chainlink OCR
   └─> Generate cryptographic proof
    ↓
3. Reserve Sufficiency Check
   └─> Reserves ≥ Mint Amount?
       ├─> YES: Proceed to mint ✓
       └─> NO:  Halt mint (circuit breaker) ✗
    ↓
4. On-chain Execution
   ├─> MintingConsumerWithACE.onReport()
   ├─> Verify DON signature
   ├─> Validate ACE policies on-chain
   ├─> Check reserve proof
   └─> Mint tokens to beneficiary
```

### Reserve Data Sources

The workflow supports multiple reserve verification methods:

#### Offchain Reserves
- **Third-party Auditor**: Professional auditing firm verifies reserves (e.g., The Network Firm for TUSD)
- **Custodian API**: Direct connection to bank/custodian holding assets
- **⚠️ Self-reported**: Token issuer's API (additional risk assessment required)

#### Cross-chain Reserves
- **Wallet Address Manager**: On-chain contract tracking reserve addresses
- **Blockchain Query**: Direct verification of on-chain reserves

### Hackathon vs Production

**Hackathon Mode** (Current):
- Uses `mock-por-response.json` for reserve data
- Simulates successful reserve verification
- Demonstrates flow without real bank integration

**Production Mode** (Future):
- Real-time API connection to reserve custodian
- Automated reserve updates via Chainlink DON
- Circuit breaker halts minting if reserves insufficient
- Continuous monitoring and alerting

### Security Benefits

1. **Prevents Infinite Mint Attacks**: Cryptographic proof required before minting
2. **Real-time Verification**: Reserves checked for every mint request
3. **Decentralized Validation**: DON consensus prevents single point of failure
4. **Automated Circuit Breaker**: Halts minting if reserves fall below threshold
5. **On-chain Auditability**: All reserve proofs verifiable on blockchain

### Integration with ACE

Reserve verification works in conjunction with ACE policy enforcement:

1. **ACE First**: Policy checks (whitelist, limits) execute first
2. **PoR Second**: Reserve validation only if policies pass
3. **Combined Guarantee**: Tokens minted ONLY if both ACE and PoR approve
4. **Audit Trail**: Both policy and reserve checks logged on-chain


## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- Bun runtime installed (for CRE workflow)
- Sepolia RPC URL (Alchemy, Infura, or QuickNode)

### Step 1: Configure Backend

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Copy environment template:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your configuration:
   ```env
   PORT=3001
   WORKFLOW_DIR=../bank-stablecoin-por-ace-ccip-workflow
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   CORS_ORIGIN=http://localhost:3000
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

### Step 2: Start Backend Server

Use the helper script:
```bash
bash scripts/start-backend.sh
```

Or manually:
```bash
cd backend
npm run dev
```

The server will start on `http://localhost:3001`

### Step 3: Test the Integration

Use the test script:
```bash
bash scripts/test-mint.sh
```

Or manually with curl:
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

## Frontend Integration

### Using fetch API

```typescript
async function requestMint(
  beneficiary: string,
  amount: string,
  stablecoinAddress: string,
  mintingConsumerAddress: string
) {
  const response = await fetch('http://localhost:3001/mint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      beneficiary,
      amount,
      stablecoinAddress,
      mintingConsumerAddress,
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Mint successful!', result.mintTx);
    console.log('View on Etherscan:', result.etherscan);
  } else {
    console.error('Mint failed:', result.error);
  }
  
  return result;
}
```

### Using wagmi/viem (recommended for Web3 dApps)

```typescript
import { useAccount } from 'wagmi';

function MintButton() {
  const { address } = useAccount();
  
  const handleMint = async () => {
    const result = await requestMint(
      address, // beneficiary
      '1000', // amount
      stablecoinAddress,
      mintingConsumerAddress
    );
    
    // Show transaction on UI
    if (result.success) {
      alert(`Minted! Tx: ${result.mintTx}`);
    }
  };
  
  return <button onClick={handleMint}>Request Mint</button>;
}
```

## Workflow Execution Flow

1. **Frontend** creates a basket via `BasketFactory.createBasket()`
2. **Frontend** parses receipt to get `stablecoinAddress` and `mintingConsumerAddress`
3. **Frontend** calls backend `/mint` endpoint with addresses + beneficiary + amount
4. **Backend** updates CRE workflow config files
5. **Backend** executes workflow: `bun run main.ts`
6. **Workflow** performs PoR check (mock in hackathon mode)
7. **Workflow** generates DON-signed report
8. **Workflow** calls `MintingConsumerWithACE.onReport()`
9. **ACE** validates policies (blacklist check)
10. **Contract** mints tokens to beneficiary
11. **Backend** returns transaction hash to frontend
12. **Frontend** displays success + Etherscan link

## Troubleshooting

### Server won't start
- Check if port 3001 is already in use
- Verify `.env` file exists and is configured
- Run `npm install` in backend directory

### Workflow execution fails
- Verify `WORKFLOW_DIR` path is correct in `.env`
- Check that CRE workflow dependencies are installed (`cd bank-stablecoin-por-ace-ccip-workflow && bun install`)
- Ensure Bun runtime is installed

### Transaction not found
- Check workflow output logs for errors
- Verify RPC URL is working
- Check Sepolia testnet status

### CORS errors
- Update `CORS_ORIGIN` in `.env` to match your frontend URL
- Restart backend server after changing `.env`

## Next Steps

- [ ] Deploy backend to production (Railway, Render, or similar)
- [ ] Add authentication/rate limiting for production
- [ ] Replace mock PoR with real PoR API
- [ ] Add transaction monitoring and webhooks
- [ ] Implement retry logic for failed workflows
