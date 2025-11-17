//### Path: `backend/api-gateway/src/services/redisService.ts`

// backend/api-gateway/src/services/redisService.ts
// Redis caching service for high-performance data access

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
    private static instance: RedisService;
    private client: RedisClientType | null = null;
    private readonly defaultTTL = parseInt(process.env.REDIS_TTL || '3600');

    private constructor() {}

    public static getInstance(): RedisService {
        if (!RedisService.instance) {
            RedisService.instance = new RedisService();
        }
        return RedisService.instance;
    }

    public async connect(): Promise<void> {
        try {
            this.client = createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379'
            });

            this.client.on('error', (err) => {
                logger.error('Redis Client Error:', err);
            });

            await this.client.connect();
            logger.info('Redis connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            logger.info('Redis disconnected');
        }
    }

    public async get(key: string): Promise<string | null> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return await this.client.get(key);
    }

    public async set(key: string, value: string, ttl?: number): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        await this.client.setEx(key, ttl || this.defaultTTL, value);
    }

    public async getJSON<T>(key: string): Promise<T | null> {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }

    public async setJSON(key: string, value: any, ttl?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttl);
    }

    public async del(key: string): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        await this.client.del(key);
    }

    public async exists(key: string): Promise<boolean> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        const result = await this.client.exists(key);
        return result === 1;
    }

    public async increment(key: string): Promise<number> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        return await this.client.incr(key);
    }

    public async expire(key: string, seconds: number): Promise<void> {
        if (!this.client) {
            throw new Error('Redis client not initialized');
        }
        await this.client.expire(key, seconds);
    }
}
