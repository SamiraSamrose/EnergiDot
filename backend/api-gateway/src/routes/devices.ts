//### Path: `backend/api-gateway/src/routes/devices.ts`

// backend/api-gateway/src/routes/devices.ts
// STEP I.03 - On-chain identity device verification endpoints

import { Router, Request, Response } from 'express';
import { SubstrateService } from '../services/substrateService';
import { DatabaseService } from '../services/databaseService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/v1/devices/register - Register energy device
router.post('/register', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { deviceType, capacityKwh, didReference } = req.body;
        const accountId = (req as any).user.accountId;

        const substrateService = SubstrateService.getInstance();
const txHash = await substrateService.registerDevice(
accountId,
deviceType,
capacityKwh,
didReference
);
logger.info(`Device registered: ${deviceType} by ${accountId}`);

    res.status(201).json({
        success: true,
        data: {
            transactionHash: txHash,
            deviceType,
            capacityKwh,
            message: 'Device registered successfully. Awaiting verification.'
        }
    });
} catch (error) {
    logger.error('Error registering device:', error);
    res.status(500).json({
        success: false,
        error: 'Failed to register device'
    });
}
});
// GET /api/v1/devices/verify - Get device verification status
router.get('/verify/:accountId', authenticateToken, async (req: Request, res: Response) => {
try {
const { accountId } = req.params;
const dbService = DatabaseService.getInstance();
    const query = 'SELECT * FROM devices WHERE owner_account_id = $1';
    const result = await dbService.query(query, [accountId]);

    res.json({
        success: true,
        data: result.rows
    });
} catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({
        success: false,
        error: 'Failed to fetch devices'
    });
}
});
// GET /api/v1/devices/list - Get user's registered devices
router.get('/list', authenticateToken, async (req: Request, res: Response) => {
try {
const accountId = (req as any).user.accountId;
const dbService = DatabaseService.getInstance();
    const query = 'SELECT * FROM devices WHERE owner_account_id = $1 ORDER BY registered_at DESC';
    const result = await dbService.query(query, [accountId]);

    res.json({
        success: true,
        data: result.rows
    });
} catch (error) {
    logger.error('Error fetching device list:', error);
    res.status(500).json({
        success: false,
        error: 'Failed to fetch device list'
    });
}
});
// POST /api/v1/devices/production - Record energy production data
router.post('/production', authenticateToken, async (req: Request, res: Response) => {
try {
const { deviceId, energyKwh, timestamp, dataSource } = req.body;
const dbService = DatabaseService.getInstance();
    const query = `
        INSERT INTO energy_production_data (device_id, energy_kwh, timestamp, data_source)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await dbService.query(query, [deviceId, energyKwh, timestamp, dataSource]);

    res.status(201).json({
        success: true,
        data: result.rows[0]
    });
} catch (error) {
    logger.error('Error recording production data:', error);
    res.status(500).json({
        success: false,
        error: 'Failed to record production data'
    });
}
});
export default router;
