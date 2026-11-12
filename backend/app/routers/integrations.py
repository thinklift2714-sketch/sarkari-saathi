"""
Government Source Integrations Router
======================================
Exposes endpoints to view status, connection health, and credentials required
for official Indian government scheme sources (API Setu, myScheme, OGD, UP Portals).
"""

from fastapi import APIRouter
from typing import Optional
from pydantic import BaseModel
from app.integrations.connector_manager import connector_manager

router = APIRouter(prefix="/integrations", tags=["Government Integrations"])


class SyncRequest(BaseModel):
    source_id: Optional[str] = None


@router.get("/status")
def get_integrations_status():
    """
    Returns the real-time health and connection status of all configured
    official government data sources, along with instructions for missing credentials.
    """
    return connector_manager.get_all_health()


@router.post("/sync")
def trigger_sync(req: SyncRequest = SyncRequest()):
    """
    Executes a synchronization task across connected government portals.
    """
    return connector_manager.run_sync(source_id=req.source_id)

