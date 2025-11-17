### Path: `backend/data-aggregator/src/main.py`
# backend/data-aggregator/src/main.py
# STEP III - Main data aggregation service for external energy datasets

import asyncio
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv

from collectors.nrel_collector import NRELCollector
from collectors.eia_collector import EIACollector
from collectors.entsoe_collector import ENTSOECollector
from collectors.noaa_collector import NOAACollector
from collectors.openweather_collector import OpenWeatherCollector
from processors.data_processor import DataProcessor
from database.db_manager import DatabaseManager

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataAggregator:
    """
    Main data aggregation service that collects real-time energy data
    from multiple external sources (NREL, EIA, ENTSO-E, NOAA, etc.)
    """

    def __init__(self):
        self.db_manager = DatabaseManager()
        self.data_processor = DataProcessor()
        
        # Initialize collectors
        self.nrel_collector = NRELCollector()
        self.eia_collector = EIACollector()
        self.entsoe_collector = ENTSOECollector()
        self.noaa_collector = NOAACollector()
        self.openweather_collector = OpenWeatherCollector()
        
        self.scheduler = AsyncIOScheduler()

    async def initialize(self):
        """Initialize database connections"""
        await self.db_manager.connect()
        logger.info("Data aggregator initialized successfully")

    async def collect_solar_data(self):
        """Collect solar production data from NREL"""
        try:
            logger.info("Collecting solar data from NREL...")
            data = await self.nrel_collector.fetch_solar_data()
            
            if data:
                processed = self.data_processor.process_solar_data(data)
                await self.db_manager.store_grid_data(
                    grid_zone='NorthAmerica_1',
                    data_source='NREL',
                    data_type='solar_production',
                    value=processed['average_production'],
                    unit='kW',
                    timestamp=datetime.now()
                )
                logger.info(f"Solar data collected: {processed['average_production']} kW")
        except Exception as e:
            logger.error(f"Error collecting solar data: {e}")

    async def collect_wind_data(self):
        """Collect wind production data from NREL"""
        try:
            logger.info("Collecting wind data from NREL...")
            data = await self.nrel_collector.fetch_wind_data()
            
            if data:
                processed = self.data_processor.process_wind_data(data)
                await self.db_manager.store_grid_data(
                    grid_zone='NorthAmerica_1',
                    data_source='NREL',
                    data_type='wind_production',
                    value=processed['average_production'],
                    unit='kW',
                    timestamp=datetime.now()
                )
                logger.info(f"Wind data collected: {processed['average_production']} kW")
        except Exception as e:
            logger.error(f"Error collecting wind data: {e}")

    async def collect_grid_load_data(self):
        """Collect grid load data from EIA"""
        try:
            logger.info("Collecting grid load data from EIA...")
            data = await self.eia_collector.fetch_grid_load()
            
            if data:
                processed = self.data_processor.process_grid_load(data)
                await self.db_manager.store_grid_data(
                    grid_zone='NorthAmerica_1',
                    data_source='EIA',
                    data_type='grid_load',
                    value=processed['current_load'],
                    unit='MW',
                    timestamp=datetime.now()
                )
                logger.info(f"Grid load data collected: {processed['current_load']} MW")
        except Exception as e:
            logger.error(f"Error collecting grid load data: {e}")

    async def collect_european_grid_data(self):
        """Collect European grid data from ENTSO-E"""
        try:
            logger.info("Collecting European grid data from ENTSO-E...")
            data = await self.entsoe_collector.fetch_generation_data()
            
            if data:
                processed = self.data_processor.process_entsoe_data(data)
                await self.db_manager.store_grid_data(
                    grid_zone='Europe_1',
                    data_source='ENTSO-E',
                    data_type='grid_generation',
                    value=processed['total_generation'],
                    unit='MW',
                    timestamp=datetime.now()
                )
                logger.info(f"European grid data collected: {processed['total_generation']} MW")
        except Exception as e:
            logger.error(f"Error collecting European grid data: {e}")

    async def collect_weather_data(self):
        """Collect weather data from NOAA and OpenWeatherMap"""
        try:
            logger.info("Collecting weather data...")
            
            # NOAA data
            noaa_data = await self.noaa_collector.fetch_weather_data()
            if noaa_data:
                processed_noaa = self.data_processor.process_weather_data(noaa_data)
                await self.db_manager.store_grid_data(
                    grid_zone='default',
                    data_source='NOAA',
                    data_type='temperature',
                    value=processed_noaa['temperature'],
                    unit='celsius',
                    timestamp=datetime.now()
                )
            
            # OpenWeatherMap data
            owm_data = await self.openweather_collector.fetch_forecast()
            if owm_data:
                processed_owm = self.data_processor.process_forecast_data(owm_data)
                await self.db_manager.store_grid_data(
                    grid_zone='default',
                    data_source='OpenWeatherMap',
                    data_type='cloud_cover',
                    value=processed_owm['cloud_cover'],
                    unit='percent',
                    timestamp=datetime.now()
                )
            
            logger.info("Weather data collected successfully")
        except Exception as e:
            logger.error(f"Error collecting weather data: {e}")

    async def run_collection_cycle(self):
        """Run complete data collection cycle"""
        logger.info("Starting data collection cycle...")
        
        tasks = [
            self.collect_solar_data(),
            self.collect_wind_data(),
            self.collect_grid_load_data(),
            self.collect_european_grid_data(),
            self.collect_weather_data()
        ]
        
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("Data collection cycle completed")

    def schedule_jobs(self):
        """Schedule periodic data collection jobs"""
        # Solar and wind data every 5 minutes
        self.scheduler.add_job(
            self.collect_solar_data,
            'interval',
            minutes=5,
            id='solar_collection'
        )
        
        self.scheduler.add_job(
            self.collect_wind_data,
            'interval',
            minutes=5,
            id='wind_collection'
)
# Grid load data every 1 minute
    self.scheduler.add_job(
        self.collect_grid_load_data,
        'interval',
        minutes=1,
        id='grid_load_collection'
    )
    
    # European grid data every 5 minutes
    self.scheduler.add_job(
        self.collect_european_grid_data,
        'interval',
        minutes=5,
        id='european_grid_collection'
    )
    
    # Weather data every 10 minutes
    self.scheduler.add_job(
        self.collect_weather_data,
        'interval',
        minutes=10,
        id='weather_collection'
    )
    
    logger.info("Data collection jobs scheduled")

async def start(self):
    """Start the data aggregator service"""
    await self.initialize()
    
    # Run initial collection
    await self.run_collection_cycle()
    
    # Start scheduler
    self.schedule_jobs()
    self.scheduler.start()
    
    logger.info("Data aggregator service started successfully")
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down data aggregator...")
        self.scheduler.shutdown()
        await self.db_manager.disconnect()
        if name == "main":
aggregator = DataAggregator()
asyncio.run(aggregator.start())

