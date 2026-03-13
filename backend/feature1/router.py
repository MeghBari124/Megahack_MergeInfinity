from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict
from .services import calculate_polygon_area, extract_data_with_gemini, validate_land_claim, create_blockchain_hash
from core.supabase_client import supabase
import os
router = APIRouter(prefix="/api/feature1", tags=["mark-my-land"])

class GeoPoint(BaseModel):
    lat: float
    lng: float
    accuracy: float = 5.0 # Default if missing (e.g. older data)

class LandRecordRequest(BaseModel):
    user_id: str
    coordinates: List[GeoPoint]

class VerifyRequest(BaseModel):
    land_id: str
    document_id: str

@router.post("/land/record")
async def record_land(request: LandRecordRequest):
    try:
        print("Received request:", request)
        coords_dict = [{"lat": p.lat, "lng": p.lng, "accuracy": p.accuracy} for p in request.coordinates]
        
        print("Calculating area...")
        try:
            area = calculate_polygon_area(coords_dict)
            print(f"Area calculated: {area}")
        except Exception as e:
            print(f"Area calculation failed: {e}")
            area = 0.0 # Fallback

        print(f"Checking if user exists: {request.user_id}")
        existing = supabase.table("users").select("id").eq("id", request.user_id).execute()
        
        if not existing.data:
            print("User not found, creating new demo user...")
            # Create new user with required fields
            user_data = {
                "id": request.user_id, 
                "phone_number": f"demo-{request.user_id[:8]}", # Truncated to fit 20 chars
                "full_name": "Demo Farmer",
                "email": f"demo-{request.user_id[:8]}@example.com",
                "password_hash": "demo_hash"
            }
            user_res = supabase.table("users").insert(user_data).execute()
            print("User creation successful")
        else:
            print("User exists, skipping creation")
        
        data = {
            "user_id": request.user_id,
            "polygon_coordinates": coords_dict,
            "area_sqm": area,
            "status": "PENDING"
        }
        print("Attempting to insert land record")
        response = supabase.table("lands").insert(data).execute()
        print("Land insert successful")
        
        try:
            # Twilio Notification
            # Only import if needed
            from services.sms_service import send_feature_notification
            # Use a hardcoded number or environmental variable for the demo user
            DEMO_PHONE = "+919999999999" 
            
            if response.data and len(response.data) > 0:
                land_id = response.data[0]['id']
                send_feature_notification(DEMO_PHONE, "Land Mapping", f"Land ID {land_id} mapped successfully! Area: {area:.2f} sqm")
        except Exception as notify_err:
            print(f"Notification failed (non-critical): {notify_err}")

        return {"params": {"area": area}, "data": response.data}

    except Exception as e:
        print(f"CRITICAL ERROR in record_land: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

@router.post("/document/upload")
async def upload_document(land_id: str, file: UploadFile = File(...)):
    # Simulating file upload to storage bucker -> getting URL
    # For now, we'll just mock the URL
    file_url = f"https://mock-storage.com/{file.filename}"
    
    # Read file content for "OCR"
    content = await file.read()
    
    # Determine basic mime type or default to jpeg/text
    mime_type = file.content_type or "text/plain"
    
    ocr_result = extract_data_with_gemini(content, mime_type)
    
    try:
        data = {
            "land_id": land_id,
            "document_url": file_url,
            "extracted_area_sqm": ocr_result["extracted_area_sqm"],
            "confidence_score": ocr_result["confidence_score"]
        }
        response = supabase.table("land_documents").insert(data).execute()
        
        # Merge the OCR text into the response so frontend can display it
        result_data = response.data[0]
        # Pass the full structured object for frontend parsing
        result_data["ocr_data"] = ocr_result
        result_data["extracted_text"] = ocr_result.get("text", "No text extracted")
        return result_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify")
async def verify_claim(request: VerifyRequest):
    try:
        # Fetch Land
        land_res = supabase.table("lands").select("*").eq("id", request.land_id).execute()
        if not land_res.data:
            raise HTTPException(status_code=404, detail="Land not found")
        land = land_res.data[0]
        
        # Fetch Document
        doc_res = supabase.table("land_documents").select("*").eq("id", request.document_id).execute()
        if not doc_res.data:
            raise HTTPException(status_code=404, detail="Document not found")
        doc = doc_res.data[0]
        
        # Validate
        # Note: We are passing the full dictionaries now, not just areas, to support location checking if we had it
        validation_res = validate_land_claim(land, doc["ocr_data"] if "ocr_data" in doc else doc)
        
        # Update Land Status
        status = validation_res["status"]
        supabase.table("lands").update({
            "status": status
        }).eq("id", request.land_id).execute()
        
        # Create Blockchain Event (On Real Blockchain)
        from .blockchain_client import register_land_on_blockchain
        
        # Hash now comes from the ACTUAL smart contract transaction
        tx_hash = register_land_on_blockchain(land, doc, validation_res)
        
        event_data = {
            "land_id": request.land_id,
            "document_id": request.document_id,
            "data_hash": tx_hash # Storing the ETH TX Hash now!
        }
        supabase.table("blockchain_events").insert(event_data).execute()
        
        # Return full validation result to frontend
        return {
            "status": status, 
            "hash": tx_hash, 
            "confidence_score": validation_res["system_confidence"],
            "details": validation_res
        }
        
    except Exception as e:
        print(f"CRITICAL ERROR in verify_claim: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/lands")
async def get_lands():
    """
    Fetches all land records to display on the map.
    """
    try:
        response = supabase.table("lands").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
