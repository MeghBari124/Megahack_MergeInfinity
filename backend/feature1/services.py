import hashlib
import json
import random
from typing import List, Dict, Any
from shapely.geometry import Polygon
from shapely.ops import transform
import pyproj

def calculate_polygon_area(coordinates: List[Dict[str, float]]) -> float:
    """
    Calculates the area of a polygon defined by lat/lng coordinates in square meters.
    Assumes coordinates are list of {'lat': ..., 'lng': ...}
    """
    if len(coordinates) < 3:
        return 0.0

    # Create a polygon from the coordinates (lng, lat) order for shapely
    poly_coords = [(p['lng'], p['lat']) for p in coordinates]
    polygon = Polygon(poly_coords)

    # Project to a local equal-area projection to get area in meters
    # Using a simple estimation or a proper projection like Albers Equal Area serves best.
    # For global coverage, we typically project to a UTM zone, but for simplicity here 
    # we can use a generic estimation or a specific projection if we knew the zone.
    # Here we use a distinct strategy: project to 3857 (Web Mercator) which distorts area, 
    # OR better: use an AEA projection centered on the polygon.
    
    # Simple strategy: Project to World Equidistant Cylindrical (Plate Carree) is bad for area.
    # Let's use a dynamic projection based on the centroid.
    
    centroid = polygon.centroid
    
    # Construct a localized AEA projection string
    proj_string = f"+proj=aea +lat_1={centroid.y} +lat_2={centroid.y} +lat_0={centroid.y} +lon_0={centroid.x}"
    
    project = pyproj.Transformer.from_proj(
        pyproj.Proj("epsg:4326"), # WGS84
        pyproj.Proj(proj_string),
        always_xy=True
    ).transform

    projected_poly = transform(project, polygon)
    return abs(projected_poly.area)

import os
import google.generativeai as genai

def extract_data_with_gemini(file_content: bytes, mime_type: str = "image/jpeg") -> Dict[str, Any]:
    """
    Extracts land area and details using Gemini Pro Vision.
    Falls back to simulation if GEMINI_API_KEY is not set.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found. Using simulation.")
        return simulate_ocr_fallback(file_content)

    try:
        genai.configure(api_key=api_key)
        # Use a model that supports vision/multimodal input
        model = genai.GenerativeModel('gemini-2.5-flash') 

        # ... (Previous Gemini code remains, just updating prompt) ...
        prompt = """
        You are a legal document analysis expert.
        The image is a LAND DEED / PROPERTY DOCUMENT.

        TASK:
        1. Extract ALL visible text relevant to the property details.
        2. Return the information in a strictly valid JSON object.
        3. The JSON object must have the following keys:
           - "owner_name": (string) Name of the owner(s)
           - "property_address": (string) Full address of the property
           - "village": (string) Village/Town name if explicitly mentioned
           - "district": (string) District name if explicitly mentioned
           - "survey_number": (string) Survey or Plot number
           - "area_text": (string) Area string as found (e.g. "1200 Sq. Ft")
           - "extracted_area_sqm": (float) Numeric area in Square Meters (convert if needed, default 0.0)
           - "registration_number": (string) Document/Registration number
           - "registration_date": (string) Date of registration
           - "authority": (string) Government Authority name
           - "confidence_score": (float) 0.0 to 1.0 (OCR legibility)
           - "summary": (string) Brief summary of the legal notes

        4. If a field is not found, use "NOT FOUND" or null.
        5. Do NOT use markdown code blocks (```json). Just return the raw JSON string.
        """
        # Create a Part object describing the data
        image_part = {
            "mime_type": mime_type,
            "data": file_content
        }

        response = model.generate_content([prompt, image_part])
        
        # Parse JSON from response
        text_resp = response.text.strip()
        # Clean potential markdown code blocks
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.startswith("```"): # sometimes just ```
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
        
        try:
            data = json.loads(text_resp.strip())
        except json.JSONDecodeError:
            # Fallback if Gemini returns plain text instead of JSON
            print("Gemini returned non-JSON text, using fallback parsing.")
            data = {
                "extracted_area_sqm": 0.0,
                "confidence_score": 0.8,
                "text": text_resp,
                "summary": text_resp
            }
            # Try to scrape area at least
            import re
            match = re.search(r"(\d+(\.\d+)?)\s*sq", text_resp.lower())
            if match:
                data["extracted_area_sqm"] = float(match.group(1))

        # Ensure minimal keys exist for consumers
        if "extracted_area_sqm" not in data:
            data["extracted_area_sqm"] = 0.0
        if "confidence_score" not in data:
            data["confidence_score"] = 0.95
        if "text" not in data: # Map summary to text for backward compatibility
             # formatting a nice text block
             data["text"] = f"""Owner: {data.get('owner_name', 'N/A')}
Address: {data.get('property_address', 'N/A')}
Survey No: {data.get('survey_number', 'N/A')}
Area: {data.get('area_text', 'N/A')} ({data.get('extracted_area_sqm', 0)} sqm)
Reg No: {data.get('registration_number', 'N/A')}
Date: {data.get('registration_date', 'N/A')}
Authority: {data.get('authority', 'N/A')}

Notes: {data.get('summary', '')}"""
        
        return data

    except Exception as e:
        print(f"Gemini Error: {e}")
        return simulate_ocr_fallback(file_content, error_msg=str(e))

def simulate_ocr_fallback(file_content: bytes, error_msg: str = None) -> Dict[str, Any]:
    """
    Fallback simulation if Gemini fails or key is missing.
    """
    extracted_text = f"Simulated Extraction (Gemini Fallback). "
    if error_msg:
        extracted_text += f"\\nNote: Gemini API Error ({error_msg})."
        
    simulated_area = 0.0
    confidence = 0.85

    try:
        # Try to treat as text
        text_content = file_content.decode('utf-8')
        if "Area:" in text_content:
            import re
            match = re.search(r"Area:\s*(\d+(\.\d+)?)", text_content)
            if match:
                simulated_area = float(match.group(1))
                extracted_text += "\\n" + text_content
            else:
                simulated_area = random.uniform(500, 5000)
                extracted_text += f"\\nFound content but no explicit Area format."
        else:
             simulated_area = random.uniform(500, 5000)
             extracted_text += f"\\n[OCR] Mock Data: {simulated_area:.2f} sqm"
    except:
        simulated_area = random.uniform(500, 5000)
        extracted_text += f"\\n[OCR] Image processed. Mock Area: {simulated_area:.2f} sqm"
    
    return {
        "extracted_area_sqm": round(simulated_area, 2),
        "confidence_score": confidence,
        "text": extracted_text,
        "owner_name": "Simulated Owner",
        "property_address": "123 Simulated Lane, Digital Village",
        "survey_number": "SIM-999",
        "registration_date": "2024-01-01",
        "summary": "This is simulated data because the AI service was unavailable."
    }

def calculate_confidence_score(gps_accuracy: float, area_match_percent: float, location_match: bool, walk_completeness: float = 1.0) -> float:
    """
    Calculates a composite system confidence score (0-100).
    Weights:
    - Area Match: 40%
    - Location Match: 30%
    - GPS Accuracy: 20%
    - Walk Completeness: 10%
    """
    # Normalize Area Match: 100% if perfect, 0% if > 25% diff
    # area_match_percent is deviation (e.g., 0.05 for 5%)
    area_score = max(0, 100 - (area_match_percent * 400)) # drops fast as error increases
    
    # Location Match
    loc_score = 100 if location_match else 0
    
    # GPS Accuracy (Simulated): Higher is worse. < 5m is perfection.
    # checking simplistic model:
    gps_score = max(0, 100 - (gps_accuracy * 2)) 
    
    # Walk completeness (Simulated 100% for now)
    walk_score = walk_completeness * 100
    
    final_score = (area_score * 0.40) + (loc_score * 0.30) + (gps_score * 0.20) + (walk_score * 0.10)
    return round(final_score, 2)

def validate_land_claim(land_data: Dict[str, Any], doc_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates land claim based on Area and Location.
    Returns detailed validation status and confidence score.
    """
    mapped_area = land_data.get("area_sqm", 0)
    doc_area = doc_data.get("extracted_area_sqm", 0)
    
    # 1. Area Check
    if doc_area == 0:
        return {"status": "REJECTED", "reason": "No area found in document", "confidence": 0}

    diff = abs(mapped_area - doc_area)
    percentage_diff = diff / doc_area
    
    # 2. Location Check (Simulated)
    # In real app, perform Point-in-Polygon check against District/Village boundary database
    # Here we mock it: Assume true if we have GPS data
    location_match = True 
    
    # 3. Calculate Confidence
    # Calculate Average GPS Accuracy from stored points
    coordinates = land_data.get("polygon_coordinates", [])
    avg_accuracy = 5.0
    if coordinates:
        accuracies = [p.get('accuracy', 10.0) for p in coordinates] # Default to 10m if missing
        if accuracies:
            avg_accuracy = sum(accuracies) / len(accuracies)
    
    print(f" Real GPS Accuracy: {avg_accuracy:.2f}m")
    
    system_confidence = calculate_confidence_score(avg_accuracy, percentage_diff, location_match)
    
    status = "REJECTED"
    reason = "Unknown"
    
    if percentage_diff <= 0.05 and location_match:
        status = "VERIFIED"
        reason = f"Perfect Match (Diff: {percentage_diff*100:.2f}%)"
    elif 0.05 < percentage_diff <= 0.15:
        # DB only allows VERIFIED, PENDING, REJECTED. 'REVIEW' is not allowed.
        # We'll map 'REVIEW' to 'PENDING' so it doesn't fail, but note it in reason.
        status = "PENDING" 
        reason = f"Flagged for Review: Minor Deviation (Diff: {percentage_diff*100:.2f}%)"
    elif percentage_diff > 0.15:
        # Map 'FAIL' to 'REJECTED'
        status = "REJECTED"
        reason = f"Significant Deviation (Diff: {percentage_diff*100:.2f}%)"
    elif not location_match:
        status = "REJECTED"
        reason = "Location Mismatch"
        
    return {
        "status": status,
        "reason": reason,
        "system_confidence": system_confidence,
        "details": {
            "area_diff_percent": round(percentage_diff * 100, 2),
            "location_match": location_match
        }
    }

def create_blockchain_hash(land_data: Dict[str, Any], doc_data: Dict[str, Any], validation_result: Dict[str, Any]) -> str:
    """
    Creates a SHA-256 hash simulating a blockchain entry.
    Includes validation details and confidence score.
    """
    combined_data = {
        "land_id": land_data.get("id"),
        "polygon": land_data.get("polygon_coordinates"),
        "mapped_area": land_data.get("area_sqm"),
        "document_hash": hashlib.sha256(json.dumps(doc_data).encode()).hexdigest(), # Hash of doc data
        "confidence_score": validation_result.get("system_confidence"),
        "status": validation_result.get("status"),
        "timestamp": "now" # In real app use datetime.utcnow().isoformat()
    }
    
    data_string = json.dumps(combined_data, sort_keys=True).encode('utf-8')
    return hashlib.sha256(data_string).hexdigest()
