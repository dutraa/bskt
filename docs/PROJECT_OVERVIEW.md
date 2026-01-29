# BSKT: Trustless Stablecoin Infrastructure Platform

## 🎯 Project Vision

**Basket** is a decentralized stablecoin infrastructure platform that enables anyone to create compliant, oracle-backed stablecoins through a permissionless factory smart contract.

### The Problem

Current stablecoin infrastructure suffers from critical trust issues:

- **Centralized Admin Control**: Users must trust centralized issuers with admin keys who can mint tokens arbitrarily
- **Opaque Reserves**: Compliance and reserves often rely on off-chain audits or are completely opaque
- **Fractional Reserve Risk**: No cryptographic guarantee that minted tokens are backed by reserves
- **Trust Assumptions**: Users forced to trust paper guarantees from custodians

### The Solution

Basket eliminates trust assumptions by moving **all enforcement on-chain**:

1. **Chainlink ACE (Advanced Compliance Engine)**: Enforces policy requirements (whitelist, KYC/AML, volume limits)
2. **Chainlink CRE (Composable Reserve Engine)**: Provides cryptographic Proof-of-Reserve validation
3. **On-chain Factory**: Permissionless deployment of compliant stablecoins
4. **Trustless Minting**: Tokens only minted if BOTH policy AND reserve checks pass

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

### Trust Boundaries

**No centralized admin can bypass policy or mint without reserves.**

- **Users trust**: Code and oracles (decentralized)
- **Users DON'T trust**: Intermediaries, centralized admins, paper guarantees

---

## 🔐 Security Model

### Chainlink ACE (Policy Enforcement)

**Purpose**: Automated on-chain compliance

**Enforces**:
- Whitelist/blacklist checks
- Volume limits per user
- KYC/AML requirements
- Jurisdictional restrictions
- Accreditation verification

**How it works**:
1. Policy defined in Policy Manager
2. Mint request triggers policy check
3. Deterministic outcome (allow/deny)
4. Audit log created on-chain

### Chainlink CRE (Reserve Validation)

**Purpose**: Cryptographic Proof-of-Reserve

**Validates**:
- Physical asset reserves exist
- Reserves ≥ mint amount (1:1 collateralization)
- Real-time, automated verification
- Decentralized oracle network consensus

**How it works** (PoR Secure Mint):
1. Mint request received
2. CRE queries reserve data (bank API, custodian, or blockchain)
3. DON nodes independently verify reserves
4. Consensus reached via Chainlink OCR
5. Cryptographic proof generated
6. Mint authorized ONLY if reserves sufficient

### Factory Pattern

**Purpose**: Permissionless, secure deployment

**Ensures**:
- Consistent deployment of stablecoin + consumer contracts
- Proper role wiring (mint/burn permissions)
- No admin shortcuts
- Ownership transfer to user

---

## 🎯 Key Innovation: PoR Secure Mint

**Problem**: Traditional stablecoins vulnerable to "infinite mint" attacks where issuers mint unbacked tokens.

**Solution**: Chainlink Proof-of-Reserve Secure Mint

### How PoR Secure Mint Works

```
Mint Request
    ↓
ACE Policy Check ✓
    ↓
CRE Reserve Verification
    ├─> Query reserve data (off-chain API or cross-chain)
    ├─> DON nodes independently verify
    ├─> Consensus via Chainlink OCR
    ├─> Generate cryptographic proof
    └─> Reserves ≥ Mint Amount?
            ├─> YES: Authorize mint ✓
            └─> NO:  Halt mint, circuit breaker ✗
```

### Real-World Example: TUSD

1. **Reserve Data**: The Network Firm audits TrustToken's bank accounts
2. **Oracle Fetch**: Chainlink oracles fetch audit data
3. **On-chain Feed**: PoR feed updated when reserves deviate beyond threshold
4. **Secure Mint**: New TUSD tokens only minted if reserves ≥ supply
5. **Cryptographic Guarantee**: On-chain proof prevents infinite mint attacks

**Basket implements the same pattern for ALL stablecoins created via the factory.**

---

## 📊 Current State

### ✅ Already Built

- ✓ Factory contract deployed and tested
- ✓ Stablecoin contract with restricted minting logic
- ✓ Minting Consumer contract integrated with CRE + ACE
- ✓ Basic CRE workflow for Proof-of-Reserve validation
- ✓ ACE policy enforcement (whitelist, minting caps)
- ✓ Core minting flow (request → policy → reserve → mint)
- ✓ Backend API server for CRE integration
- ✓ Documentation and setup guides

### 🚧 Remaining for Hackathon Demo

- Frontend dApp (wallet connection, create basket, mint UI)
- Hardening edge cases (CRE failures, policy rejections)
- Demo environment setup (testnet deployment, seeded data)
- Transaction feedback UI (loading states, errors, confirmations)
- Security review checklist completion
- Demo script + pitch deck preparation

---

## 🔄 Minting Flow (Detailed)

### Step-by-Step Process

1. **User Creates Basket**
   - Frontend calls `BasketFactory.createBasket(name, symbol, admin)`
   - Factory deploys `StablecoinERC20` and `MintingConsumerWithACE`
   - Factory wires roles (grants mint/burn to consumer)
   - Factory transfers stablecoin ownership to admin
   - Frontend parses receipt for addresses

2. **User Requests Mint**
   - Frontend calls backend API `/mint` endpoint
   - Backend receives: `{ beneficiary, amount, stablecoinAddress, mintingConsumerAddress }`
   - Backend updates CRE workflow config with addresses

3. **Backend Triggers CRE Workflow**
   - Updates `config.json` with stablecoin + consumer addresses
   - Updates `http_trigger_payload.json` with beneficiary + amount
   - Executes workflow: `bun run main.ts`

4. **CRE Workflow Execution**
   - HTTP trigger receives mint request
   - **ACE Policy Check**: Validates whitelist, volume limits, KYC/AML
   - **PoR Validation**: Queries reserve data (mock in hackathon, real API in production)
   - **DON Consensus**: Decentralized oracle network reaches consensus
   - **Report Generation**: DON-signed cryptographic proof created

5. **On-chain Execution**
   - Workflow calls `MintingConsumerWithACE.onReport(report)`
   - ACE validates policies on-chain
   - Contract verifies DON signature
   - Contract checks reserves ≥ mint amount
   - **If all checks pass**: Mint tokens to beneficiary
   - **If any check fails**: Revert transaction, return error

6. **Frontend Confirmation**
   - Backend returns transaction hash to frontend
   - Frontend displays Etherscan link
   - User sees minted balance in wallet

---

## 🎓 Why This Matters

### For Users
- **Trustless**: No need to trust centralized issuers
- **Transparent**: All enforcement visible on-chain
- **Secure**: Cryptographic guarantees prevent fraud
- **Auditable**: Every mint verifiable on block explorer

### For Institutions
- **Compliant**: ACE enforces regulatory requirements
- **Permissionless**: Deploy stablecoins without intermediaries
- **Scalable**: Factory pattern enables rapid deployment
- **Interoperable**: Works across multiple blockchains

### For DeFi Ecosystem
- **Infrastructure**: Platform for creating compliant stablecoins
- **Composability**: Stablecoins usable in any DeFi protocol
- **Risk Mitigation**: PoR prevents systemic risk from unbacked tokens
- **Adoption**: Bridges TradFi and DeFi with compliance

---

## 🚀 Hackathon Goals

### Success Criteria

1. **Functional Demo**: Live demonstration showing:
   - Create new basket via factory
   - Request mint with policy enforcement
   - CRE validates reserves
   - Tokens minted to user wallet

2. **On-Chain Verification**: All enforcement happens on-chain, verifiable on Sepolia Etherscan

3. **Clear Narrative**: Judges understand:
   - Problem: Centralized stablecoin risk
   - Solution: Trustless, on-chain enforcement
   - Innovation: ACE + CRE integration

4. **Technical Depth**: Showcase:
   - Cryptographic Proof-of-Reserve
   - Policy engine enforcement
   - Factory pattern for permissionless deployment

### Judge-Facing Positioning

- **Infrastructure Play**: Not just another stablecoin, but a **platform for creating them**
- **Elimination of Trust**: No admin keys, no centralized minting, all enforcement cryptographically verified
- **Chainlink Integration**: Core innovation using CRE (reserves) + ACE (compliance)
- **Real-World Applicability**: Regulated institutions, DAOs, protocols can launch compliant stablecoins without building infrastructure from scratch

---

## 📚 Resources

### Project Links
- **GitHub**: [dutraa/basket](https://github.com/dutraa/basket)
- **Deployed Contracts**: [See README for addresses]
- **Demo Environment**: [TBD]

### Chainlink Documentation
- [Chainlink Functions](docs/chainlink/chainlink-functions.md)
- [Proof of Reserve](docs/chainlink/proof-of-reserve.md)
- [ACE Compliance Engine](docs/chainlink/ace-compliance-engine.md)

### Technical Guides
- [Integration Guide](docs/INTEGRATION_GUIDE.md)
- [Quick Start](docs/QUICK_START.md)
- [Project Explanation](docs/Explanation_notion.md)

---

## 🔮 Future Roadmap

### Phase 1: Hackathon (Current)
- ✓ Core contracts and factory
- ✓ CRE + ACE integration
- ✓ Backend API server
- 🚧 Frontend dApp
- 🚧 Demo deployment

### Phase 2: Production Hardening
- Replace mock PoR with real PoR API
- Strengthen policy set (volume caps, allowlists, KYB hooks)
- Move admin to multisig/DAO
- Security audit
- Mainnet deployment

### Phase 3: CCIP Integration
- Cross-chain stablecoin transfers
- Unified policy enforcement across chains
- Cross-Chain Identity (CCID) integration
- Multi-chain reserve aggregation

### Phase 4: Platform Expansion
- Support for multiple reserve types (fiat, crypto, commodities)
- Advanced policy templates
- Governance framework
- Institutional partnerships

---

## 💡 Key Takeaways

1. **Trustless by Design**: All enforcement on-chain via Chainlink oracles
2. **PoR Secure Mint**: Cryptographic guarantee prevents infinite mint attacks
3. **ACE Compliance**: Automated policy enforcement for regulatory compliance
4. **Factory Pattern**: Permissionless deployment of compliant stablecoins
5. **Infrastructure Play**: Platform for creating stablecoins, not just a single token
6. **Real-World Ready**: Designed for regulated institutions and DeFi protocols

---

**Basket: Building the trustless infrastructure for compliant stablecoin issuance.**
