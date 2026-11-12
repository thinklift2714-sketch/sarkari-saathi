"""
Sarkari Saathi Government Source Integration Layer.
Modular connectors for official Indian government scheme portals.
"""
from app.integrations.base_connector import BaseConnector, IntegrationStatus
from app.integrations.myscheme_connector import MySchemeConnector, myscheme_connector
from app.integrations.apisetu_connector import ApiSetuConnector, apisetu_connector
from app.integrations.data_gov_connector import DataGovConnector, data_gov_connector
from app.integrations.up_govt_connector import UPGovtConnector, up_govt_connector
from app.integrations.connector_manager import ConnectorManager, connector_manager

__all__ = [
    "BaseConnector",
    "IntegrationStatus",
    "MySchemeConnector",
    "myscheme_connector",
    "ApiSetuConnector",
    "apisetu_connector",
    "DataGovConnector",
    "data_gov_connector",
    "UPGovtConnector",
    "up_govt_connector",
    "ConnectorManager",
    "connector_manager",
]

