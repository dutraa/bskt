import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { executeDirectMint } from './direct-mint';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'BSKT Backend API',
        status: 'running',
        endpoints: {
            health: 'GET /health',
            mint: 'POST /mint'
        }
    });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mint endpoint - triggers CRE workflow
app.post('/mint', async (req: Request, res: Response) => {
    try {
        const { beneficiary, amount, stablecoinAddress, mintingConsumerAddress } = req.body;

        // Validate required fields
        if (!beneficiary || !amount || !stablecoinAddress || !mintingConsumerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: beneficiary, amount, stablecoinAddress, mintingConsumerAddress'
            });
        }

        // Validate Ethereum addresses (basic check)
        const addressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!addressRegex.test(beneficiary) || !addressRegex.test(stablecoinAddress) || !addressRegex.test(mintingConsumerAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Ethereum address format'
            });
        }

        // Validate amount
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be a positive number'
            });
        }

        console.log(`[MINT REQUEST] Beneficiary: ${beneficiary}, Amount: ${amount}`);
        console.log(`[MINT REQUEST] Stablecoin: ${stablecoinAddress}, Consumer: ${mintingConsumerAddress}`);

        // Run the Direct Mint (Simulating CRE / Oracle)
        const result = await executeDirectMint({
            beneficiary,
            amount: amount.toString(),
            stablecoinAddress,
            mintingConsumerAddress
        });

        if (result.success) {
            console.log(`[MINT SUCCESS] Tx: ${result.mintTx}`);
            res.json({
                success: true,
                mintTx: result.mintTx,
                // etherscan: `https://sepolia.etherscan.io/tx/${result.mintTx}`
                etherscan: `https://sepolia.etherscan.io/tx/${result.mintTx}`
            });
        } else {
            console.error(`[MINT FAILED] ${result.error}`);
            res.status(500).json({
                success: false,
                error: result.error || 'Workflow execution failed'
            });
        }
    } catch (error) {
        console.error('[MINT ERROR]', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 BSKT Backend API running on http://localhost:${PORT}`);
    console.log(`📝 CORS enabled for: ${CORS_ORIGIN}`);
    console.log(`🔗 Mode: Direct Mint Simulation (CRE SDK Bypassed)`);
});
