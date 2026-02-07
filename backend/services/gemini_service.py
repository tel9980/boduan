from typing import Optional, Dict, Any
import requests

from backend.models.gemini_2_0_flash import GeminiFlashRequest, GeminiFlashResponse


class GeminiService:
    def __init__(
        self, endpoint: str, api_key: str, model_name: str = "gemini-2.0-flash"
    ):
        self.endpoint = endpoint.rstrip("/")
        self.api_key = api_key
        self.model_name = model_name or "gemini-2.0-flash"

    def analyze(
        self, text: str, extra: Optional[Dict[str, Any]] = None
    ) -> GeminiFlashResponse:
        payload: Dict[str, Any] = {
            "text": text,
            "model": self.model_name,
        }
        if extra:
            payload.update(extra)

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            resp = requests.post(
                self.endpoint, json=payload, headers=headers, timeout=10
            )
            resp.raise_for_status()
            data = (
                resp.json()
                if resp.headers.get("Content-Type", "")
                .lower()
                .startswith("application/json")
                else {}
            )
            score = float(data.get("score", 0.0)) if isinstance(data, dict) else 0.0
            details = data.get("details") if isinstance(data, dict) else None
            return GeminiFlashResponse(success=True, score=score, details=details)
        except Exception as e:
            return GeminiFlashResponse(
                success=False, score=0.0, details={"error": str(e)}
            )
