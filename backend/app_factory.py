"""
FastAPI 应用工厂
用于创建和配置FastAPI应用实例
"""

from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

from core.config import config
from services.gemini_service import GeminiService
from core.cache import cache_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    - 启动时创建线程池
    - 关闭时清理资源
    """
    # 启动时创建线程池
    app.state.executor = ThreadPoolExecutor(max_workers=10)
    print("✅ 线程池已创建")

    yield

    # 关闭时清理资源
    app.state.executor.shutdown(wait=True)
    print("✅ 线程池已关闭")
    cache_manager.clear_all()
    print("✅ 缓存已清理")


def create_app() -> FastAPI:
    """
    创建FastAPI应用实例
    """
    app = FastAPI(
        title=config.APP_TITLE,
        description=config.APP_DESCRIPTION,
        version=config.APP_VERSION,
        lifespan=lifespan,
    )

    # 配置CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Gemini 集成（可选）
    gemini_endpoint = os.getenv("GEMINI_API_ENDPOINT", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    gemini_model = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
    gemini_enabled = os.getenv("GEMINI_ENABLED", "false").lower() in (
        "true",
        "1",
        "yes",
        "on",
    )
    if gemini_enabled and gemini_endpoint:
        app.state.gemini = GeminiService(gemini_endpoint, gemini_key, gemini_model)

    return app
