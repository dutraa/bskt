# BSKT Demo Execution Guide

Follow these steps to run the BSKT end-to-end demo, covering contract registration and Proof-of-Reserve (PoR) Secure Minting.

## 🏁 Step 1: Start the Demo Backend

Run the orchestrator script to start both the **Mock Bank API** and the **BSKT Backend Gateway**:

```bash
bash scripts/start-demo.sh
```

- **Mock Bank (Port 3002)**: Simulates the reserve custodian.
- **Backend Gateway (Port 3001)**: Manages the basket registry and triggers the CRE.

---

## 🏗️ Step 2: Register a New Stablecoin (Simulating Factory)

When devdutra's Factory contract creates a new basket, it must be registered with the gateway so the CRE knows the contract addresses.

Use this command to register a test stablecoin (`AUDT`):

```bash
# From project root:
wsl bash -c "curl -s -X POST http://localhost:3001/baskets -H 'Content-Type: application/json' -d @\$(wslpath -a ./backend/test_basket.json)"
```

---

## 🛡️ Step 3: Run the PoR Secure Mint Verification

To demonstrate the "Killer Feature" (checking on-chain supply vs off-chain reserves), run the verification script:

```bash
# Using 'bun' from your environment
wsl bun run ./backend/src/verify-por.ts
```

This will run two scenarios:
1.  **Valid Mint**: Reserves cover the supply + mint.
2.  **Over-Minting**: Reserves are insufficient, and the mint is rejected.

---

## 🧪 Step 4: Test a Full Mint Trigger

Once the backend is running and the basket is registered, you can simulate a bank webhook triggering a mint for a specific user:

```bash
bash scripts/test-mint.sh
```

---

## 🛠️ Port Reference
- `3001`: Main Backend API (Registry & Minting)
- `3002`: Mock Bank API (Reserves)
