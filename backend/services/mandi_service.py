import httpx
import asyncio
import logging
from typing import Dict, List, Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OGD India Mandi API Config
# Resource: Real-time Market Prices for Various Commodities (Mandi)
MANDI_API_URL = "https://api.data.gov.in/resource/9ef273db-a6ac-4867-80a3-833745848d03"
# Public Key for demonstration (should ideally be in .env)
MANDI_API_KEY = os.environ.get("MANDI_API_KEY", "579b464db66ec23bdd000001cdd3946e448c48ef5ad46d6112d2d64c")

class MandiService:
    _cache = {}
    _last_fetch = 0

    @staticmethod
    async def get_market_prices(commodity: Optional[str] = None, state: Optional[str] = None) -> List[Dict]:
        """
        Fetches real-time price data from Data.gov.in Mandi API.
        """
        params = {
            "api-key": MANDI_API_KEY,
            "format": "json",
            "limit": 50
        }
        
        # Add filters if provided
        filters = {}
        if commodity:
            filters["commodity"] = commodity
        if state:
            filters["state"] = state
            
        # OGD uses 'filters[field]=value' format
        for k, v in filters.items():
            params[f"filters[{k}]"] = v

        try:
            async with httpx.AsyncClient() as client:
                logger.info(f"Fetching Mandi prices for {commodity} in {state}...")
                response = await client.get(MANDI_API_URL, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    records = data.get("records", [])
                    
                    # Clean up records for easy consumption
                    cleaned_records = []
                    for rec in records:
                        cleaned_records.append({
                            "state": rec.get("state"),
                            "district": rec.get("district"),
                            "market": rec.get("market"),
                            "commodity": rec.get("commodity"),
                            "variety": rec.get("variety"),
                            "arrival_date": rec.get("arrival_date"),
                            "min_price": float(rec.get("min_price", 0)),
                            "max_price": float(rec.get("max_price", 0)),
                            "modal_price": float(rec.get("modal_price", 0)),
                            "unit": "Quintal",
                            "currency": "INR"
                        })
                    return cleaned_records
                else:
                    logger.error(f"Mandi API Error: {response.status_code} - {response.text}")
                    return []
        except Exception as e:
            logger.error(f"Failed to fetch Mandi prices: {e}")
            return []

    @staticmethod
    async def get_price_for_crop(crop_name: str, state: str = "Maharashtra") -> Optional[float]:
        """
        Helper to get the average modal price for a specific crop.
        """
        records = await MandiService.get_market_prices(commodity=crop_name, state=state)
        
        if not records:
            # Try without state filter if no results
            records = await MandiService.get_market_prices(commodity=crop_name)
            
        if records:
            # Return mean of modal prices
            prices = [r["modal_price"] for r in records if r["modal_price"] > 0]
            if prices:
                return sum(prices) / len(prices)
        
        return None
