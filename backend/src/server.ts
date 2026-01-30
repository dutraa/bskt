import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as fs from 'fs/promises';
import * as path from 'path';
import { executeDirectMint } from './direct-mint';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const BASKETS_FILE = path.join(__dirname, '../data/baskets.json');

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'BSKT Backend API',
        status: 'running',
        endpoints: {
            health: 'GET /health',
            mint: 'POST /mint',
            baskets: {
                list: 'GET /baskets',
                register: 'POST /baskets'
            }
        }
    });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /baskets - List all registered stablecoin baskets
app.get('/baskets', async (req: Request, res: Response) => {
    try {
        const data = await fs.readFile(BASKETS_FILE, 'utf-8');
        const baskets = JSON.parse(data);
        res.json(baskets);
    } catch (error) {
        console.error('[BASKETS GET ERROR]', error);
        res.status(500).json({ success: false, error: 'Failed to read baskets registry' });
    }
});

// POST /baskets - Register a new basket
app.post('/baskets', async (req: Request, res: Response) => {
    try {
        const { name, symbol, stablecoin, consumer, admin } = req.body;

        if (!name || !symbol || !stablecoin || !consumer || !admin) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, symbol, stablecoin, consumer, admin'
            });
        }

        // Read existing baskets
        const data = await fs.readFile(BASKETS_FILE, 'utf-8');
        const baskets = JSON.parse(data);

        // Add new basket
        const newBasket = {
            name,
            symbol,
            stablecoin,
            consumer,
            admin,
            createdAt: new Date().toISOString()
        };

        baskets.push(newBasket);

        // Save back
        await fs.writeFile(BASKETS_FILE, JSON.stringify(baskets, null, 2));

        console.log(`[BASKET REGISTERED] ${name} (${symbol}) at ${stablecoin}`);
        res.json({ success: true, basket: newBasket });
    } catch (error) {
        console.error('[BASKET POST ERROR]', error);
        res.status(500).json({ success: false, error: 'Failed to update baskets registry' });
    }
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
