"""
Subsidy Service Module - Agricultural Subsidies for Farm Equipment

This module provides information about government subsidies available for:
- Farm equipment purchases
- Repairs and maintenance
- Replacement parts

Data sources:
- Central Government schemes (PM-KISAN, PM-KUSUM, etc.)
- State-level agricultural subsidies
- Bank loan schemes for farmers

Note: Initial implementation uses sample data. 
Can be extended to fetch from official government APIs.
"""

from datetime import datetime, timedelta
from typing import Optional
import os
import re
import httpx
from bs4 import BeautifulSoup


class Subsidy:
    def __init__(
        self,
        scheme_name: str,
        description: str,
        subsidy_percentage: float,
        max_amount: float,
        eligibility: list[str],
        applicable_equipment: list[str],
        source: str,
        application_url: str,
        valid_until: Optional[str] = None,
        state: Optional[str] = None
    ):
        self.scheme_name = scheme_name
        self.description = description
        self.subsidy_percentage = subsidy_percentage
        self.max_amount = max_amount
        self.eligibility = eligibility
        self.applicable_equipment = applicable_equipment
        self.source = source
        self.application_url = application_url
        self.valid_until = valid_until
        self.state = state
    
    def to_dict(self) -> dict:
        return {
            "scheme_name": self.scheme_name,
            "description": self.description,
            "subsidy_percentage": self.subsidy_percentage,
            "max_amount": self.max_amount,
            "formatted_max_amount": f"₹{self.max_amount:,.0f}",
            "eligibility": self.eligibility,
            "applicable_equipment": self.applicable_equipment,
            "source": self.source,
            "application_url": self.application_url,
            "valid_until": self.valid_until,
            "state": self.state
        }

SCRAPE_SOURCES = [
    {
        "scheme_name": "Sub-Mission on Agricultural Mechanization (SMAM)",
        "url": "https://agrimachinery.nic.in/",
        "source": "Ministry of Agriculture & Farmers Welfare"
    },
    {
        "scheme_name": "PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)",
        "url": "https://pmkusum.mnre.gov.in/",
        "source": "Ministry of New and Renewable Energy"
    },
    {
        "scheme_name": "Rashtriya Krishi Vikas Yojana (RKVY)",
        "url": "https://rkvy.da.gov.in/",
        "source": "Ministry of Agriculture"
    },
    {
        "scheme_name": "National Food Security Mission (NFSM)",
        "url": "https://nfsm.gov.in/",
        "source": "Ministry of Agriculture"
    },
    {
        "scheme_name": "Agriculture Infrastructure Fund (AIF)",
        "url": "https://agriinfra.dac.gov.in/",
        "source": "Ministry of Agriculture"
    }
]

_SCRAPE_CACHE = {
    "timestamp": None,
    "overrides": {}
}

def _scrape_enabled() -> bool:
    return os.getenv("SUBSIDY_SCRAPE_ENABLED", "true").lower() == "true"

def _scrape_ttl_minutes() -> int:
    try:
        return int(os.getenv("SUBSIDY_SCRAPE_TTL_MINUTES", "1440"))
    except ValueError:
        return 1440

def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()

def _extract_description(soup: BeautifulSoup) -> Optional[str]:
    meta = soup.find("meta", attrs={"name": "description"})
    if meta and meta.get("content"):
        return _clean_text(meta["content"])
    og = soup.find("meta", attrs={"property": "og:description"})
    if og and og.get("content"):
        return _clean_text(og["content"])
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return _clean_text(h1.get_text(" ", strip=True))
    return None

def _scrape_scheme_page(url: str) -> Optional[str]:
    try:
        response = httpx.get(url, follow_redirects=True, timeout=10.0)
        if response.status_code >= 400:
            return None
        soup = BeautifulSoup(response.text, "html.parser")
        return _extract_description(soup)
    except Exception:
        return None

def _get_scrape_overrides() -> dict:
    # DISABLED: Web scraping causes timeouts - return empty dict
    return {}


# Central Government Schemes Database
CENTRAL_SUBSIDIES = [
    Subsidy(
        scheme_name="Sub-Mission on Agricultural Mechanization (SMAM)",
        description="Provides subsidies for purchase of various agricultural machinery and equipment to promote farm mechanization.",
        subsidy_percentage=50.0,
        max_amount=500000.0,
        eligibility=[
            "Individual farmers",
            "Farmer Producer Organizations (FPOs)",
            "Self Help Groups (SHGs)",
            "Cooperative Societies"
        ],
        applicable_equipment=[
            "Tractors",
            "Power Tillers",
            "Rotavators",
            "Seed Drills",
            "Combine Harvesters",
            "Sprayers",
            "Water Pumps"
        ],
        source="Ministry of Agriculture & Farmers Welfare",
        application_url="https://agrimachinery.nic.in/"
    ),
    Subsidy(
        scheme_name="PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)",
        description="Promotes solar pumps and grid-connected solar power plants for farmers.",
        subsidy_percentage=60.0,
        max_amount=200000.0,
        eligibility=[
            "Individual farmers",
            "Water User Associations",
            "Farmer Producer Organizations"
        ],
        applicable_equipment=[
            "Solar Water Pumps",
            "Solar Irrigation Systems",
            "Grid-connected Solar Plants"
        ],
        source="Ministry of New and Renewable Energy",
        application_url="https://pmkusum.mnre.gov.in/"
    ),
    Subsidy(
        scheme_name="Rashtriya Krishi Vikas Yojana (RKVY)",
        description="Provides flexibility to states to implement various agricultural development programs including mechanization.",
        subsidy_percentage=40.0,
        max_amount=250000.0,
        eligibility=[
            "Small and Marginal Farmers",
            "SC/ST Farmers (additional 10% subsidy)",
            "Women Farmers (additional 10% subsidy)"
        ],
        applicable_equipment=[
            "All Farm Machinery",
            "Processing Equipment",
            "Storage Facilities"
        ],
        source="Ministry of Agriculture",
        application_url="https://rkvy.da.gov.in/"
    ),
    Subsidy(
        scheme_name="National Food Security Mission (NFSM)",
        description="Supports distribution of improved agricultural implements for enhancing production of rice, wheat, pulses.",
        subsidy_percentage=50.0,
        max_amount=150000.0,
        eligibility=[
            "Farmers growing rice, wheat, or pulses",
            "Both owners and tenant farmers"
        ],
        applicable_equipment=[
            "Seed Drills",
            "Sprayers",
            "Weeders",
            "Threshers",
            "Pump Sets"
        ],
        source="Ministry of Agriculture",
        application_url="https://nfsm.gov.in/"
    ),
    Subsidy(
        scheme_name="Agriculture Infrastructure Fund (AIF)",
        description="Credit facility for investment in viable projects for post-harvest management and community farming assets.",
        subsidy_percentage=35.0,  # Interest subvention
        max_amount=2000000.0,
        eligibility=[
            "Farmers",
            "FPOs",
            "Agri-entrepreneurs",
            "Start-ups"
        ],
        applicable_equipment=[
            "Cold Storage",
            "Warehouses",
            "Processing Units",
            "Sorting and Grading Units"
        ],
        source="Ministry of Agriculture",
        application_url="https://agriinfra.dac.gov.in/"
    )
]

# State-level subsidies (sample data for major agricultural states)
STATE_SUBSIDIES = {
    "Maharashtra": [
        Subsidy(
            scheme_name="Dr. Babasaheb Ambedkar Krishi Swavalamban Yojana",
            description="Special subsidy scheme for SC category farmers for farm mechanization.",
            subsidy_percentage=100.0,
            max_amount=300000.0,
            eligibility=["SC category farmers", "Minimum 1 acre land ownership"],
            applicable_equipment=["Tractors", "Power Tillers", "All Farm Implements"],
            source="Maharashtra Agriculture Department",
            application_url="https://mahadbt.maharashtra.gov.in/",
            state="Maharashtra"
        ),
        Subsidy(
            scheme_name="Magel Tyala Shet Tale (Farm Pond Scheme)",
            description="Subsidized farm ponds with motor and pipeline for irrigation.",
            subsidy_percentage=75.0,
            max_amount=75000.0,
            eligibility=["All farmers with minimum 0.5 hectare land"],
            applicable_equipment=["Farm Ponds", "Motors", "Pipelines"],
            source="Maharashtra Agriculture Department", 
            application_url="https://mahadbt.maharashtra.gov.in/",
            state="Maharashtra"
        )
    ],
    "Punjab": [
        Subsidy(
            scheme_name="Punjab Farm Mechanization Scheme",
            description="Subsidy on agricultural machinery to promote crop diversification.",
            subsidy_percentage=50.0,
            max_amount=400000.0,
            eligibility=["All farmers", "Priority to small/marginal farmers"],
            applicable_equipment=["Paddy Transplanters", "Happy Seeders", "Super SMS", "Mulchers"],
            source="Punjab Agriculture Department",
            application_url="https://agri.punjab.gov.in/",
            state="Punjab"
        )
    ],
    "Uttar Pradesh": [
        Subsidy(
            scheme_name="Krishi Yantra Subsidy Yojana",
            description="State agricultural machinery subsidy scheme.",
            subsidy_percentage=50.0,
            max_amount=350000.0,
            eligibility=["All registered farmers", "Priority to small farmers"],
            applicable_equipment=["Tractors", "Harvesters", "Rotavators", "Threshers"],
            source="UP Agriculture Department",
            application_url="https://upagriculture.com/",
            state="Uttar Pradesh"
        )
    ],
    "Madhya Pradesh": [
        Subsidy(
            scheme_name="Kisan Samridhi Yojana",
            description="Comprehensive farm mechanization support scheme.",
            subsidy_percentage=40.0,
            max_amount=300000.0,
            eligibility=["Small and marginal farmers", "SC/ST farmers get additional 10%"],
            applicable_equipment=["All Farm Machinery", "Irrigation Equipment"],
            source="MP Agriculture Department",
            application_url="https://mpkrishi.mp.gov.in/",
            state="Madhya Pradesh"
        )
    ],
    "Gujarat": [
        Subsidy(
            scheme_name="GGRC Farm Equipment Scheme",
            description="Gujarat Green Revolution Company farm mechanization scheme.",
            subsidy_percentage=45.0,
            max_amount=250000.0,
            eligibility=["All farmers", "BPL farmers get higher subsidy"],
            applicable_equipment=["Micro Irrigation", "Farm Machinery", "Solar Pumps"],
            source="GGRC, Gujarat",
            application_url="https://ggrc.co.in/",
            state="Gujarat"
        )
    ]
}


def get_central_subsidies(equipment_type: Optional[str] = None) -> list[dict]:
    """
    Get central government subsidies.
    
    Args:
        equipment_type: Optional filter by equipment type
        
    Returns:
        List of applicable central subsidies
    """
    subsidies = []
    overrides = _get_scrape_overrides()
    
    for subsidy in CENTRAL_SUBSIDIES:
        if equipment_type:
            # Check if equipment type matches any applicable equipment
            equipment_lower = equipment_type.lower()
            applicable = [eq.lower() for eq in subsidy.applicable_equipment]
            
            if any(equipment_lower in eq or eq in equipment_lower for eq in applicable):
                subsidy_dict = subsidy.to_dict()
                override = overrides.get(subsidy.scheme_name)
                if override:
                    subsidy_dict.update(override)
                subsidies.append(subsidy_dict)
            elif "all" in ' '.join(applicable).lower():
                subsidy_dict = subsidy.to_dict()
                override = overrides.get(subsidy.scheme_name)
                if override:
                    subsidy_dict.update(override)
                subsidies.append(subsidy_dict)
        else:
            subsidy_dict = subsidy.to_dict()
            override = overrides.get(subsidy.scheme_name)
            if override:
                subsidy_dict.update(override)
            subsidies.append(subsidy_dict)
    
    return subsidies


def get_state_subsidies(state: str, equipment_type: Optional[str] = None) -> list[dict]:
    """
    Get state-level subsidies.
    
    Args:
        state: State name
        equipment_type: Optional filter by equipment type
        
    Returns:
        List of applicable state subsidies
    """
    state_schemes = STATE_SUBSIDIES.get(state, [])
    subsidies = []
    
    for subsidy in state_schemes:
        if equipment_type:
            equipment_lower = equipment_type.lower()
            applicable = [eq.lower() for eq in subsidy.applicable_equipment]
            
            if any(equipment_lower in eq or eq in equipment_lower for eq in applicable):
                subsidies.append(subsidy.to_dict())
            elif "all" in ' '.join(applicable).lower():
                subsidies.append(subsidy.to_dict())
        else:
            subsidies.append(subsidy.to_dict())
    
    return subsidies


def get_all_subsidies(
    equipment_type: Optional[str] = None,
    state: Optional[str] = None
) -> dict:
    """
    Get all applicable subsidies (central + state).
    
    Args:
        equipment_type: Optional filter by equipment type
        state: Optional state for state-level subsidies
        
    Returns:
        Dictionary with central and state subsidies
    """
    central = get_central_subsidies(equipment_type)
    state_subsidies = []
    
    if state:
        state_subsidies = get_state_subsidies(state, equipment_type)
    
    return {
        "central_subsidies": central,
        "state_subsidies": state_subsidies,
        "total_schemes": len(central) + len(state_subsidies),
        "equipment_filter": equipment_type,
        "state_filter": state,
        "last_updated": datetime.now().isoformat()
    }


def calculate_subsidy_amount(
    equipment_cost: float,
    subsidy_percentage: float,
    max_amount: float
) -> dict:
    """
    Calculate actual subsidy amount for a purchase.
    
    Args:
        equipment_cost: Total cost of equipment
        subsidy_percentage: Subsidy percentage (0-100)
        max_amount: Maximum subsidy cap
        
    Returns:
        Dictionary with calculation breakdown
    """
    calculated_subsidy = equipment_cost * (subsidy_percentage / 100)
    actual_subsidy = min(calculated_subsidy, max_amount)
    farmer_contribution = equipment_cost - actual_subsidy
    
    return {
        "equipment_cost": equipment_cost,
        "formatted_equipment_cost": f"₹{equipment_cost:,.0f}",
        "subsidy_percentage": subsidy_percentage,
        "calculated_subsidy": calculated_subsidy,
        "subsidy_cap": max_amount,
        "actual_subsidy": actual_subsidy,
        "formatted_subsidy": f"₹{actual_subsidy:,.0f}",
        "farmer_contribution": farmer_contribution,
        "formatted_contribution": f"₹{farmer_contribution:,.0f}",
        "savings_percentage": (actual_subsidy / equipment_cost) * 100 if equipment_cost > 0 else 0
    }


def get_available_states() -> list[str]:
    """Get list of states with subsidy data available."""
    return list(STATE_SUBSIDIES.keys())
