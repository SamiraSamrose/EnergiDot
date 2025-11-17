//### Path: `backend/api-gateway/src/middleware/rateLimiter.ts`
// backend/api-gateway/src/middleware/rateLimiter.ts
// Rate limiting middleware

import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../services/redisService';
import { logger } from '../utils/logger';

const RATE_LIMIT_WINDOW = 60;
const MAX_REQUESTS = 100;

export const rateLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `ratelimit:${clientIp}`;

        const redisService = RedisService.getInstance();
        const requests = await redisService.get(key);

        if (!requests) {
            await redisService.set(key, '1', RATE_LIMIT_WINDOW);
            next();
            return;
        }

        const requestCount = parseInt(requests);

        if (requestCount >= MAX_REQUESTS) {
            logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.'
            });
            return;
        }

        await redisService.increment(key);
        next();
    } catch (error) {
        logger.error('Rate limiter error:', error);
        next();
    }
};
