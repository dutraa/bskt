import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// In-memory reserve data for the demo
let reserveData = {
    totalReserve: 1000000.00, // $1,000,000 USD
    currency: 'USD',
    lastUpdated: new Date().toISOString()
};

// Endpoint for CRE workflow to fetch reserve data
app.get('/reserves', (req: Request, res: Response) => {
    console.log(`[MOCK BANK] Reserve query received. Current reserves: ${reserveData.totalReserve} ${reserveData.currency}`);
    res.json(reserveData);
});

// Admin endpoint to update reserves (for demo purposes)
app.post('/admin/update-reserves', (req: Request, res: Response) => {
    const { amount } = req.body;
    if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' });
    }
    reserveData.totalReserve = amount;
    reserveData.lastUpdated = new Date().toISOString();
    console.log(`[MOCK BANK] Reserves updated to: ${reserveData.totalReserve}`);
    res.json({ success: true, newReserves: reserveData.totalReserve });
});

app.listen(PORT, () => {
    console.log(`🏦 Mock Bank API running on http://localhost:${PORT}`);
    console.log(`📊 Reserve endpoint: http://localhost:${PORT}/reserves`);
});
