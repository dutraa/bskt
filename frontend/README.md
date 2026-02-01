# Basket Protocol Frontend

A clean dApp UI for creating and managing stablecoin baskets with ACE-protected minting.

## Features

- **Wallet Connection**: MetaMask and other wallets via RainbowKit
- **Network Validation**: Requires Sepolia network with switch prompt
- **Create Basket**: Deploy new stablecoin + minting consumer in one transaction
- **Mint Request**: Trigger CRE workflow to mint tokens
- **Verify Balance**: Check your balance and total supply

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# WalletConnect Project ID - Get one at https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract Addresses (Sepolia) - Pre-configured with deployed addresses
NEXT_PUBLIC_BASKET_FACTORY_ADDRESS=0xc0e78ddcc5ecc590e77a985bca82122d52b0e092
NEXT_PUBLIC_POLICY_ENGINE_ADDRESS=0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1

# Backend API URL for mint requests
NEXT_PUBLIC_MINT_API_URL=http://localhost:3000/api/mint
```

## Contract Addresses (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| BasketFactory | `0xc0e78ddcc5ecc590e77a985bca82122d52b0e092` |
| PolicyEngine | `0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1` |

## User Flow

### 1. Create Basket
1. Connect your wallet (Sepolia network required)
2. Fill in token name (e.g., "Basket USD")
3. Fill in token symbol (e.g., "bUSD")
4. Admin address defaults to connected wallet
5. Click "Create Basket" and confirm transaction
6. Receive stablecoin address and minting consumer address

### 2. Mint Request
1. With a basket created, enter amount to mint
2. Beneficiary defaults to connected wallet
3. Click "Request Mint" to trigger CRE workflow
4. The workflow validates reserves and mints tokens

### 3. Verify Balance
1. View your current token balance
2. View total supply
3. Refresh to see updated balances after minting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Wallet**: RainbowKit + wagmi v2
- **Blockchain**: viem
- **Styling**: Tailwind CSS
- **State**: TanStack Query

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── api/mint/      # Mock mint API endpoint
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout with providers
│   │   ├── page.tsx       # Main page
│   │   └── providers.tsx  # Wagmi/RainbowKit providers
│   ├── components/
│   │   ├── Header.tsx     # Navbar with wallet connect
│   │   ├── CreateBasket.tsx
│   │   ├── MintRequest.tsx
│   │   └── VerifyBalance.tsx
│   ├── config/
│   │   ├── contracts.ts   # ABIs and addresses
│   │   └── wagmi.ts       # Wagmi configuration
│   └── hooks/
│       ├── useBasketFactory.ts  # Create basket hook
│       ├── useStablecoin.ts     # ERC20 read hooks
│       └── useMintRequest.ts    # Mint API hook
├── .env.example
├── package.json
└── README.md
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Notes

- **Hackathon Mode**: The mint API is a demo endpoint. In production, it would forward to the actual CRE workflow HTTP trigger.
- **Network**: Only Sepolia testnet is supported.
- **Gas**: You'll need Sepolia ETH for transactions. Get some from [Sepolia Faucet](https://sepoliafaucet.com).

## Vercel Deployment

### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = your WalletConnect project ID
   - `NEXT_PUBLIC_BASKET_FACTORY_ADDRESS` = `0x7419818Baf1373B5a75ab265C00c2ea0895Bd590`
   - `NEXT_PUBLIC_POLICY_ENGINE_ADDRESS` = `0x697B79dFdbe5eD6f9d877bBeFac04d7A28be5CA1`
4. Deploy

### Option 2: Deploy via CLI

```bash
cd frontend
npx vercel --prod
```

## License

MIT
