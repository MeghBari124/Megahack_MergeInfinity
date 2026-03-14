import os
import logging
from core.supabase_client import supabase

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

def get_latest_sensor_data(user_id=None):
    """
    Fetches the single latest record from the autonomous_sensors table.
    """
    try:
        # Query supabase for the latest entry
        query = supabase.table('autonomous_sensors')\
            .select('*')\
            .order('created_at', desc=True)
        
        if user_id:
            # Strictly get data for this specific user
            response = query.eq('user_id', user_id).limit(1).execute()
        else:
            response = query.limit(1).execute()
        
        # Check if data exists
        logger.info(f" Supabase Query for {user_id or 'latest'}: fetched {len(response.data) if response.data else 0} records")
        if response.data and len(response.data) > 0:
            logger.info(f" Latest Sensor Record: {response.data[0]}")
            return response.data[0]
        
        logger.warning(" No sensor data found in autonomous_sensors table.")
        return None

    except Exception as e:
        print(f"Error fetching sensor data: {e}")
        return {"error": str(e)}
