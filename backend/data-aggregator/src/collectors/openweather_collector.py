### Path: `backend/data-aggregator/src/collectors/openweather_collector.py`

# backend/data-aggregator/src/collectors/openweather_collector.py
# OpenWeatherMap API collector - Real-time weather forecasts

import os
import logging
import aiohttp
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class OpenWeatherCollector:
    """
    Collects weather forecast data from OpenWeatherMap
    Used for solar/wind production predictions
    """

    def __init__(self):
        self.api_key = os.getenv('OPENWEATHER_API_KEY')
        self.base_url = os.getenv('OPENWEATHER_BASE_URL', 'https://api.openweathermap.org/data/2.5')
        
        if not self.api_key:
            logger.warning("OpenWeatherMap API key not configured")

    async def fetch_forecast(self, lat: float = 37.8044, lon: float = -122.2712) -> Optional[Dict]:
        """Fetch 5-day weather forecast (Oakland, CA default)"""
        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info("OpenWeatherMap forecast fetched successfully")
                        return data
                    else:
                        logger.error(f"OpenWeatherMap API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching weather forecast: {e}")
            return None

    async def fetch_current_weather(self, lat: float = 37.8044, lon: float = -122.2712) -> Optional[Dict]:
        """Fetch current weather data"""
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key,
                'units': 'metric'
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching current weather: {e}")
            return None

    async def fetch_uv_index(self, lat: float = 37.8044, lon: float = -122.2712) -> Optional[Dict]:
        """Fetch UV index data (relevant for solar production)"""
        try:
            url = f"{self.base_url}/uvi"
            params = {
                'lat': lat,
                'lon': lon,
                'appid': self.api_key
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching UV index: {e}")
            return None
