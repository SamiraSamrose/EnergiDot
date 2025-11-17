### Path: `backend/data-aggregator/src/collectors/nrel_collector.py`
# backend/data-aggregator/src/collectors/nrel_collector.py
# NREL API collector - Solar and wind data from National Renewable Energy Laboratory

import os
import logging
import aiohttp
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class NRELCollector:
    """
    Collects solar and wind energy data from NREL
    Data sources: PVDAQ, NSRDB, WIND Toolkit
    """

    def __init__(self):
        self.api_key = os.getenv('NREL_API_KEY')
        self.base_url = os.getenv('NREL_BASE_URL', 'https://developer.nrel.gov/api')
        
        if not self.api_key:
            logger.warning("NREL API key not configured")

    async def fetch_solar_data(self) -> Optional[Dict]:
        """Fetch solar production data from NREL PVDAQ"""
        try:
            url = f"{self.base_url}/solar/data_query/v1.json"
            params = {
                'api_key': self.api_key,
                'system_id': '2',  # Example system
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("NREL solar data fetched successfully")
                        return data
                    else:
                        logger.error(f"NREL API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching NREL solar data: {e}")
            return None

    async def fetch_wind_data(self) -> Optional[Dict]:
        """Fetch wind production data from NREL WIND Toolkit"""
        try:
            url = f"{self.base_url}/wind-toolkit/v2/wind/wtk-download.json"
            params = {
                'api_key': self.api_key,
                'wkt': 'POINT(-105.18 39.91)',  # Example location
                'attributes': 'wind_speed,wind_direction',
                'names': '2012',
                'utc': 'false',
                'full_name': 'EnergiDot',
                'email': 'info@energidot.io',
                'affiliation': 'EnergiDot',
                'reason': 'Grid optimization'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("NREL wind data fetched successfully")
                        return data
                    else:
                        logger.error(f"NREL Wind API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching NREL wind data: {e}")
            return None

    async def fetch_solar_resource(self, latitude: float, longitude: float) -> Optional[Dict]:
        """Fetch solar resource data for a specific location"""
        try:
            url = f"{self.base_url}/solar/solar_resource/v1.json"
            params = {
                'api_key': self.api_key,
                'lat': latitude,
                'lon': longitude
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching solar resource data: {e}")
            return None
