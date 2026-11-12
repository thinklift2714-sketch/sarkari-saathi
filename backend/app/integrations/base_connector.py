"""
Base connector interface for all government scheme data sources.
Every connector must implement this interface so the discovery engine
can call any source uniformly.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class IntegrationStatus(str, Enum):
    CONNECTED = "connected"             # API is reachable and credentials verified
    AUTH_REQUIRED = "auth_required"     # Credentials exist but authentication failed
    PENDING_APPROVAL = "pending"        # Registration submitted, awaiting API access approval
    CREDENTIALS_MISSING = "no_creds"   # No credentials configured in .env
    UNAVAILABLE = "unavailable"         # Source unreachable or returned error
    LOCAL_FALLBACK = "local_fallback"   # Using verified local dataset (no live API)


@dataclass
class ConnectorHealth:
    source_id: str
    source_name: str
    source_url: str
    status: IntegrationStatus
    message: str
    schemes_available: int = 0
    last_checked: str = ""
    credentials_needed: List[str] = field(default_factory=list)
    registration_url: str = ""


class BaseConnector(ABC):
    """
    Abstract base class for all government scheme data connectors.
    Concrete implementations: MySchemeConnector, ApiSetuConnector,
    DataGovConnector, UPGovtConnector.
    """

    @property
    @abstractmethod
    def source_id(self) -> str:
        """Unique identifier for this data source."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable name of this government portal."""

    @property
    @abstractmethod
    def source_url(self) -> str:
        """Official URL of the government portal."""

    @abstractmethod
    def health_check(self) -> ConnectorHealth:
        """
        Returns current connection status, number of schemes available,
        and instructions on what credentials/permissions are needed.
        """

    @abstractmethod
    def search_schemes(
        self,
        query: Optional[str] = None,
        category: Optional[str] = None,
        state: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Search for schemes matching the given criteria.
        Returns a list of normalized scheme dicts.
        """

    @abstractmethod
    def get_scheme_details(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve full details for a single scheme by its source identifier.
        """

    def normalize_scheme(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert source-specific raw scheme data to Sarkari Saathi's
        internal normalized scheme format.
        Subclasses should override this for their specific schema.
        """
        return raw

