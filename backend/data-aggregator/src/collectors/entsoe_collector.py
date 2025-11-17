### Path: `backend/data-aggregator/src/collectors/entsoe_collector.py`

# backend/data-aggregator/src/collectors/entsoe_collector.py
# ENTSO-E API collector - European grid transparency data

import os
import logging
import aiohttp
from typing import Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ENTSOECollector:
    """
    Collects European grid data from ENTSO-E Transparency Platform
    Data includes: generation, load, prices, cross-border flows
    """

    def __init__(self):
        self.api_key = os.getenv('ENTSOE_API_KEY')
        self.base_url = os.getenv('ENTSOE_BASE_URL', 'https://transparency.entsoe.eu/api')
        
        if not self.api_key:
            logger.warning("ENTSO-E API key not configured")

    async def fetch_generation_data(self) -> Optional[Dict]:
        """Fetch actual generation data per production type"""
        try:
            # Date range for query
            start = (datetime.now() - timedelta(hours=1)).strftime('%Y%m%d%H%M')
            end = datetime.now().strftime('%Y%m%d%H%M')
            
            params = {
                'securityToken': self.api_key,
                'documentType': 'A75',  # Actual generation per type
                'processType': 'A16',
                'outBiddingZone_Domain': '10YDE-VE-------2',  # Germany
                'periodStart': start,
                'periodEnd': end
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.text()
                        logger.info("ENTSO-E generation data fetched successfully")
                        return {'xml_data': data}
                    else:
                        logger.error(f"ENTSO-E API error: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error fetching ENTSO-E generation data: {e}")
            return None

    async def fetch_load_data(self) -> Optional[Dict]:
        """Fetch actual total load"""
        try:
            start = (datetime.now() - timedelta(hours=1)).strftime('%Y%m%d%H%M')
            end = datetime.now().strftime('%Y%m%d%H%M')
            
            params = {
                'securityToken': self.api_key,
                'documentType': 'A65',  # System total load
                'processType': 'A16',
                'outBiddingZone_Domain': '10YDE-VE-------2',
                'periodStart': start,
                'periodEnd': end
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.text()
                        return {'xml_data': data}
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching ENTSO-E load data: {e}")
            return None

    async def fetch_day_ahead_prices(self) -> Optional[Dict]:
        """Fetch day-ahead electricity prices"""
        try:
            start = datetime.now().strftime('%Y%m%d%H%M')
            end = (datetime.now() + timedelta(days=1)).strftime('%Y%m%d%H%M')
            
            params = {
                'securityToken': self.api_key,
                'documentType': 'A44',  # Price document
                'in_Domain': '10YDE-VE-------2',
                'out_Domain': '10YDE-VE-------2',
                'periodStart': start,
                'periodEnd': end
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params, timeout=30) as response:
                    if response.status == 200:
                        data = await response.text()
                        return {'xml_data': data}
                    else:
                        return None
        except Exception as e:
            logger.error(f"Error fetching ENTSO-E prices: {e}")
            return None
