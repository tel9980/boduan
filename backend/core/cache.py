"""
缓存管理模块
集中管理全局缓存
"""

import time
from typing import Any, Dict, Optional
from core.config import config


class Cache:
    """简单内存缓存"""

    def __init__(self, ttl: int = 60):
        """
        初始化缓存
        :param ttl: 缓存过期时间（秒）
        """
        self._data: Optional[Any] = None
        self._timestamp: Optional[float] = None
        self._ttl = ttl

    def get(self) -> Optional[Any]:
        """获取缓存数据"""
        if self._data is None or self._timestamp is None:
            return None

        if time.time() - self._timestamp > self._ttl:
            # 缓存过期
            self._data = None
            self._timestamp = None
            return None

        return self._data

    def set(self, data: Any):
        """设置缓存数据"""
        self._data = data
        self._timestamp = time.time()

    def clear(self):
        """清除缓存"""
        self._data = None
        self._timestamp = None

    def is_valid(self) -> bool:
        """检查缓存是否有效"""
        return self.get() is not None


class CacheManager:
    """缓存管理器"""

    def __init__(self):
        # 股票数据缓存
        self.stock_data = Cache(ttl=config.CACHE_TTL_STOCK)
        # 市场环境缓存
        self.market_env = Cache(ttl=config.CACHE_TTL_MARKET)

    def clear_all(self):
        """清除所有缓存"""
        self.stock_data.clear()
        self.market_env.clear()


# 全局缓存实例
cache_manager = CacheManager()
