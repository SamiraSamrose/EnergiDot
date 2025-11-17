//### Path: `backend/api-gateway/src/routes/staking.ts`

// backend/api-gateway/src/routes/staking.ts
// STEP I.02.b - "Earn by Contributing Energy" - staking endpoints

import { Router, Request, Response } from 'express';
import { SubstrateService } from '../services/substrateService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/v1/staking/stake - Stake ENRG tokens
router.post('/stake', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;
        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
        const txHash = await substrateService.stakeTokens(accountId, amount);

        logger.info(`Tokens staked: ${amount} by ${accountId}`);

        res.status(200).json({
            success: true,
            data: {
                transactionHash: txHash,
                amount,
                message: 'Tokens staked successfully'
            }
        });
    } catch (error) {
        logger.error('Error staking tokens:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to stake tokens'
        });
    }
});

// POST /api/v1/staking/claim - Claim staking rewards
router.post('/claim', authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
        const txHash = await substrateService.claimRewards(accountId);

        logger.info(`Rewards claimed by ${accountId}`);

        res.status(200).json({
            success: true,
            data: {
                transactionHash: txHash,
                message: 'Rewards claimed successfully'
            }
        });
    } catch (error) {
        logger.error('Error claiming rewards:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to claim rewards'
        });
    }
});

// GET /api/v1/staking/info - Get staking information
router.get('/info', authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
        const stake = await substrateService.getUserStake(accountId);

        res.json({
            success: true,
            data: stake
        });
    } catch (error) {
        logger.error('Error fetching staking info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch staking information'
        });
    }
});

// GET /api/v1/staking/leaderboard - Get top stakers and contributors
router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;

        const substrateService = SubstrateService.getInstance();
        const leaderboard = await substrateService.getLeaderboard();

        res.json({
            success: true,
            data: leaderboard.slice(0, limit)
        });
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

export default router;
