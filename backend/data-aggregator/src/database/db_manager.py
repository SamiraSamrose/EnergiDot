### Path: `backend/data-aggregator/src/database/db_manager.py`

# backend/data-aggregator/src/database/db_manager.py
# Database manager for storing collected data

import os
import logging
import asyncpg
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    Manages database connections and data storage operations
    for the data aggregator service
    """

    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv('DATABASE_URL')

    async def connect(self):
        """Establish database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10
            )
            logger.info("Database connection pool created")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

    async def store_grid_data(
        self,
        grid_zone: str,
        data_source: str,
        data_type: str,
        value: float,
        unit: str,
        timestamp: datetime
    ):
        """Store grid data in database"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    '''
                    INSERT INTO grid_data_cache (grid_zone, data_source, data_type, value, unit, timestamp)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ''',
                    grid_zone, data_source, data_type, value, unit, timestamp
                )
                logger.debug(f"Stored {data_type} data for {grid_zone}")
        except Exception as e:
            logger.error(f"Error storing grid data: {e}")

    async def get_latest_data(self, grid_zone: str, data_type: str):
        """Retrieve latest data for a specific zone and type"""
        try:
            async with self.pool.acquire() as conn:
                row = await conn.fetchrow(
                    '''
                    SELECT * FROM grid_data_cache
                    WHERE grid_zone = $1 AND data_type = $2
                    ORDER BY timestamp DESC
                    LIMIT 1
                    ''',
                    grid_zone, data_type
                )
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error retrieving data: {e}")
            return None
            