import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const router = Router();

const basketsPath = join(process.cwd(), 'data/baskets.json');

interface BasketConfig {
  name: string;
  symbol: string;
  stablecoinAddress: string;
  mintingConsumerAddress: string;
}

function loadBaskets(): Record<string, BasketConfig> {
  try {
    const data = readFileSync(basketsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[Baskets] Failed to load baskets.json:', error);
    return {};
  }
}

function saveBaskets(baskets: Record<string, BasketConfig>): void {
  writeFileSync(basketsPath, JSON.stringify(baskets, null, 2) + '\n', 'utf-8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const homeBasketsPath = join(homedir(), `baskets-${timestamp}.json`);
  copyFileSync(basketsPath, homeBasketsPath);
  console.log(`[Publish Basket] Copied baskets.json to ${homeBasketsPath}`);
}

const publishBasketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be 10 characters or less'),
  stablecoinAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid stablecoin address'),
  mintingConsumerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid minting consumer address'),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const validationResult = publishBasketSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { name, symbol, stablecoinAddress, mintingConsumerAddress } = validationResult.data;

    const baskets = loadBaskets();

    if (baskets[symbol]) {
      res.status(409).json({
        success: false,
        error: 'BASKET_EXISTS',
        message: `Basket with symbol "${symbol}" already exists`,
      });
      return;
    }

    baskets[symbol] = {
      name,
      symbol,
      stablecoinAddress,
      mintingConsumerAddress,
    };

    saveBaskets(baskets);

    console.log(`[Publish Basket] Created basket: ${symbol} (${name})`);
    console.log(`[Publish Basket] Stablecoin: ${stablecoinAddress}`);
    console.log(`[Publish Basket] MintingConsumer: ${mintingConsumerAddress}`);

    res.json({
      success: true,
      message: `Basket "${symbol}" published successfully`,
      basket: baskets[symbol],
    });
  } catch (error: any) {
    console.error('[Publish Basket Error]', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
    });
  }
});

export { router as publishBasketRouter };
