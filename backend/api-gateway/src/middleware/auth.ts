//### Path: `backend/api-gateway/src/middleware/auth.ts`

// backend/api-gateway/src/middleware/auth.ts
// JWT authentication middleware

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
    accountId: string;
    iat?: number;
    exp?: number;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }

        const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';

        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                logger.error('JWT verification failed:', err);
                res.status(403).json({
                    success: false,
                    error: 'Invalid or expired token'
                });
                return;
            }

            (req as any).user = decoded as JWTPayload;
            next();
        });
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

export const generateToken = (accountId: string): string => {
    const secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    const expiresIn = process.env.JWT_EXPIRY || '24h';

    return jwt.sign({ accountId }, secret, { expiresIn });
};
