# Production Architecture Considerations

This document outlines the architectural refinements required to transition the BSKT protocol from a hackathon demo to a production-grade stablecoin infrastructure.

## 核心架构原则 (Core Architectural Principle)

**CRE is Upstream of Contracts.**

In the BSKT model, smart contracts do not "request" data from the Chainlink Runtime Environment (CRE). Instead, the CRE workflow acts as the authoritative oracle that "pushes" validated reports to the `MintingConsumer` contracts. This ensures that the decentralized oracle network (DON) has already achieved consensus on Proof-of-Reserve (PoR) and compliance before any on-chain transaction is initiated.

---

## 缺失的生产组件 (Missing Production Components)

To evolve the current demo into a robust product, the following backend components must be implemented between the "Bank/User" and the "CRE Workflow".

### 1. API Gateway Service
The "Mint" user journey currently involves a direct trigger to the CRE. In production, a dedicated **Gateway Service** is required to:

*   **Bank Integration**: Receive raw JSON/MT103 messages from bank webhooks or payment processors.
*   **Data Transformation**: Normalize diverse bank formats into the MT103-compatible payload expected by the CRE workflow.
*   **Validation & Enrichment**: Perform initial sanity checks and enrich the payload with necessary metadata (e.g., wallet mapping).

### 2. Off-Chain Datastore (Audit & Ops)
While the protocol's truth is on-chain, an off-chain datastore (e.g., AWS DynamoDB or Postgres) is essential for operational excellence:

*   **Transaction Mapping**: Maintain a reliable mapping between bank deposit references (`bankReference`), user wallets, and on-chain mint transaction hashes.
*   **Reconciliation**: Enable automated auditing to ensure bank balances match on-chain supply.
*   **User Experience**: Provide users with real-time status updates of their minting journey (e.g., "Bank Deposit Confirmed", "CRE Validating Reserves", "Minting Complete").

### 3. Idempotency & Replay Protection
To prevent double-minting tokens for the same bank deposit:

*   **Deduplication Service**: The gateway must check if a `bankReference` has already been processed before triggering the CRE.
*   **Nonce/UUID Management**: Each mint request should be assigned a unique ID that the CRE workflow validates and the `MintingConsumer` tracks on-chain.

### 4. Contract-First Mint Requests (Optional v2)
The current demo is "Bank-First" (off-chain event triggers mint). If we want to support "User-First" (user clicks "Mint" on-chain):

*   **Event Indexer/Listener**: A service (e.g., Lambda or Subgraph) must monitor the `BasketFactory` or `StablecoinERC20` for `MintRequested` events.
*   **Workflow Invocator**: Upon detecting an event, this service automatically triggers the relevant CRE workflow to validate reserves and finalize the mint.

---

## 团队分工建议 (Team Ownership)

The "in-between" layer is critical for reliability. Future development should focus on:
- **Gateway Implementation**: Normalization and bank integration.
- **Datastore & Indexing**: Audit trail and observability.
- **Idempotency Layer**: Security against double-minting.

---

## MVP Architectural Note (Hackathon Strategy)

For the initial Hackathon MVP, we have simplified the backend to maximize development velocity. The **API Gateway** and **Datastore** roles are currently consolidated into a single **Node.js/Express Backend** (`backend/`):

- **Virtual Gateway**: Handles raw HTTP requests and triggers the CRE.
- **Local Registry**: Uses `baskets.json` as a lightweight discovery service for dynamic contract addresses.
- **Demo Mode**: Utilizes a `mock-bank-api.ts` to simulate reserve signals.

This allows us to demonstrate the full **Secure Mint** and **PoR** logic without the operational overhead of the final production cloud infrastructure.
