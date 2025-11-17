//### Path: `backend/api-gateway/src/routes/analytics.ts`

// backend/api-gateway/src/routes/analytics.ts
// STEP III.01 - Data visualization and analytics endpoints

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { RedisService } from '../services/redisService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/analytics/dashboard - Get dashboard metrics
router.get('/dashboard', async (req: Request, res: Response) => {
    try {
        const redisService = RedisService.getInstance();
        const cacheKey = 'analytics:dashboard';
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const dbService = DatabaseService.getInstance();

        // Total energy traded
        const energyQuery = `
            SELECT 
                SUM(energy_amount) as total_energy_traded,
                COUNT(*) as total_trades,
                COUNT(DISTINCT seller_account_id) as unique_sellers,
                COUNT(DISTINCT buyer_account_id) as unique_buyers
            FROM trade_history
            WHERE status IN ('Completed', 'Matched')
        `;
        const energyResult = await dbService.query(energyQuery);

        // Energy by source
        const sourceQuery = `
            SELECT 
                energy_source,
                SUM(energy_amount) as total_energy,
                COUNT(*) as trade_count
            FROM trade_history
            WHERE status IN ('Completed', 'Matched')
            GROUP BY energy_source
            ORDER BY total_energy DESC
        `;
        const sourceResult = await dbService.query(sourceQuery);

        // Recent trades
        const recentQuery = `
            SELECT * FROM trade_history
            ORDER BY created_at DESC
            LIMIT 10
        `;
        const recentResult = await dbService.query(recentQuery);

        const dashboard = {
            summary: energyResult.rows[0],
            byEnergySource: sourceResult.rows,
            recentTrades: recentResult.rows,
            timestamp: new Date().toISOString()
        };

        await redisService.setJSON(cacheKey, dashboard, 120);

        res.json({
            success: true,
            data: dashboard,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching dashboard analytics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard analytics'
        });
    }
});

// GET /api/v1/analytics/grid-performance - Get grid performance metrics
router.get('/grid-performance', async (req: Request, res: Response) => {
    try {
        const gridZone = req.query.gridZone as string;
        const hours = parseInt(req.query.hours as string) || 24;

        const dbService = DatabaseService.getInstance();
        const query = `
            SELECT 
                data_type,
                AVG(value) as avg_value,
                MIN(value) as min_value,
                MAX(value) as max_value,
                unit,
                DATE_TRUNC('hour', timestamp) as hour
            FROM grid_data_cache
            WHERE grid_zone = $1
                AND timestamp > NOW() - INTERVAL '${hours} hours'
            GROUP BY data_type, unit, hour
            ORDER BY hour DESC
        `;
        const result = await dbService.query(query, [gridZone || 'all']);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching grid performance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch grid performance'
        });
    }
});

// GET /api/v1/analytics/price-trends - Get price trend data
router.get('/price-trends', async (req: Request, res: Response) => {
    try {
        const gridZone = req.query.gridZone as string;
        const days = parseInt(req.query.days as string) || 7;

        const dbService = DatabaseService.getInstance();
        const query = `
            SELECT 
                DATE_TRUNC('day', created_at) as day,
                AVG(price_per_kwh) as avg_price,
                MIN(price_per_kwh) as min_price,
                MAX(price_per_kwh) as max_price,
                SUM(energy_amount) as total_volume
            FROM trade_history
            WHERE created_at > NOW() - INTERVAL '${days} days'
                ${gridZone ? 'AND grid_zone = $1' : ''}
            GROUP BY day
            ORDER BY day DESC
        `;
        const params = gridZone ? [gridZone] : [];
        const result = await dbService.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching price trends:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price trends'
        });
    }
});

// GET /api/v1/analytics/energy-mix - Get renewable energy mix
router.get('/energy-mix', async (req: Request, res: Response) => {
    try {
        const period = req.query.period as string || 'day';

        const dbService = DatabaseService.getInstance();
        const query = `
            SELECT 
                energy_source,
                SUM(energy_amount) as total_energy,
                COUNT(*) as trade_count,
                ROUND((SUM(energy_amount)::numeric / (SELECT SUM(energy_amount) FROM trade_history WHERE status = 'Completed') * 100), 2) as percentage
            FROM trade_history
            WHERE status = 'Completed'
                AND created_at > NOW() - INTERVAL '1 ${period}'
            GROUP BY energy_source
            ORDER BY total_energy DESC
        `;
        const result = await dbService.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching energy mix:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch energy mix'
        });
    }
});

export default router;
