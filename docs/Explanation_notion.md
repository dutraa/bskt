# 🎯 Project Overview

**Basket** is a decentralized stablecoin infrastructure platform that enables anyone to create compliant, oracle-backed stablecoins through a permissionless factory smart contract. Unlike traditional stablecoins with centralized admin minting, Basket enforces all compliance and reserve requirements on-chain using Chainlink's Advanced Compliance Engine (ACE) for policy enforcement and Chainlink's Composable Reserve Engine (CRE) for cryptographic Proof-of-Reserve validation. This eliminates trust assumptions and creates a transparent, auditable stablecoin issuance system.

**Problem:** Current stablecoin infrastructure requires users to trust centralized issuers with admin keys who can mint tokens arbitrarily. Compliance and reserves are often opaque or rely on off-chain audits.

**Solution:** Basket moves all enforcement on-chain. Minting only occurs if both policy requirements (via ACE) and reserve proofs (via CRE) are satisfied, creating trustless, compliant stablecoin issuance infrastructure.

# 🏗️ Architecture (High Level)

Basket's architecture consists of four core components:

### Smart Contracts

- **Factory Contract:** Deploys new stablecoin instances. Users interact with this to create their own basket-backed stablecoins.
- **Stablecoin Contract:** ERC-20 token with restricted minting. Minting can only occur through approved workflows.
- **Minting Consumer Contract:** Receives user mint requests, validates policy + reserves, and executes minting if all checks pass.

### Chainlink CRE (Composable Reserve Engine)

Provides cryptographic Proof-of-Reserve workflows. Before any mint, CRE validates that backing assets exist and match the requested mint amount. This ensures 1:1 collateralization without trusting a centralized oracle.

### Chainlink ACE (Advanced Compliance Engine)

Enforces on-chain compliance policies. ACE checks that minting requests satisfy predefined rules (e.g., user whitelist, minting limits, jurisdiction checks). Only compliant requests proceed to CRE validation.

### Frontend dApp

User-facing interface for creating baskets, requesting mints, and viewing status. Connects to user wallets and interacts with smart contracts via Web3 providers.

**Trust Boundaries:** All enforcement happens on-chain. No centralized admin can bypass policy or mint without reserves. The system is trustless by design — users trust code and oracles, not intermediaries.

# 📍 Current State

### ✅ Already Built

- Factory contract deployed and tested
- Stablecoin contract with restricted minting logic
- Minting Consumer contract integrated with CRE + ACE
- Basic CRE workflow for Proof-of-Reserve validation
- ACE policy enforcement (whitelist, minting caps)
- Core minting flow (request → policy check → reserve check → mint)

### 🚧 Remaining for Hackathon Demo

- Frontend dApp (wallet connection, create basket, mint UI)
- Hardening edge cases (CRE failures, policy rejections, gas optimization)
- Demo environment setup (testnet deployment, seeded data)
- Transaction feedback UI (loading states, errors, success confirmations)
- Security review checklist completion
- Demo script + pitch deck preparation

# ⚙️ Backend / Infra Workstream

**Owner:** TBD

### 🔧 Environment Setup & Deployment

**Description:** Ensure consistent deployment pipeline for contracts across local, testnet, and demo environments.

**Goal:** One-command deploy script that sets up Factory, sample Stablecoin, Minting Consumer, and configures CRE/ACE.

**Done when:** Any teammate can run `npm run deploy:testnet` and get a fully functional environment with deployed contracts and console output of addresses.

### 🔧 Harden Minting + Policy Flow

**Description:** Review minting logic for edge cases: insufficient reserves, policy rejection, failed CRE callback, reentrancy, etc.

**Goal:** Minting flow gracefully handles all failure modes without locking funds or leaving contracts in bad state.

**Done when:** Unit tests cover: (1) successful mint, (2) ACE rejection, (3) CRE failure, (4) insufficient reserves, (5) user cancels request. All tests pass.

### 🔧 CRE Workflow Validation & Failure Cases

**Description:** Test CRE integration with mock and live Chainlink oracles. Ensure reserve proofs are validated correctly and failures are handled.

**Goal:** CRE workflow rejects mints when reserves are insufficient and approves when valid.

**Done when:** Integration test suite runs against CRE testnet endpoint. Console logs show reserve proof validation passing/failing as expected. Failure cases return clear error messages.

### 🔧 Backend Services (Optional)

**Description:** If needed for demo: simple API for indexing baskets, user history, or handling off-chain auth (e.g., JWT for whitelisting).

**Goal:** Decide if backend is needed. If yes, deploy minimal Express/FastAPI service.

**Done when:** (If needed) API returns list of baskets and mint requests for a given user address. Deployed to demo environment with public endpoint.

### 🔧 Security Review Checklist

**Description:** Run through standard security checklist: reentrancy, access control, oracle manipulation, gas griefing, etc.

**Goal:** Identify and fix critical vulnerabilities before demo.

**Done when:** Checklist completed, any critical issues fixed or documented as known limitations. Slither or Mythril scan run with no high-severity findings.

### 🔧 Demo-Readiness Tasks

**Description:** Seed testnet with sample data (pre-deployed baskets, funded wallets, whitelisted addresses). Write demo script.

**Goal:** Demo environment is stable and pre-configured for live presentation.

**Done when:** (1) At least 2 sample baskets deployed, (2) demo wallet funded and whitelisted, (3) one successful mint transaction recorded on testnet, (4) demo script written and rehearsed.

# 🎨 Frontend Workstream

**Owner:** TBD

### 🔌 Wallet Connection

**Description:** Implement wallet connection UI (MetaMask, WalletConnect, etc.). Detect user address and network.

**Contract/Function:** None (Web3 provider setup).

**Expected Outcome:** User clicks "Connect Wallet", approves connection, sees their address displayed in navbar. Network mismatch shows warning.

**Done when:** Wallet connects, user address displays, wrong network shows clear error message.

### 👀 Read-Only Contract Views

**Description:** Display list of deployed baskets (from Factory) and details of each basket (symbol, supply, policy config).

**Contract/Function:** `Factory.getBaskets()`, `Stablecoin.totalSupply()`, `Stablecoin.symbol()`.

**Expected Outcome:** Homepage shows grid of all baskets with name, symbol, total supply. Click on basket shows detail page.

**Done when:** UI fetches and displays all baskets. Detail page shows basket metadata and current supply.

### 🆕 Create Basket Flow

**Description:** UI for creating a new basket. User inputs name, symbol, policy params (whitelist, caps), submits transaction.

**Contract/Function:** `Factory.createBasket(name, symbol, policyConfig)`.

**Expected Outcome:** User fills form, clicks "Create Basket", signs transaction, sees loading spinner, then success message with new basket address.

**Done when:** Form validates inputs, transaction submits, loading state shows during mining, success state shows new basket link.

### 💰 Mint Request UI

**Description:** User selects basket, enters mint amount, submits mint request. UI calls Minting Consumer.

**Contract/Function:** `MintingConsumer.requestMint(basketAddress, amount)`.

**Expected Outcome:** User enters amount, clicks "Request Mint", signs transaction, sees confirmation that request is pending policy + reserve checks.

**Done when:** UI submits mint request, shows pending status, and updates when mint completes or fails.

### 📡 Transaction + Policy Feedback States

**Description:** Show real-time feedback for transaction states: pending, mining, ACE checking, CRE validating, success, failure.

**Contract/Function:** Listen to events: `MintRequested`, `PolicyChecked`, `ReserveValidated`, `MintCompleted`, `MintFailed`.

**Expected Outcome:** User sees progress indicator moving through stages. If failure, clear error message (e.g., "Policy rejected: address not whitelisted").

**Done when:** All transaction states display correctly. Error messages are user-friendly. Success shows minted amount and transaction hash.

### ✨ Demo Polish

**Description:** Add loading skeletons, error boundaries, success animations, toast notifications. Ensure UI is responsive and looks professional.

**Expected Outcome:** Demo feels smooth and polished. No console errors, clean design, clear UX.

**Done when:** Team reviews UI and agrees it's demo-ready. No major visual bugs. All interactions feel responsive.

# 👥 Team Roles & Ownership

### Backend / Infrastructure

**Owner:** TBD

**Responsibilities:** Smart contract deployment, CRE/ACE integration, testing, security review, demo environment setup.

### Frontend

**Owner:** TBD

**Responsibilities:** dApp UI, wallet integration, contract interaction, transaction states, demo polish.

### Product / Demo / Pitch (Optional)

**Owner:** TBD

**Responsibilities:** Demo script, pitch deck, judge Q&A prep, narrative framing.

# 🎯 Hackathon Goals

### Success Criteria

- **Functional Demo:** Live demo showing: (1) Create a new basket, (2) Request mint with policy enforcement, (3) CRE validates reserves, (4) Tokens minted to user wallet.
- **On-Chain Verification:** All enforcement happens on-chain. Judges can verify transactions on block explorer.
- **Clear Narrative:** Judges understand the problem (centralized stablecoin risk) and solution (trustless, on-chain enforcement).
- **Technical Depth:** Showcase integration with Chainlink CRE + ACE. Highlight cryptographic PoR and policy engine.

### Judge-Facing Goals

- Position Basket as **infrastructure for compliant DeFi** — not just another stablecoin, but a platform for creating them.
- Emphasize **elimination of trust**: no admin keys, no centralized minting, all enforcement cryptographically verified.
- Highlight **Chainlink integration** as core innovation (CRE for reserves, ACE for compliance).
- Show **real-world applicability**: regulated institutions, DAOs, or protocols can launch compliant stablecoins without building infrastructure from scratch.

# 🔗 Links & References

### Project Resources

- **GitHub Repo:** [Empty Repo for Project](https://github.com/dutraa/basket)
- **Deployed Contracts (Testnet):** [Insert contract addresses after deployment]
- **Demo Environment:** [Insert frontend URL when deployed]

### Chainlink Documentation

- **Chainlink CRE (Composable Reserve Engine):** [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)
- **Chainlink ACE (Advanced Compliance Engine):** [Insert ACE docs link if available]
- **Chainlink Oracle Networks:** [Chainlink Docs](https://docs.chain.link/)

### HackMoney Resources

- **ETHGlobal HackMoney Homepage:** [ETHGlobal HackMoney](https://ethglobal.com/events/hackmoney)
- **Submission Guidelines:** [Insert submission link when available]
- **Team Communication:** [Insert Discord/Telegram/Slack link]