import axios from 'axios';
import { getAddress } from 'viem';

// Configuration for Verification
const MOCK_BANK_URL = 'http://localhost:3002/reserves';
const STABLECOIN_ADDRESS = '0x6ab7121d7f6d660f6657f67bf5ef17b1cc09a3dd';
const DECIMALS = 18;

// Simulated On-Chain Supply (in a real run, this would be fetched via viem/cre)
// Let's assume current supply is 900,000 USD
const MOCK_TOTAL_SUPPLY = BigInt(900000) * BigInt(10 ** DECIMALS);

async function verifySecureMint(mintAmountUSD: number) {
    console.log(`\n--- PROOF OF RESERVE VERIFICATION DEMO ---`);
    console.log(`Target Mint Amount: ${mintAmountUSD} USD`);

    try {
        // 1. Fetch Reserves
        console.log(`[PoR] Fetching reserves from Bank API...`);
        const response = await axios.get(MOCK_BANK_URL);
        const reserveData = response.data;
        const reservesWei = BigInt(Math.floor(reserveData.totalReserve * (10 ** DECIMALS)));

        console.log(`[PoR] Bank Reserves: ${reserveData.totalReserve} USD`);
        console.log(`[PoR] On-Chain Total Supply: ${Number(MOCK_TOTAL_SUPPLY / BigInt(10 ** DECIMALS))} USD`);

        // 2. Secure Mint Validation Logic
        const mintAmountWei = BigInt(mintAmountUSD) * BigInt(10 ** DECIMALS);
        const projectedSupply = MOCK_TOTAL_SUPPLY + mintAmountWei;

        console.log(`[PoR] Projected Total Supply: ${Number(projectedSupply / BigInt(10 ** DECIMALS))} USD`);

        if (reservesWei >= projectedSupply) {
            console.log(`\n✅ SUCCESS: PoR Secure Mint Passed!`);
            console.log(`   Reserves (${Number(reservesWei / BigInt(10 ** DECIMALS))} USD) fully back projected supply (${Number(projectedSupply / BigInt(10 ** DECIMALS))} USD).`);
            return true;
        } else {
            const deficit = projectedSupply - reservesWei;
            console.log(`\n❌ FAILED: PoR Secure Mint Rejected!`);
            console.log(`   Insufficient reserves. Deficit: ${Number(deficit / BigInt(10 ** DECIMALS))} USD.`);
            return false;
        }
    } catch (error) {
        console.error(`[PoR] Error during verification:`, error instanceof Error ? error.message : error);
    }
}

async function runTests() {
    // Test Case 1: Valid Mint (Reserves = 1,000,000, Supply = 900,000, Mint = 50,000)
    await verifySecureMint(50000);

    // Test Case 2: Invalid Mint (Reserves = 1,000,000, Supply = 900,000, Mint = 200,000)
    console.log('\n--- Scenario: Attempting to over-mint ---');
    await verifySecureMint(200000);
}

runTests();
