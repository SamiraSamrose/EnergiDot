### Path: `backend/data-aggregator/src/collectors/eia_collector.py`
# backend/data-aggregator/src/collectors/eia_collector.py
# EIA API collector - US Energy Information Administration data

import os
import logging
import aiohttp
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class EIACollector:
    """
    Collects US energy data from EIA Open Data API
    Data includes: grid load, generation, prices, consumption
    """

    def __init__(self):
        self.api_key = os.getenv('EIA_API_KEY')
        self.base_url = os.getenv('EIA_BASE_URL', 'https://api.eia.gov')
        
        if not self.api_key:
            logger.warning("EIA API key not configured")

    async def fetch_grid_load(self) -> Optional[Dict]:
        """Fetch real-time grid load data"""
        try:
            url = f"{self.base_url}/v2/electricity/rto/region-data/data/"
            params = {
                'api_key': self.api_key,
                'frequency': 'hourly',
                'data[0]': 'value',
                'facets[type][]': 'D',  # Demand
                'sort[0][column]': 'period',
                'sort[0][direction]': 'desc',
                'length': 1
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("EIA grid load data fetched successfully")
                        return data
                    else:
                        logger.error(f"EIA API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching EIA grid load: {e}")
            return None

    async def fetch_generation_data(self) -> Optional[Dict]:
        """Fetch electricity generation data by source"""
        try:
            url = f"{self.base_url}/v2/electricity/rto/fuel-type-data/data/"
            params = {
                'api_key': self.api_key,
                'frequency': 'hourly',
                'data[0]': 'value',
                'sort[0][column]': 'period',
                'sort[0][direction]': 'desc',
                'length': 10
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("EIA generation data fetched successfully")
                        return data
                    else:
                        logger.error(f"EIA API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching EIA generation data: {e}")
            return None

    async def fetch_electricity_prices(self) -> Optional[Dict]:
        """Fetch electricity price data"""
        try:
            url = f"{self.base_url}/v2/electricity/retail-sales/data/"
            params = {
                'api_key': self.api_key,
                'frequency': 'monthly',
                'data[0]': 'price',
                'sort[0][column]': 'period',
                'sort[0][direction]': 'desc',
                'length': 5
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching electricity prices: {e}")
            return None
