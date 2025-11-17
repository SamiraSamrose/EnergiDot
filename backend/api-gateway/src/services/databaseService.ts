//### Path: `backend/api-gateway/src/services/databaseService.ts`

// backend/api-gateway/src/services/databaseService.ts
// PostgreSQL database service for caching and off-chain data

import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseService {
    private static instance: DatabaseService;
    private pool: Pool | null = null;

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public async connect(): Promise<void> {
        try {
            this.pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                max: parseInt(process.env.DATABASE_POOL_MAX || '10'),
                min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            await this.pool.query('SELECT NOW()');
            logger.info('Database pool created successfully');

            await this.initializeTables();
        } catch (error) {
            logger.error('Failed to connect to database:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger.info('Database pool closed');
        }
    }

    private async initializeTables(): Promise<void> {
        const createTablesQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255),
                username VARCHAR(100),
                did_reference VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS devices (
                id SERIAL PRIMARY KEY,
                owner_account_id VARCHAR(255) NOT NULL,
                device_type VARCHAR(50) NOT NULL,
                capacity_kwh INTEGER NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                did_reference VARCHAR(255) NOT NULL,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (owner_account_id) REFERENCES users(account_id)
            );

            CREATE TABLE IF NOT EXISTS trade_history (
                id SERIAL PRIMARY KEY,
                order_id VARCHAR(255) UNIQUE NOT NULL,
                seller_account_id VARCHAR(255) NOT NULL,
                buyer_account_id VARCHAR(255),
                energy_amount INTEGER NOT NULL,
                price_per_kwh DECIMAL(18, 8) NOT NULL,
                total_price DECIMAL(18, 8) NOT NULL,
                grid_zone VARCHAR(100) NOT NULL,
                energy_source VARCHAR(50) NOT NULL,
                status VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                FOREIGN KEY (seller_account_id) REFERENCES users(account_id)
            );

            CREATE TABLE IF NOT EXISTS grid_data_cache (
                id SERIAL PRIMARY KEY,
                grid_zone VARCHAR(100) NOT NULL,
                data_source VARCHAR(50) NOT NULL,
                data_type VARCHAR(50) NOT NULL,
                value DECIMAL(18, 8) NOT NULL,
                unit VARCHAR(20),
                timestamp TIMESTAMP NOT NULL,
                cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS energy_production_data (
                id SERIAL PRIMARY KEY,
                device_id INTEGER NOT NULL,
                energy_kwh DECIMAL(18, 4) NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                data_source VARCHAR(50),
                FOREIGN KEY (device_id) REFERENCES devices(id)
            );

            CREATE TABLE IF NOT EXISTS leaderboard_cache (
                id SERIAL PRIMARY KEY,
                account_id VARCHAR(255) NOT NULL,
                username VARCHAR(100),
                total_energy_kwh BIGINT NOT NULL,
                total_trades INTEGER NOT NULL,
                reputation_tier VARCHAR(20),
                rank INTEGER,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES users(account_id)
            );

            CREATE INDEX IF NOT EXISTS idx_trades_seller ON trade_history(seller_account_id);
            CREATE INDEX IF NOT EXISTS idx_trades_buyer ON trade_history(buyer_account_id);
            CREATE INDEX IF NOT EXISTS idx_trades_status ON trade_history(status);
            CREATE INDEX IF NOT EXISTS idx_grid_data_zone ON grid_data_cache(grid_zone);
            CREATE INDEX IF NOT EXISTS idx_grid_data_timestamp ON grid_data_cache(timestamp);
            CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_account_id);
            CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_cache(rank);
        `;

        await this.query(createTablesQuery);
        logger.info('Database tables initialized');
    }

    public async query(text: string, params?: any[]): Promise<any> {
        if (!this.pool) {
            throw new Error('Database pool not initialized');
        }

        try {
            const result = await this.pool.query(text, params);
            return result;
        } catch (error) {
            logger.error('Database query error:', error);
            throw error;
        }
    }

    public async getClient(): Promise<PoolClient> {
        if (!this.pool) {
            throw new Error('Database pool not initialized');
        }
        return await this.pool.connect();
    }

    // User operations
    public async createUser(accountId: string, email?: string, username?: string): Promise<any> {
        const query = `
            INSERT INTO users (account_id, email, username)
            VALUES ($1, $2, $3)
            ON CONFLICT (account_id) DO UPDATE
            SET email = EXCLUDED.email, username = EXCLUDED.username, updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        const result = await this.query(query, [accountId, email, username]);
        return result.rows[0];
    }

    public async getUser(accountId: string): Promise<any> {
        const query = 'SELECT * FROM users WHERE account_id = $1';
        const result = await this.query(query, [accountId]);
        return result.rows[0];
    }

    // Trade operations
    public async cacheTrade(tradeData: any): Promise<void> {
        const query = `
            INSERT INTO trade_history (
                order_id, seller_account_id, buyer_account_id, energy_amount,
                price_per_kwh, total_price, grid_zone, energy_source, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (order_id) DO UPDATE
            SET buyer_account_id = EXCLUDED.buyer_account_id,
                status = EXCLUDED.status,
                completed_at = CASE WHEN EXCLUDED.status = 'Completed' THEN CURRENT_TIMESTAMP ELSE NULL END
        `;

        await this.query(query, [
            tradeData.orderId,
            tradeData.sellerAccountId,
            tradeData.buyerAccountId,
            tradeData.energyAmount,
            tradeData.pricePerKwh,
            tradeData.totalPrice,
            tradeData.gridZone,
            tradeData.energySource,
            tradeData.status
        ]);
    }

    public async getTradeHistory(accountId: string, limit: number = 50): Promise<any[]> {
        const query = `
            SELECT * FROM trade_history
            WHERE seller_account_id = $1 OR buyer_account_id = $1
            ORDER BY created_at DESC
            LIMIT $2
        `;
        const result = await this.query(query, [accountId, limit]);
        return result.rows;
    }

    // Grid data operations
    public async cacheGridData(gridZone: string, dataSource: string, dataType: string, value: number, unit: string, timestamp: Date): Promise<void> {
        const query = `
            INSERT INTO grid_data_cache (grid_zone, data_source, data_type, value, unit, timestamp)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await this.query(query, [gridZone, dataSource, dataType, value, unit, timestamp]);
    }

    public async getLatestGridData(gridZone: string, dataType: string, hours: number = 24): Promise<any[]> {
        const query = `
            SELECT * FROM grid_data_cache
            WHERE grid_zone = $1 AND data_type = $2
                AND timestamp > NOW() - INTERVAL '${hours} hours'
            ORDER BY timestamp DESC
        `;
        const result = await this.query(query, [gridZone, dataType]);
        return result.rows;
    }

    // Leaderboard operations
    public async updateLeaderboard(accountId: string, username: string, totalEnergyKwh: number, totalTrades: number, reputationTier: string, rank: number): Promise<void> {
        const query = `
            INSERT INTO leaderboard_cache (account_id, username, total_energy_kwh, total_trades, reputation_tier, rank)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (account_id) DO UPDATE
            SET username = EXCLUDED.username,
                total_energy_kwh = EXCLUDED.total_energy_kwh,
                total_trades = EXCLUDED.total_trades,
                reputation_tier = EXCLUDED.reputation_tier,
                rank = EXCLUDED.rank,
                updated_at = CURRENT_TIMESTAMP
        `;
        await this.query(query, [accountId, username, totalEnergyKwh, totalTrades, reputationTier, rank]);
    }

    public async getLeaderboard(limit: number = 100): Promise<any[]> {
        const query = `
            SELECT * FROM leaderboard_cache
            ORDER BY rank ASC
            LIMIT $1
        `;
        const result = await this.query(query, [limit]);
        return result.rows;
    }
}
