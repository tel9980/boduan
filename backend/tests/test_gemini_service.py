from unittest.mock import patch
import os, sys

# Ensure project root on PYTHONPATH for local imports
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from backend.services.gemini_service import GeminiService
from backend.models.gemini_2_0_flash import GeminiFlashResponse


def test_gemini_service_success():
    svc = GeminiService(
        endpoint="https://api.example/gemini",
        api_key="test-key",
        model_name="gemini-2.0-flash",
    )
    with patch("requests.post") as mock_post:

        class MockResp:
            status_code = 200

            def raise_for_status(self):
                pass

            def json(self):
                return {"score": 75.0, "details": {"foo": "bar"}}

            @property
            def headers(self):
                return {"Content-Type": "application/json"}

        mock_post.return_value = MockResp()
        resp = svc.analyze("test input")
        assert resp.success is True
        assert resp.score == 75.0
        assert resp.details == {"foo": "bar"}


def test_gemini_service_failure():
    svc = GeminiService(
        endpoint="https://api.example/gemini",
        api_key="test-key",
        model_name="gemini-2.0-flash",
    )
    with patch("requests.post") as mock_post:
        mock_post.side_effect = Exception("network error")
        resp = svc.analyze("test input")
        assert resp.success is False
        assert "error" in (resp.details or {})
