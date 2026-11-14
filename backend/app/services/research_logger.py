"""
Transparent Government Scheme Research & Recommendation Logger for Sarkari Saathi.
Maintains auditable, honest trace logs of input validation, profile extraction,
official source queries, candidate evaluation, and relevance filtering decisions.
"""
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger("sarkari_saathi.research_logger")


class ResearchTraceLog:
    def __init__(self, analysis_id: Optional[str] = None, user_input: str = ""):
        self.analysis_id = analysis_id or f"trace_{uuid.uuid4().hex[:10]}"
        self.timestamp = datetime.now().isoformat()
        self.user_input = user_input
        self.input_validation_result: Dict[str, Any] = {}
        self.profile_fields_extracted: Dict[str, Any] = {}
        self.missing_profile_fields: List[str] = []
        self.sources_searched: List[str] = []
        self.successful_source_requests: List[str] = []
        self.failed_source_requests: List[str] = []
        self.candidate_schemes_retrieved: int = 0
        self.duplicate_schemes_removed: int = 0
        self.scheme_conditions_retrieved: int = 0
        self.schemes_evaluated: int = 0
        self.recommendations_returned: List[Dict[str, Any]] = []
        self.reasons_for_exclusion: List[Dict[str, str]] = []
        self.status: str = "initiated"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "analysis_id": self.analysis_id,
            "timestamp": self.timestamp,
            "user_input": self.user_input,
            "validation": self.input_validation_result,
            "extracted_profile": self.profile_fields_extracted,
            "missing_fields": self.missing_profile_fields,
            "sources": {
                "searched": self.sources_searched,
                "successful": self.successful_source_requests,
                "failed": self.failed_source_requests
            },
            "metrics": {
                "candidates_retrieved": self.candidate_schemes_retrieved,
                "duplicates_removed": self.duplicate_schemes_removed,
                "conditions_retrieved": self.scheme_conditions_retrieved,
                "schemes_evaluated": self.schemes_evaluated,
                "recommendations_count": len(self.recommendations_returned)
            },
            "recommendations": [
                {
                    "scheme_id": r.get("scheme_id"),
                    "scheme_name": r.get("scheme_name_hindi") or r.get("scheme_name"),
                    "status": r.get("status"),
                    "matched_conditions": r.get("matched_conditions", []),
                    "explanation": r.get("explanation")
                }
                for r in self.recommendations_returned
            ],
            "excluded_candidates": self.reasons_for_exclusion[:20],
            "status": self.status
        }


class ResearchLoggerService:
    def __init__(self):
        self._history: Dict[str, ResearchTraceLog] = {}

    def create_trace(self, analysis_id: Optional[str] = None, user_input: str = "") -> ResearchTraceLog:
        trace = ResearchTraceLog(analysis_id, user_input)
        self._history[trace.analysis_id] = trace
        return trace

    def get_trace(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        trace = self._history.get(analysis_id)
        return trace.to_dict() if trace else None

    def log_trace(self, trace: ResearchTraceLog):
        logger.info(
            f"[ResearchTrace] id={trace.analysis_id} input='{trace.user_input[:40]}' "
            f"cat={trace.input_validation_result.get('category')} recs={len(trace.recommendations_returned)}"
        )


research_logger = ResearchLoggerService()
