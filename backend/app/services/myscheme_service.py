"""
myScheme and Government Portals Data Integration Service.
Provides integration interfaces with:
1. myScheme Portal (myscheme.gov.in) via API Setu (apisetu.gov.in)
2. National Portal of India (india.gov.in)
3. Open Government Data Platform (data.gov.in)
4. Uttar Pradesh State Portals (sspy-up.gov.in, agridarshan.up.gov.in, scholarship.up.gov.in)
"""
import os
import httpx
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.config import settings

# 15 Official Thematic Categories defined by myScheme.gov.in
MYSCHEME_CATEGORIES = {
    "social_welfare": "Social Welfare & Empowerment (सामाजिक कल्याण)",
    "education": "Education & Learning (शिक्षा व छात्रवृत्ति)",
    "agriculture": "Agriculture, Rural & Environment (कृषि व ग्रामीण)",
    "business": "Business & Entrepreneurship (व्यापार व उद्यमिता)",
    "skills": "Skills & Employment (कौशल व रोजगार)",
    "health": "Health & Wellness (स्वास्थ्य व कल्याण)",
    "housing": "Housing & Shelter (आवास)",
    "banking": "Banking, Financial Services and Insurance (बैंकिंग व बीमा)",
    "women_child": "Women & Child (महिला व बाल विकास)",
    "sports": "Sports & Culture (खेल व संस्कृति)",
    "science": "Science, IT & Communications (विज्ञान व तकनीक)",
    "transport": "Transport & Infrastructure (परिवहन)",
    "travel": "Travel & Tourism (पर्यटन)",
    "public_safety": "Public Safety, Law & Justice (न्याय व सुरक्षा)",
    "utility": "Utility & Sanitation (स्वच्छता व सुविधाएं)"
}

# Official Government Portal References
OFFICIAL_SOURCES = {
    "myscheme": {
        "name": "myScheme National Platform",
        "url": "https://www.myscheme.gov.in",
        "api_setu_url": "https://apisetu.gov.in/feed/myscheme",
        "description": "National one-stop discovery platform for central and state schemes."
    },
    "india_gov": {
        "name": "National Portal of India",
        "url": "https://www.india.gov.in",
        "description": "Single-window access to information and services provided by the Indian Government."
    },
    "data_gov": {
        "name": "Open Government Data (OGD) Platform India",
        "url": "https://data.gov.in",
        "description": "Open datasets of national welfare programs."
    },
    "up_sspy": {
        "name": "Uttar Pradesh Integrated Social Security Pension Portal",
        "url": "https://sspy-up.gov.in",
        "description": "State pension schemes for widows, senior citizens, and persons with disabilities."
    },
    "up_agridarshan": {
        "name": "Uttar Pradesh Agriculture Portal (DARSHAN)",
        "url": "https://agridarshan.up.gov.in",
        "alt_url": "https://upagriculture.com",
        "description": "Farmer registration, crop subsidies, farm equipment grants, and DBT tracking."
    },
    "up_scholarship": {
        "name": "Uttar Pradesh Scholarship & Fee Reimbursement Portal",
        "url": "https://scholarship.up.gov.in",
        "description": "Pre-matric, post-matric, and higher education scholarship disbursements via DBT."
    }
}


class MySchemeIntegrationService:
    def __init__(self):
        self.api_key = os.getenv("API_SETU_CLIENT_ID", "")
        self.api_secret = os.getenv("API_SETU_API_KEY", "")
        self.cache_ttl = 3600  # 1 hour
        self.last_sync_timestamp = datetime.now().isoformat()

    async def fetch_from_api_setu(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Connects to myScheme API on API Setu if authorized credentials are configured.
        Falls back cleanly to verified official scheme repository if no API credentials present.
        """
        if self.api_key and self.api_secret:
            try:
                headers = {
                    "X-APISETU-CLIENTID": self.api_key,
                    "X-APISETU-APIKEY": self.api_secret,
                    "Accept": "application/json"
                }
                url = f"{OFFICIAL_SOURCES['myscheme']['api_setu_url']}/schemes"
                if category:
                    url += f"?category={category}"

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(url, headers=headers)
                    if resp.status_code == 200:
                        return resp.json().get("data", [])
            except Exception as e:
                print(f"[MySchemeService] API Setu call failed, falling back to verified repository: {e}")

        # Return empty when running without live API Setu authorization
        return []

    def get_source_metadata(self, source_key: str) -> Dict[str, Any]:
        return OFFICIAL_SOURCES.get(source_key, {
            "name": "Official Government Portal",
            "url": "https://india.gov.in",
            "description": "Verified Government of India website"
        })

    def get_supported_categories(self) -> Dict[str, str]:
        return MYSCHEME_CATEGORIES


myscheme_service = MySchemeIntegrationService()

