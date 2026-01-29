import { createWalletClient, createPublicClient, http, parseAbi, encodeAbiParameters, parseAbiParameters, stringToBytes, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL;
// Use a private key from env or a fallback for testing (but env is better)
// NOTE: We need the private key to sign the transaction
// We'll try to read it from the sibling directory .env or expect it in backend/.env
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Missing PRIVATE_KEY in environment variables");
    process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

const client = createWalletClient({
    account,
    chain: sepolia,
    transport: http(RPC_URL)
});

const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(RPC_URL)
});

// MintingConsumerWithACE ABI (minimal)
const abi = parseAbi([
    'function onReport(bytes calldata metadata, bytes calldata report) external',
    'function processMintReport(bytes calldata report) public'
]);

// Constants
const INSTRUCTION_MINT = 1;

interface MintParams {
    beneficiary: string;
    amount: string; // string representing number
    stablecoinAddress: string;
    mintingConsumerAddress: string;
}

export async function executeDirectMint(params: MintParams) {
    console.log(`[DIRECT MINT] Simulating CRE Oracle Report...`);

    // 1. Construct the Report
    // report = abi.encode(uint8 instructionType, address account, uint256 amount, bytes32 bankRef)

    const amountBigInt = BigInt(params.amount) * BigInt(10 ** 18); // Assuming 18 decimals
    const bankRef = stringToBytes("direct-mint-demo", { size: 32 });

    const report = encodeAbiParameters(
        parseAbiParameters('uint8, address, uint256, bytes32'),
        [INSTRUCTION_MINT, params.beneficiary as `0x${string}`, amountBigInt, toHex(bankRef)]
    );

    console.log(`[DIRECT MINT] Encoded Report: ${report}`);

    // 2. Call onReport
    // Metadata can be empty for this demo
    const metadata = '0x';

    try {
        const hash = await client.writeContract({
            address: params.mintingConsumerAddress as `0x${string}`,
            abi: abi,
            functionName: 'onReport',
            args: [metadata, report]
        });

        console.log(`[DIRECT MINT] Transaction sent: ${hash}`);

        // Wait for confirmation
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status === 'success') {
            return {
                success: true,
                mintTx: hash
            };
        } else {
            return {
                success: false,
                error: 'Transaction reverted on-chain'
            };
        }
    } catch (error) {
        console.error('[DIRECT MINT] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
