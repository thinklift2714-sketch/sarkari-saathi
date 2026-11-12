"""
Open Government Data (OGD) Platform Connector (data.gov.in)
============================================================
Connects to data.gov.in public data APIs for welfare schemes and ministry statistics.

STATUS: CREDENTIALS REQUIRED / REGISTRATION
--------------------------------------------
To activate live API queries:
1. Register at https://data.gov.in
2. Go to My Account -> API Key
3. Set in backend/.env:
     DATA_GOV_API_KEY=<your_api_key>

Documented API Request Structure:
  GET https://api.data.gov.in/resource/{resource_id}?api-key={api_key}&format=json&limit={limit}&offset={offset}
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional
import httpx

from app.integrations.base_connector import BaseConnector, ConnectorHealth, IntegrationStatus


class DataGovConnector(BaseConnector):
    """
    Connector for India's Open Government Data (OGD) platform (data.gov.in).
    """

    BASE_URL = "https://api.data.gov.in/resource"

    # Known Welfare & Scheme Resource IDs on data.gov.in
    KNOWN_RESOURCE_IDS = {
        "pmkisan_beneficiaries": "d9865662-7f72-4614-a95e-14f76d4995f9",
        "ayushman_bharat_empanelled": "2f404d09-8483-490b-80df-0c466fb10b27",
        "mgnrega_performance": "ee30537b-9e87-4348-a006-2b47d06637e6",
    }

    @property
    def source_id(self) -> str:
        return "data_gov_in"

    @property
    def source_name(self) -> str:
        return "Open Government Data (OGD) Platform India (data.gov.in)"

    @property
    def source_url(self) -> str:
        return "https://data.gov.in"

    def __init__(self):
        self.api_key = os.getenv("DATA_GOV_API_KEY", "")
        self._is_configured = bool(self.api_key)

    def health_check(self) -> ConnectorHealth:
        if not self._is_configured:
            return ConnectorHealth(
                source_id=self.source_id,
                source_name=self.source_name,
                source_url=self.source_url,
                status=IntegrationStatus.CREDENTIALS_MISSING,
                message=(
                    "data.gov.in API key not configured. "
                    "Register for free at https://data.gov.in, generate an API key in 'My Account', "
                    "and set DATA_GOV_API_KEY in backend/.env."
                ),
                schemes_available=0,
                credentials_needed=["DATA_GOV_API_KEY"],
                registration_url="https://data.gov.in",
                last_checked=datetime.now().isoformat(),
            )

        try:
            # Test key with a lightweight query
            test_res_id = self.KNOWN_RESOURCE_IDS["pmkisan_beneficiaries"]
            url = f"{self.BASE_URL}/{test_res_id}"
            params = {"api-key": self.api_key, "format": "json", "limit": 1}

            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    total = data.get("total", 0)
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.CONNECTED,
                        message=f"Connected to data.gov.in. Records available across welfare datasets: {total}.",
                        schemes_available=total,
                        last_checked=datetime.now().isoformat(),
                    )
                elif resp.status_code in (401, 403):
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.AUTH_REQUIRED,
                        message="data.gov.in authentication failed. Please check DATA_GOV_API_KEY.",
                        credentials_needed=["DATA_GOV_API_KEY"],
                        registration_url="https://data.gov.in",
                        last_checked=datetime.now().isoformat(),
                    )
                else:
                    return ConnectorHealth(
                        source_id=self.source_id,
                        source_name=self.source_name,
                        source_url=self.source_url,
                        status=IntegrationStatus.UNAVAILABLE,
                        message=f"data.gov.in returned HTTP {resp.status_code}.",
                        last_checked=datetime.now().isoformat(),
                    )
        except Exception as exc:
            return ConnectorHealth(
                source_id=self.source_id,
                source_name=self.source_name,
                source_url=self.source_url,
                status=IntegrationStatus.UNAVAILABLE,
                message=f"Connection error reaching data.gov.in: {exc}",
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
        # data.gov.in provides datasets/statistics rather than structured scheme rules.
        # It is used for verification & statistical validation.
        return []

    def get_scheme_details(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        return None


data_gov_connector = DataGovConnector()

