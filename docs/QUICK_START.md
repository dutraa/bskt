# BSKT Project - Quick Start Guide

This guide will help you get started with the BSKT project, including setting up the backend API server and understanding the project structure.

## Project Overview

BSKT is a Chainlink-powered basket stablecoin system with:
- **Smart Contracts** (Foundry) - Factory pattern for creating basket stablecoins
- **CRE Workflow** (Chainlink) - PoR validation + ACE-gated minting
- **Backend API** (Express/TypeScript) - Links CRE to frontend
- **Documentation** (Local) - Chainlink docs stored locally (git-ignored)

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**CRE Workflow:**
```bash
cd bank-stablecoin-por-ace-ccip-workflow
bun install
```

**Smart Contracts:**
```bash
cd basket-contracts
forge install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env and add your RPC_URL
```

**CRE Workflow:**
```bash
cd bank-stablecoin-por-ace-ccip-workflow
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Backend Server

```bash
bash scripts/start-backend.sh
```

Server will run on `http://localhost:3001`

### 4. Test the Integration

```bash
bash scripts/test-mint.sh
```

## Project Structure

```
bskt/
├── backend/                          # Backend API server
│   ├── src/
│   │   ├── server.ts                # Express server with /mint endpoint
│   │   └── workflow-runner.ts       # CRE workflow execution logic
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── bank-stablecoin-por-ace-ccip-workflow/  # Chainlink CRE workflow
│   ├── main.ts                      # Workflow entry point
│   ├── config.json                  # Workflow configuration
│   ├── http_trigger_payload.json    # Trigger payload
│   └── workflow.yaml                # Workflow definition
│
├── basket-contracts/                 # Foundry smart contracts
│   ├── src/
│   │   ├── BasketFactory.sol        # Factory for creating baskets
│   │   ├── StablecoinERC20.sol      # ERC20 stablecoin
│   │   └── MintingConsumerWithACE.sol  # ACE-gated mint consumer
│   └── script/
│       └── DeployBasketFactory.s.sol
│
├── docs/                             # Local documentation (git-ignored)
│   ├── chainlink/                   # Chainlink docs & resources
│   └── INTEGRATION_GUIDE.md         # CRE-backend integration guide
│
└── scripts/                          # Helper scripts
    ├── start-backend.sh             # Start backend server
    └── test-mint.sh                 # Test mint endpoint
```

## Documentation

- **[Integration Guide](docs/INTEGRATION_GUIDE.md)** - How CRE connects to backend
- **[Chainlink Docs](docs/chainlink/)** - Local Chainlink documentation (add your own)
- **[Main README](README.md)** - Full project documentation

## Key Endpoints

### Backend API

- `GET /health` - Health check
- `POST /mint` - Trigger mint via CRE workflow

### Example Mint Request

```bash
curl -X POST http://localhost:3001/mint \
  -H "Content-Type: application/json" \
  -d '{
    "beneficiary": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "1000",
    "stablecoinAddress": "0x...",
    "mintingConsumerAddress": "0x..."
  }'
```

## Next Steps

1. **Deploy Factory** - Deploy `BasketFactory` to Sepolia
2. **Create Basket** - Use factory to create a new basket stablecoin
3. **Configure Workflow** - Update workflow config with basket addresses
4. **Test Mint** - Trigger a mint via backend API
5. **Build Frontend** - Create dApp to interact with the system

## Resources

- [Chainlink Documentation](https://docs.chain.link/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## Troubleshooting

See the [Integration Guide](docs/INTEGRATION_GUIDE.md#troubleshooting) for common issues and solutions.
