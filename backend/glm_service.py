"""
GLM-4-Flash AI 服务
提供股票智能分析功能
严格控制并发：最多1个请求同时执行
"""

import requests
import json
from functools import lru_cache
import time
from typing import Optional, Dict, Any
import os
import threading


class GLMService:
    """GLM-4-Flash API 服务类（线程安全）"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
        self.model = "glm-4-flash"
        self.last_call_time = 0
        self.min_interval = 1.2  # 并发限制，至少间隔1.2秒（严格控制并发=1）
        self.enabled = True
        self._lock = threading.Lock()  # 线程锁，确保串行执行

        print(f"✅ GLM-4-Flash AI 服务已初始化（并发限制：1请求/1.2秒）")

    def call(
        self, prompt: str, max_tokens: int = 200, temperature: float = 0.7
    ) -> Optional[str]:
        """
        调用 GLM-4-Flash API（线程安全，严格串行）

        Args:
            prompt: 提示词
            max_tokens: 最大生成token数
            temperature: 温度参数（0-1，越高越随机）

        Returns:
            AI 生成的文本，失败返回 None
        """
        if not self.enabled:
            return None

        # 使用线程锁确保串行执行
        with self._lock:
            # 严格并发控制：确保至少间隔1.2秒（GLM-4-Flash并发限制=1）
            current_time = time.time()
            time_since_last_call = current_time - self.last_call_time
            if time_since_last_call < self.min_interval:
                wait_time = self.min_interval - time_since_last_call
                print(f"   ⏳ 并发控制：等待 {wait_time:.1f}秒...")
                time.sleep(wait_time)

            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }

                data = {
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                }

                response = requests.post(
                    self.base_url, headers=headers, json=data, timeout=15
                )

                self.last_call_time = time.time()

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    return content.strip()
                else:
                    print(f"⚠️ GLM API 错误: {response.status_code} - {response.text}")
                    return None

            except requests.exceptions.Timeout:
                print(f"⚠️ GLM API 调用超时")
                return None
            except Exception as e:
                print(f"⚠️ GLM API 调用失败: {e}")
                return None

    def analyze_stock(
        self, stock_data: Dict[str, Any], strategy_type: str = "balanced"
    ) -> Optional[str]:
        """
        分析单只股票

        Args:
            stock_data: 股票数据字典
            strategy_type: 策略类型 (aggressive/conservative/balanced)

        Returns:
            AI 分析文本
        """
        strategy_map = {
            "aggressive": "激进型（追求高收益）",
            "conservative": "保守型（稳健为主）",
            "balanced": "平衡型（均衡配置）",
        }

        strategy_desc = strategy_map.get(strategy_type, "平衡型")

        prompt = f"""请用通俗易懂的语言分析这只股票（适合小白投资者）：

股票名称：{stock_data.get("name", "未知")}
当前价格：{stock_data.get("price", 0):.2f}元
涨跌幅：{stock_data.get("change_percent", 0):.2f}%
量比：{stock_data.get("volume_ratio", 0):.2f}
市值：{stock_data.get("market_cap", 0):.0f}亿
评分：{stock_data.get("score", 0):.1f}分
策略类型：{strategy_desc}

请从以下角度分析（总共不超过120字）：
1. 当前走势特点（1句话，15字内）
2. 量价关系分析（1句话，15字内）
3. 适合该策略的理由（1句话，20字内）
4. 简短操作建议（1句话，20字内）

要求：
- 语言简洁、通俗、口语化
- 不要使用专业术语
- 不要重复股票数据
- 直接给出分析，不要前缀"""

        return self.call(prompt, max_tokens=200, temperature=0.7)

    def generate_recommendation_reason(
        self, stock_data: Dict[str, Any], strategy_type: str
    ) -> Optional[str]:
        """
        生成推荐理由（一句话）

        Args:
            stock_data: 股票数据
            strategy_type: 策略类型

        Returns:
            推荐理由（一句话）
        """
        strategy_map = {
            "aggressive": "激进型",
            "conservative": "保守型",
            "balanced": "平衡型",
        }

        strategy_name = strategy_map.get(strategy_type, "平衡型")

        prompt = f"""用一句话说明为什么推荐这只股票（{strategy_name}策略）：

{stock_data.get("name")}：涨幅{stock_data.get("change_percent", 0):.1f}%，量比{stock_data.get("volume_ratio", 0):.1f}，评分{stock_data.get("score", 0):.0f}分

要求：
- 只输出一句话，不超过25字
- 突出该策略的特点
- 语言简洁有力
- 不要前缀和标点"""

        return self.call(prompt, max_tokens=50, temperature=0.8)

    def explain_market_emotion(self, emotion_data: Dict[str, Any]) -> Optional[str]:
        """
        解读市场情绪

        Args:
            emotion_data: 市场情绪数据

        Returns:
            市场情绪解读
        """
        prompt = f"""用通俗语言解读当前市场情绪：

情绪指数：{emotion_data.get("score", 0)}分（满分100）
上涨股票占比：{emotion_data.get("rise_ratio", 0):.1f}%
平均涨幅：{emotion_data.get("avg_change", 0):.2f}%
平均量比：{emotion_data.get("avg_ratio", 0):.2f}

请用2-3句话（不超过80字）：
1. 解读当前市场情绪
2. 给出操作建议

要求：语言通俗、建议具体、不要前缀"""

        return self.call(prompt, max_tokens=150, temperature=0.7)

    def optimize_risk_warning(self, warnings: list) -> Optional[str]:
        """
        优化风险提示

        Args:
            warnings: 风险提示列表

        Returns:
            优化后的风险提示
        """
        if not warnings:
            return None

        warnings_text = "\n".join(f"- {w}" for w in warnings)

        prompt = f"""用通俗语言解释这些风险，并给出应对建议：

{warnings_text}

要求：
- 2-3句话，不超过80字
- 语言通俗易懂
- 给出具体建议
- 不要重复原文
- 不要前缀"""

        return self.call(prompt, max_tokens=150, temperature=0.7)

    def disable(self):
        """禁用 AI 服务"""
        self.enabled = False
        print("⚠️ GLM AI 服务已禁用")

    def enable(self):
        """启用 AI 服务"""
        self.enabled = True
        print("✅ GLM AI 服务已启用")


# 全局实例
_glm_service: Optional[GLMService] = None


def init_glm_service(api_key: str) -> GLMService:
    """
    初始化 GLM 服务

    Args:
        api_key: GLM API Key

    Returns:
        GLMService 实例
    """
    global _glm_service
    _glm_service = GLMService(api_key)
    return _glm_service


def get_glm_service() -> Optional[GLMService]:
    """
    获取 GLM 服务实例

    Returns:
        GLMService 实例，未初始化返回 None
    """
    return _glm_service


def is_glm_enabled() -> bool:
    """
    检查 GLM 服务是否已启用

    Returns:
        True 如果已启用
    """
    return _glm_service is not None and _glm_service.enabled


# 测试函数
if __name__ == "__main__":
    # 测试 GLM 服务
    api_key = os.getenv("GLM_API_KEY") or os.getenv("ZHIPUAI_API_KEY")

    if api_key:
        glm = init_glm_service(api_key)

        # 测试股票分析
        test_stock = {
            "name": "贵州茅台",
            "price": 1680.50,
            "change_percent": 2.3,
            "volume_ratio": 1.8,
            "market_cap": 21000,
            "score": 85,
        }

        print("\n测试股票分析：")
        analysis = glm.analyze_stock(test_stock, "balanced")
        if analysis:
            print(f"✅ 分析结果：\n{analysis}")
        else:
            print("❌ 分析失败")

        # 测试推荐理由
        print("\n测试推荐理由：")
        reason = glm.generate_recommendation_reason(test_stock, "aggressive")
        if reason:
            print(f"✅ 推荐理由：{reason}")
        else:
            print("❌ 生成失败")
    else:
        print("❌ 未配置 GLM_API_KEY")
