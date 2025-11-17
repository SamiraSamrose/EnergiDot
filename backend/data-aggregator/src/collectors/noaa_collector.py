### Path: `backend/data-aggregator/src/collectors/noaa_collector.py`

# backend/data-aggregator/src/collectors/noaa_collector.py
# NOAA API collector - Weather and climate data

import os
import logging
import aiohttp
from typing import Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class NOAACollector:
    """
    Collects weather and climate data from NOAA Climate Data Online
    Data includes: temperature, precipitation, wind speed
    """

    def __init__(self):
        self.api_key = os.getenv('NOAA_API_KEY')
        self.base_url = os.getenv('NOAA_BASE_URL', 'https://www.ncdc.noaa.gov/cdo-web/api/v2')
        
        if not self.api_key:
            logger.warning("NOAA API key not configured")

    async def fetch_weather_data(self) -> Optional[Dict]:
        """Fetch current weather observations"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
            
            url = f"{self.base_url}/data"
            headers = {'token': self.api_key}
            params = {
                'datasetid': 'GHCND',  # Daily summaries
                'locationid': 'CITY:US390029',  # Example: Oakland, CA
                'startdate': start_date,
                'enddate': end_date,
                'units': 'metric',
                'limit': 10
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("NOAA weather data fetched successfully")
                        return data
                    else:
                        logger.error(f"NOAA API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching NOAA weather data: {e}")
            return None

    async def fetch_stations(self) -> Optional[Dict]:
        """Fetch available weather stations"""
        try:
            url = f"{self.base_url}/stations"
            headers = {'token': self.api_key}
            params = {
                'locationid': 'CITY:US390029',
                'limit': 10
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching NOAA stations: {e}")
            return None
