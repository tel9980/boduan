from pydantic import BaseModel
from typing import Any, Dict, Optional


class GeminiFlashRequest(BaseModel):
    # Text prompt or input for Gemini analysis
    text: str
    # Optional specific model/version to use
    model: Optional[str] = None


class GeminiFlashResponse(BaseModel):
    success: bool = True
    score: float
    details: Optional[Dict[str, Any]] = None
