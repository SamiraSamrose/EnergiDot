### Path: `backend/data-aggregator/src/processors/data_processor.py`

# backend/data-aggregator/src/processors/data_processor.py
# Data processing and transformation module

import logging
from typing import Dict, Any, Optional
import json

logger = logging.getLogger(__name__)


class DataProcessor:
    """
    Processes and transforms raw data from various sources
    into standardized format for storage and analysis
    """

    def process_solar_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process NREL solar data"""
        try:
            if not raw_data or 'outputs' not in raw_data:
                return {'average_production': 0, 'peak_production': 0}
            
            outputs = raw_data.get('outputs', {})
            
            # Extract relevant metrics
            processed = {
                'average_production': outputs.get('ac', 0),
                'peak_production': outputs.get('dc', 0),
                'capacity_factor': outputs.get('capacity_factor', 0),
                'annual_energy': outputs.get('annual_energy', 0)
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing solar data: {e}")
            return {'average_production': 0, 'peak_production': 0}

    def process_wind_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process NREL wind data"""
        try:
            if not raw_data:
                return {'average_production': 0, 'wind_speed': 0}
            
            # Extract wind metrics
            processed = {
                'average_production': raw_data.get('power', 0),
                'wind_speed': raw_data.get('wind_speed', 0),
                'wind_direction': raw_data.get('wind_direction', 0),
                'temperature': raw_data.get('temperature', 0)
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing wind data: {e}")
            return {'average_production': 0, 'wind_speed': 0}

    def process_grid_load(self, raw_data: Dict) -> Dict[str, Any]:
        """Process EIA grid load data"""
        try:
            if not raw_data or 'response' not in raw_data:
                return {'current_load': 0}
            
            response = raw_data.get('response', {})
            data = response.get('data', [])
            
            if not data:
                return {'current_load': 0}
            
            latest = data[0]
            
            processed = {
                'current_load': latest.get('value', 0),
                'timestamp': latest.get('period', ''),
                'region': latest.get('respondent', 'unknown')
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing grid load data: {e}")
            return {'current_load': 0}

    def process_entsoe_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process ENTSO-E XML data"""
        try:
            # Simplified XML parsing (would use lxml in production)
            if not raw_data or 'xml_data' not in raw_data:
                return {'total_generation': 0}
            
            # Mock processing for demonstration
            processed = {
                'total_generation': 25000,  # MW
                'renewable_share': 45,  # percentage
                'timestamp': 'current'
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing ENTSO-E data: {e}")
            return {'total_generation': 0}

    def process_weather_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process NOAA weather data"""
        try:
            if not raw_data or 'results' not in raw_data:
                return {'temperature': 0, 'precipitation': 0}
            
            results = raw_data.get('results', [])
            
            if not results:
                return {'temperature': 0, 'precipitation': 0}
            
            # Extract temperature and precipitation
            temp_data = next((r for r in results if r.get('datatype') == 'TMAX'), None)
            precip_data = next((r for r in results if r.get('datatype') == 'PRCP'), None)
            
            processed = {
                'temperature': temp_data.get('value', 0) if temp_data else 0,
                'precipitation': precip_data.get('value', 0) if precip_data else 0,
                'date': temp_data.get('date', '') if temp_data else ''
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing weather data: {e}")
            return {'temperature': 0, 'precipitation': 0}

    def process_forecast_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Process OpenWeatherMap forecast data"""
        try:
            if not raw_data or 'list' not in raw_data:
                return {'cloud_cover': 0, 'wind_speed': 0}
            
            forecast_list = raw_data.get('list', [])
            
            if not forecast_list:
                return {'cloud_cover': 0, 'wind_speed': 0}
            
            # Get latest forecast
            latest = forecast_list[0]
            
            processed = {
                'cloud_cover': latest.get('clouds', {}).get('all', 0),
                'wind_speed': latest.get('wind', {}).get('speed', 0),
                'temperature': latest.get('main', {}).get('temp', 0),
                'humidity': latest.get('main', {}).get('humidity', 0),
                'pressure': latest.get('main', {}).get('pressure', 0)
            }
            
            return processed
        except Exception as e:
            logger.error(f"Error processing forecast data: {e}")
            return {'cloud_cover': 0, 'wind_speed': 0}
