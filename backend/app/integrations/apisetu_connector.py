"""
API Setu General Connector
===========================
Connects to the broader API Setu platform for government data.

STATUS: CREDENTIALS REQUIRED
-----------------------------
Set in backend/.env:
  APISETU_CLIENT_ID=<your_client_id>
  APISETU_API_KEY=<your_api_key>

Register at: https://partners.apisetu.gov.in
"""

import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.integrations.base_connector import BaseConnector, ConnectorHealth, IntegrationStatus


class ApiSetuConnector(BaseConnector):
    """General API Setu connector for government data APIs beyond myScheme."""

    BASE_URL = "https://apisetu.gov.in"

    @property
    def source_id(self) -> str:
        return "apisetu"

    @property
    def source_name(self) -> str:
        return "API Setu — Government of India API Gateway"

    @property
    def source_url(self) -> str:
        return "https://apisetu.gov.in"

    def __init__(self):
        self.client_id = os.getenv("APISETU_CLIENT_ID", "")
        self.api_key = os.getenv("APISETU_API_KEY", "")
        self._is_configured = bool(self.client_id and self.api_key)

    def health_check(self) -> ConnectorHealth:
        if not self._is_configured:
            return ConnectorHealth(
                source_id=self.source_id,
                source_name=self.source_name,
                source_url=self.source_url,
                status=IntegrationStatus.CREDENTIALS_MISSING,
                message=(
                    "API Setu credentials not configured. "
                    "Register at https://partners.apisetu.gov.in and obtain CLIENT_ID and API_KEY."
                ),
                credentials_needed=["APISETU_CLIENT_ID", "APISETU_API_KEY"],
                registration_url="https://partners.apisetu.gov.in",
                last_checked=datetime.now().isoformat(),
            )

        return ConnectorHealth(
            source_id=self.source_id,
            source_name=self.source_name,
            source_url=self.source_url,
            status=IntegrationStatus.CREDENTIALS_MISSING,
            message="Credentials present but API Setu general search endpoint not yet integrated. Use MySchemeConnector for scheme data.",
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
        # Delegate to MySchemeConnector for scheme data
        return []

    def get_scheme_details(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        return None


apisetu_connector = ApiSetuConnector()

