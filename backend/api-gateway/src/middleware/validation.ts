//### Path: `backend/api-gateway/src/middleware/validation.ts`

// backend/api-gateway/src/middleware/validation.ts
// Request validation middleware

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const schema = Joi.object({
        energyAmount: Joi.number().positive().optional(),
        pricePerKwh: Joi.string().optional(),
        gridZone: Joi.string().optional(),
        energySource: Joi.string().valid('Solar', 'Wind', 'Hydro', 'Geothermal', 'Battery', 'Mixed').optional(),
        expiresInBlocks: Joi.number().positive().optional(),
        orderId: Joi.string().optional(),
        deviceType: Joi.string().optional(),
        capacityKwh: Joi.number().positive().optional(),
        didReference: Joi.string().optional(),
        amount: Joi.string().optional(),
        accountId: Joi.string().optional(),
        email: Joi.string().email().optional(),
        username: Joi.string().min(3).max(50).optional()
    }).unknown(true);

    const { error } = schema.validate(req.body);

    if (error) {
        logger.error('Validation error:', error.details);
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: error.details.map(d => d.message)
        });
        return;
    }

    next();
};
