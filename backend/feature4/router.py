from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage
from feature4.agent import agent_app
from feature5.subsidy_service import get_all_subsidies, get_available_states, CENTRAL_SUBSIDIES, STATE_SUBSIDIES
from core.supabase_client import supabase
import traceback

feature4_router = APIRouter()

class HistoryMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    thread_id: str
    history: Optional[List[HistoryMessage]] = []
    user_state: Optional[Dict] = {}

class FarmerProfileModel(BaseModel):
    user_id: Optional[str] = None
    full_name: Optional[str] = None
    father_husband_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    
    mobile_number: Optional[str] = None
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None
    
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    voter_id: Optional[str] = None
    
    land_size: Optional[Any] = None # Can be str or float from frontend
    land_unit: Optional[str] = "acres"
    survey_number: Optional[str] = None
    land_ownership: Optional[str] = None
    crops: Optional[str] = None
    category: Optional[str] = "General"
    
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    branch_name: Optional[str] = None
    
    profile_completed: Optional[bool] = False
    
    # Extra fields that might be sent
    last_ndvi_value: Optional[float] = None
    crop_loss_percentage: Optional[float] = None
    
    class Config:
        arbitrary_types_allowed = True
        extra = "ignore" # Ignore extra fields if any

class ProfileWrapper(BaseModel):
    profile: FarmerProfileModel

# In-memory fallback (used if DB is unavailable)
farmer_profiles_fallback: Dict[str, Dict] = {}

# Supabase table name for farmer profiles
PROFILES_TABLE = "farmer_profiles"

@feature4_router.get("/schemes")
async def get_schemes(state: Optional[str] = None, category: Optional[str] = None):
    """
    Get all available schemes, optionally filtered by state.
    """
    try:
        result = get_all_subsidies(state=state)
        
        # Add category tags to schemes
        schemes = []
        for s in result.get("central_subsidies", []):
            s["category"] = "Central Scheme"
            schemes.append(s)
        for s in result.get("state_subsidies", []):
            s["category"] = "State Scheme"
            schemes.append(s)
        
        return {
            "schemes": schemes,
            "total": len(schemes),
            "available_states": get_available_states()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@feature4_router.get("/states")
async def get_states():
    """Get list of states with subsidy data."""
    return {"states": get_available_states()}

@feature4_router.post("/profile")
async def save_profile(wrapper: ProfileWrapper, user_id: str = "default"):
    """
    Save farmer profile to Supabase.
    Expects body: { "profile": { ... } }
    """
    try:
        final_user_id = user_id
        profile_data = {}
        profile_data = wrapper.profile.dict(exclude_unset=True)
        
        # Use user_id from body if present, else use query param/default
        final_user_id = profile_data.get("user_id") or user_id
        
        # Ensure user_id is set in the data to be saved
        profile_data["user_id"] = final_user_id
        
        print(f"💾 Saving profile for user_id: {final_user_id}")
        print(f"📦 Profile data keys: {list(profile_data.keys())}")
        
        # Convert land_size to float if needed
        if "land_size" in profile_data and profile_data["land_size"]:
            try:
                profile_data["land_size"] = float(profile_data["land_size"])
            except:
                profile_data["land_size"] = 0.0
                
        if supabase is not None:
            # Check if profile exists
            existing = supabase.table(PROFILES_TABLE).select("user_id").eq("user_id", final_user_id).execute()
            
            if existing.data and len(existing.data) > 0:
                # Update existing profile
                print(f"📝 Updating existing profile for {final_user_id}")
                result = supabase.table(PROFILES_TABLE).update(profile_data).eq("user_id", final_user_id).execute()
            else:
                # Insert new profile
                print(f"➕ Inserting new profile for {final_user_id}")
                result = supabase.table(PROFILES_TABLE).insert(profile_data).execute()
            
            print(f"✅ Supabase operation successful")
            return {"message": "Profile saved to database", "profile": profile_data}
        else:
            print("⚠️ Supabase not connected, using fallback")
            # Fallback to in-memory
            if final_user_id in farmer_profiles_fallback:
                farmer_profiles_fallback[final_user_id].update(profile_data)
            else:
                farmer_profiles_fallback[final_user_id] = profile_data
            return {"message": "Profile saved (in-memory fallback)", "profile": farmer_profiles_fallback[final_user_id]}
    except Exception as e:
        print(f"❌ Error saving profile: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to in-memory on error
        print(f"⚠️ Supabase save failed: {e}")
        traceback.print_exc()
        if final_user_id in farmer_profiles_fallback:
            farmer_profiles_fallback[final_user_id].update(profile_data)
        else:
            farmer_profiles_fallback[final_user_id] = profile_data
        
        return {"message": "Profile saved (fallback)", "profile": farmer_profiles_fallback[final_user_id]}

@feature4_router.get("/profile")
async def get_profile(user_id: str = "default"):
    """Get farmer profile from Supabase."""
    try:
        print(f"🔍 [get_profile] Request for user_id: {user_id}")
        if supabase is not None:
            result = supabase.table(PROFILES_TABLE).select("*").eq("user_id", user_id).execute()
            print(f"✅ [get_profile] DB Result: {len(result.data)} rows found")
            
            if result.data and len(result.data) > 0:
                profile = result.data[0]
                return {"profile": profile}
        
        # Fallback to in-memory
        if user_id in farmer_profiles_fallback:
            return {"profile": farmer_profiles_fallback[user_id]}
        
        return {"profile": None}
    except Exception as e:
        print(f" Supabase read failed, using fallback: {e}")
        if user_id in farmer_profiles_fallback:
            return {"profile": farmer_profiles_fallback[user_id]}
        return {"profile": None}

@feature4_router.post("/chat")
async def chat_with_agent(request: ChatRequest):
    try:
        # Build messages from history
        messages = []
        if request.history:
            for msg in request.history:
                if msg.role == 'user':
                    messages.append(HumanMessage(content=msg.content))
                else:
                    messages.append(AIMessage(content=msg.content))
        else:
            # Fallback: just use the current message
            messages.append(HumanMessage(content=request.message))
        
        # Construct state with full history
        initial_state = {
            "messages": messages,
            "user_profile": request.user_state or {}
        }
        
        # Run agent
        final_state = await agent_app.ainvoke(initial_state)
        
        # Extract response
        last_message = final_state["messages"][-1]
        response_text = last_message.content
        
        return {
            "response": response_text,
            "current_profile": final_state.get("user_profile"),
            "found_schemes": final_state.get("found_schemes"),
            "application_status": final_state.get("application_status"),
            "application_details": final_state.get("application_details")
        }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
