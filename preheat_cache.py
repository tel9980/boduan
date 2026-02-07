"""预热缓存 - 提前生成三个策略的缓存"""
import requests
import time

API_BASE = "http://localhost:8000/api"

strategies = [
    ("balanced", "平衡型"),
    ("aggressive", "激进型"),
    ("conservative", "保守型")
]

print("=" * 60)
print("开始预热缓存...")
print("=" * 60)

for strategy_type, strategy_name in strategies:
    print(f"\n⏳ 正在生成{strategy_name}缓存...")
    start = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": strategy_type,
                "limit": 3
            },
            timeout=600  # 10分钟超时
        )
        
        elapsed = time.time() - start
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {strategy_name}缓存生成成功！耗时：{elapsed:.1f}秒")
            print(f"   推荐股票：{', '.join([s['name'] for s in data.get('data', [])])}")
        else:
            print(f"❌ {strategy_name}缓存生成失败：{response.status_code}")
    except Exception as e:
        print(f"❌ {strategy_name}缓存生成异常：{e}")
    
    time.sleep(2)  # 等待2秒

print("\n" + "=" * 60)
print("缓存预热完成！")
print("=" * 60)
print("\n现在你可以在前端快速点击任何策略按钮了！")
print("响应时间将从5-6分钟降低到<3秒！")
