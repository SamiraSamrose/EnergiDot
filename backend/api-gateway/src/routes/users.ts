//### Path: `backend/api-gateway/src/routes/users.ts`

// backend/api-gateway/src/routes/users.ts
// User management and profile endpoints

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { SubstrateService } from '../services/substrateService';
import { RedisService } from '../services/redisService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/v1/users/register - Register new user
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { accountId, email, username } = req.body;

        const dbService = DatabaseService.getInstance();
        const user = await dbService.createUser(accountId, email, username);

        logger.info(`User registered: ${accountId}`);

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        logger.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user'
        });
    }
});

// GET /api/v1/users/profile - Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.accountId;

        const redisService = RedisService.getInstance();
        const cacheKey = `user:profile:${accountId}`;
        const cached = await redisService.getJSON(cacheKey);

        if (cached) {
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        const dbService = DatabaseService.getInstance();
        const user = await dbService.getUser(accountId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get on-chain stats
        const substrateService = SubstrateService.getInstance();
        const stake = await substrateService.getUserStake(accountId);

        const profile = {
            ...user,
            onChainStats: stake
        };

        await redisService.setJSON(cacheKey, profile, 600);

        res.json({
            success: true,
            data: profile,
            cached: false
        });
    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});

// GET /api/v1/users/stats - Get user energy statistics
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.accountId;

        const dbService = DatabaseService.getInstance();
        
        const statsQuery = `
            SELECT 
                COUNT(CASE WHEN seller_account_id = $1 THEN 1 END) as total_sales,
                COUNT(CASE WHEN buyer_account_id = $1 THEN 1 END) as total_purchases,
                SUM(CASE WHEN seller_account_id = $1 THEN energy_amount ELSE 0 END) as total_energy_sold,
                SUM(CASE WHEN buyer_account_id = $1 THEN energy_amount ELSE 0 END) as total_energy_bought,
                SUM(CASE WHEN seller_account_id = $1 THEN total_price ELSE 0 END) as total_revenue,
                SUM(CASE WHEN buyer_account_id = $1 THEN total_price ELSE 0 END) as total_spent
            FROM trade_history
            WHERE (seller_account_id = $1 OR buyer_account_id = $1) AND status = 'Completed'
        `;

        const result = await dbService.query(statsQuery, [accountId]);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        logger.error('Error fetching user stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user statistics'
        });
    }
});

export default router;
