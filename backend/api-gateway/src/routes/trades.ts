//### Path: `backend/api-gateway/src/routes/trades.ts`

// backend/api-gateway/src/routes/trades.ts
// STEP I.02.a - Real-time energy trading dashboard endpoints

import { Router, Request, Response } from 'express';
import { SubstrateService } from '../services/substrateService';
import { DatabaseService } from '../services/databaseService';
import { RedisService } from '../services/redisService';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/v1/trades/create - Create new energy sell order
router.post('/create', authenticateToken, validateRequest, async (req: Request, res: Response) => {
    try {
        const {
            energyAmount,
            pricePerKwh,
            gridZone,
            energySource,
            expiresInBlocks
        } = req.body;

        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
        const txHash = await substrateService.createSellOrder(
            accountId,
            energyAmount,
            pricePerKwh,
            gridZone,
            energySource,
            expiresInBlocks
        );

        // Cache trade in database
        const dbService = DatabaseService.getInstance();
        await dbService.cacheTrade({
            orderId: txHash,
            sellerAccountId: accountId,
            buyerAccountId: null,
            energyAmount,
            pricePerKwh,
            totalPrice: energyAmount * pricePerKwh,
            gridZone,
            energySource,
            status: 'Open'
        });

        logger.info(`Energy order created: ${txHash}`);

        res.status(201).json({
            success: true,
            data: {
                orderId: txHash,
                status: 'pending',
                message: 'Sell order created successfully'
            }
        });
    } catch (error) {
        logger.error('Error creating sell order:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create sell order'
        });
    }
});

// POST /api/v1/trades/buy - Buy energy from existing order
router.post('/buy', authenticateToken, validateRequest, async (req: Request, res: Response) => {
    try {
        const { orderId } = req.body;
        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
        const txHash = await substrateService.buyEnergy(accountId, orderId);

        // Update trade in database
        const dbService = DatabaseService.getInstance();
        await dbService.cacheTrade({
            orderId,
            buyerAccountId: accountId,
            status: 'Matched'
        });

        logger.info(`Energy purchased: ${orderId} by ${accountId}`);

        res.status(200).json({
            success: true,
            data: {
                transactionHash: txHash,
                orderId,
                message: 'Energy purchased successfully'
            }
        });
    } catch (error) {
        logger.error('Error buying energy:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to purchase energy'
        });
    }
});

// GET /api/v1/trades/history - Get user trade history
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.accountId;
        const limit = parseInt(req.query.limit as string) || 50;

        // Check cache first
        const redisService = RedisService.getInstance();
        const cacheKey = `trades:history:${accountId}:${limit}`;
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        // Fetch from database
        const dbService = DatabaseService.getInstance();
        const trades = await dbService.getTradeHistory(accountId, limit);

        // Cache for 5 minutes
        await redisService.setJSON(cacheKey, trades, 300);

        res.json({
            success: true,
            data: trades,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching trade history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trade history'
        });
    }
});

// GET /api/v1/trades/active - Get all active orders
router.get('/active', async (req: Request, res: Response) => {
    try {
        const gridZone = req.query.gridZone as string;
        const energySource = req.query.energySource as string;

        const redisService = RedisService.getInstance();
        const cacheKey = `trades:active:${gridZone || 'all'}:${energySource || 'all'}`;
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const dbService = DatabaseService.getInstance();
        let query = 'SELECT * FROM trade_history WHERE status = $1';
        const params: any[] = ['Open'];

        if (gridZone) {
            query += ' AND grid_zone = $2';
            params.push(gridZone);
        }

        if (energySource) {
            query += ` AND energy_source = $${params.length + 1}`;
            params.push(energySource);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await dbService.query(query, params);

        await redisService.setJSON(cacheKey, result.rows, 60);

        res.json({
            success: true,
            data: result.rows,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching active orders:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active orders'
        });
    }
});

// GET /api/v1/trades/:orderId - Get specific order details
router.get('/:orderId', async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;

        const redisService = RedisService.getInstance();
        const cacheKey = `trade:${orderId}`;
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const substrateService = SubstrateService.getInstance();
        const order = await substrateService.getEnergyOrder(orderId);

        await redisService.setJSON(cacheKey, order, 300);

        res.json({
            success: true,
            data: order,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching order details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order details'
        });
    }
});

export default router;
