"""
API Setu → myScheme Connector
==============================
Official integration with myScheme.gov.in via API Setu (apisetu.gov.in).

STATUS: CREDENTIALS REQUIRED
-----------------------------
To activate this connector:
1. Register at https://partners.apisetu.gov.in
2. Subscribe to the "myScheme" API product
3. Obtain your Client ID and API Key
4. Set in backend/.env:
     APISETU_CLIENT_ID=<your_client_id>
     APISETU_API_KEY=<your_api_key>

Until credentials are provided, this connector reports status=CREDENTIALS_MISSING
and the discovery engine uses the verified local scheme repository.

API Setu myScheme Endpoints (documented at apisetu.gov.in):
  GET  https://apisetu.gov.in/dic/myscheme/srv/v1/schemes/list
  GET  https://apisetu.gov.in/dic/myscheme/srv/v1/scheme/{slug}
  GET  https://apisetu.gov.in/dic/myscheme/srv/v1/rules/eligibility/form/schemes/list
  POST https://apisetu.gov.in/dic/myscheme/srv/v7/schemes/search
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.integrations.base_connector import BaseConnector, ConnectorHealth, IntegrationStatus


class MySchemeConnector(BaseConnector):
    """
    Connector for myScheme national scheme discovery platform via API Setu.
    Requires registration and API key from partners.apisetu.gov.in.
    """

    BASE_URL = "https://apisetu.gov.in/dic/myscheme/srv/v1"

    @property
    def source_id(self) -> str:
        return "myscheme_apisetu"

    @property
    def source_name(self) -> str:
        return "myScheme National Platform (via API Setu)"

    @property
    def source_url(self) -> str:
        return "https://www.myscheme.gov.in"

    def __init__(self):
        self.client_id = os.getenv("APISETU_CLIENT_ID", "")
        self.api_key = os.getenv("APISETU_API_KEY", "")
        self._is_configured = bool(self.client_id and self.api_key)

    def _headers(self) -> Dict[str, str]:
        return {
            "X-APISETU-CLIENTID": self.client_id,
            "X-APISETU-APIKEY": self.api_key,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def health_check(self) -> ConnectorHealth:
        if not self._is_configured:
            return ConnectorHealth(
                source_id=self.source_id,
                source_name=self.source_name,
                source_url=self.source_url,
                status=IntegrationStatus.CREDENTIALS_MISSING,
                message=(
                    "API Setu credentials not configured. "
                    "Register at https://partners.apisetu.gov.in and subscribe to 'myScheme'. "
                    "Then set APISETU_CLIENT_ID and APISETU_API_KEY in backend/.env"
                ),
                schemes_available=0,
                credentials_needed=["APISETU_CLIENT_ID", "APISETU_API_KEY"],
                registration_url="https://partners.apisetu.gov.in",
                last_checked=datetime.now().isoformat(),
            )

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(
                    f"{self.BASE_URL}/schemes/list",
                    headers=self._headers(),
                    params={"limit": 1},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    count = data.get("totalCount", 0)
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.CONNECTED,
                        message=f"Connected. {count} schemes available on myScheme platform.",
                        schemes_available=count,
                        last_checked=datetime.now().isoformat(),
                    )
                elif resp.status_code in (401, 403):
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.AUTH_REQUIRED,
                        message=f"Authentication failed (HTTP {resp.status_code}). Check APISETU_CLIENT_ID and APISETU_API_KEY.",
                        credentials_needed=["APISETU_CLIENT_ID", "APISETU_API_KEY"],
                        registration_url="https://partners.apisetu.gov.in",
                        last_checked=datetime.now().isoformat(),
                    )
                else:
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.UNAVAILABLE,
                        message=f"API Setu returned HTTP {resp.status_code}.",
                        last_checked=datetime.now().isoformat(),
                    )
        except Exception as exc:
            return ConnectorHealth(
                source_id=self.source_id,
                source_name=self.source_name,
                source_url=self.source_url,
                status=IntegrationStatus.UNAVAILABLE,
                message=f"Connection error: {exc}",
                last_checked=datetime.now().isoformat(),
            )

    def search_schemes(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        state: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        if not self._is_configured:
            return []

        try:
            params: Dict[str, Any] = {"limit": limit, "offset": offset}
            if query:
                params["keyword"] = query
            if category:
                params["category"] = category
            if state:
                params["state"] = state

            with httpx.Client(timeout=15.0) as client:
                resp = client.get(
                    f"{self.BASE_URL}/schemes/list",
                    headers=self._headers(),
                    params=params,
                )
                if resp.status_code == 200:
                    raw_schemes = resp.json().get("data", [])
                    return [self.normalize_scheme(s) for s in raw_schemes]
        except Exception as exc:
            print(f"[MySchemeConnector] search_schemes error: {exc}")

        return []

    def get_scheme_details(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        if not self._is_configured:
            return None

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(
                    f"{self.BASE_URL}/scheme/{scheme_id}",
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return self.normalize_scheme(resp.json())
        except Exception as exc:
            print(f"[MySchemeConnector] get_scheme_details error: {exc}")

        return None

    def normalize_scheme(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Map myScheme API Setu response format to internal scheme format."""
        return {
            "id": f"myscheme_{raw.get('slug', raw.get('id', ''))}",
            "external_id": raw.get("slug", raw.get("id", "")),
            "scheme_name": raw.get("schemeName", raw.get("name", "")),
            "scheme_name_hindi": raw.get("schemeNameHindi", raw.get("nameHindi", "")),
            "description": raw.get("shortDescription", raw.get("description", "")),
            "description_hindi": raw.get("shortDescriptionHindi", raw.get("descriptionHindi", "")),
            "category": raw.get("category", ""),
            "category_hindi": raw.get("categoryHindi", ""),
            "central_or_state": "state" if raw.get("isStateScheme") else "central",
            "applicable_states": raw.get("states", ["All"]),
            "department": raw.get("nodal", raw.get("department", "")),
            "department_hindi": raw.get("nodalHindi", raw.get("departmentHindi", "")),
            "ministry": raw.get("ministry", ""),
            "ministry_hindi": raw.get("ministryHindi", ""),
            "benefits": {"description_hindi": raw.get("benefitsHindi", raw.get("benefits", ""))},
            "eligibility_conditions": raw.get("eligibility", {}),
            "required_documents": raw.get("documents", []),
            "official_website": raw.get("applicationUrl", raw.get("officialUrl", "")),
            "official_source": f"myScheme.gov.in / API Setu",
            "last_verified_at": raw.get("lastUpdated", datetime.now().strftime("%Y-%m-%d")),
            "is_active": raw.get("isActive", True),
            "data_source": "myscheme_apisetu",
        }


myscheme_connector = MySchemeConnector()

