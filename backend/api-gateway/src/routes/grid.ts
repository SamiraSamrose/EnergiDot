//### Path: `backend/api-gateway/src/routes/grid.ts`

// backend/api-gateway/src/routes/grid.ts
// Grid status and real-time data endpoints

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { RedisService } from '../services/redisService';
import { SubstrateService } from '../services/substrateService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/grid/status - Get current grid status
router.get('/status', async (req: Request, res: Response) => {
    try {
        const gridZone = req.query.gridZone as string;

        const redisService = RedisService.getInstance();
        const cacheKey = `grid:status:${gridZone || 'all'}`;
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const dbService = DatabaseService.getInstance();
        const query = `
            SELECT DISTINCT ON (data_type)
                data_type,
                value,
                unit,
                timestamp,
                data_source
            FROM grid_data_cache
            WHERE grid_zone = $1
            ORDER BY data_type, timestamp DESC
        `;
        const result = await dbService.query(query, [gridZone || 'default']);

        const status = {
            gridZone: gridZone || 'all',
            metrics: result.rows,
            lastUpdated: new Date().toISOString()
        };

        await redisService.setJSON(cacheKey, status, 60);

        res.json({
            success: true,
            data: status,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching grid status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch grid status'
        });
    }
});

// GET /api/v1/grid/prices - Get current grid prices
router.get('/prices', async (req: Request, res: Response) => {
    try {
        const gridZone = req.query.gridZone as string;

        const substrateService = SubstrateService.getInstance();
        const price = await substrateService.getGridPrice(gridZone);

        res.json({
            success: true,
            data: {
                gridZone,
                price,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error fetching grid prices:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch grid prices'
        });
    }
});

// GET /api/v1/grid/zones - Get all available grid zones
router.get('/zones', async (req: Request, res: Response) => {
    try {
        const dbService = DatabaseService.getInstance();
        const query = `
            SELECT DISTINCT grid_zone, COUNT(*) as trade_count
            FROM trade_history
            GROUP BY grid_zone
            ORDER BY trade_count DESC
        `;
        const result = await dbService.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching grid zones:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch grid zones'
        });
    }
});

export default router;
