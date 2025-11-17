//### Path: `backend/api-gateway/src/server.ts`
// backend/api-gateway/src/server.ts
// Main API Gateway server - handles HTTP requests and Substrate RPC communication

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

// Route imports
import tradesRouter from './routes/trades';
import usersRouter from './routes/users';
import devicesRouter from './routes/devices';
import analyticsRouter from './routes/analytics';
import gridRouter from './routes/grid';
import stakingRouter from './routes/staking';

// Service imports
import { SubstrateService } from './services/substrateService';
import { DatabaseService } from './services/databaseService';
import { RedisService } from './services/redisService';

dotenv.config();

const app: Application = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes
app.use('/api/v1/trades', tradesRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/devices', devicesRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/grid', gridRouter);
app.use('/api/v1/staking', stakingRouter);

// Error handling
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
    try {
        // Initialize database
        await DatabaseService.getInstance().connect();
        logger.info('Database connected successfully');

        // Initialize Redis
        await RedisService.getInstance().connect();
        logger.info('Redis connected successfully');

        // Initialize Substrate connection
        await SubstrateService.getInstance().connect();
        logger.info('Substrate node connected successfully');

        // Start Express server
        app.listen(PORT, () => {
            logger.info(`API Gateway running on port ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await SubstrateService.getInstance().disconnect();
    await DatabaseService.getInstance().disconnect();
    await RedisService.getInstance().disconnect();
    process.exit(0);
});

startServer();

export default app;
