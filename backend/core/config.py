"""
核心配置模块
集中管理所有配置项
"""

import os
from typing import List


class Config:
    """应用配置类"""

    # 应用信息
    APP_TITLE = "A股波段交易筛选系统"
    APP_DESCRIPTION = "专注主板+创业板融资融券标的，波段交易策略，每次最多3只"
    APP_VERSION = "4.6.0"

    # CORS 配置
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        """允许的跨域来源"""
        origins = os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
        )
        return [origin.strip() for origin in origins.split(",")]

    # AI 服务配置
    @property
    def GLM_API_KEY(self) -> str:
        """智谱AI API Key"""
        return os.getenv("GLM_API_KEY") or os.getenv("ZHIPUAI_API_KEY", "")

    GLM_MODEL = os.getenv("GLM_MODEL", "glm-4-flash")
    GLM_TEMPERATURE = float(os.getenv("GLM_MODEL_TEMPERATURE", "0.7"))
    GLM_MAX_TOKENS = int(os.getenv("GLM_MODEL_MAX_TOKENS", "4096"))

    # 服务器配置
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))

    # 缓存配置
    CACHE_TTL_STOCK = int(os.getenv("CACHE_TTL_STOCK", "60"))  # 股票数据缓存(秒)
    CACHE_TTL_MARKET = int(os.getenv("CACHE_TTL_MARKET", "300"))  # 市场环境缓存(秒)

    # 日志配置
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "logs/app.log")


class BandTradingConfig:
    """波段交易策略配置"""

    # 基础配置
    MAX_POSITIONS = 3  # 最大持仓数量
    MAX_MARKET_CAP = 160  # 最大市值（亿）
    REQUIRE_MARGIN = True  # 必须支持融资融券
    EXCLUDE_ST = True  # 排除ST股票
    EXCLUDE_LOSS = True  # 排除亏损股票
    CHANGE_RANGE = (-2, 5)  # 涨跌幅范围（不追涨）
    VOLUME_RATIO_RANGE = (1.5, 3.0)  # 量比范围
    BOARDS = ["main", "cyb"]  # 主板+创业板

    # 评分权重配置
    SCORE_WEIGHTS = {
        "margin": 0.45,  # 融资融券权重
        "change": 0.25,  # 涨跌幅权重
        "volume_ratio": 0.15,  # 量比权重
        "market_cap": 0.10,  # 市值权重
        "capital_flow": 0.05,  # 资金流向权重
    }

    # 风险等级阈值
    RISK_THRESHOLDS = {
        "low": 70,  # 低风险
        "medium": 55,  # 中风险
    }


# 全局配置实例
config = Config()
band_trading_config = BandTradingConfig()

# Gemini 集成配置（可通过环境变量控制）
Config.GEMINI_ENABLED = os.getenv("GEMINI_ENABLED", "false").lower() in (
    "true",
    "1",
    "yes",
    "on",
)
Config.GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
Config.GEMINI_API_ENDPOINT = os.getenv("GEMINI_API_ENDPOINT", "")
Config.GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
