import requests
import time

print("测试缓存功能...")
start = time.time()
r = requests.get('http://localhost:8000/api/band-trading-realtime?strategy_type=balanced&limit=3', timeout=10)
elapsed = time.time() - start

data = r.json()
print(f"✅ 耗时: {elapsed:.2f}秒")
print(f"✅ 缓存年龄: {data.get('cache_age_minutes', 'N/A')}分钟")
print(f"✅ 股票数量: {data.get('count', 0)}")
print(f"✅ 提示信息: {data.get('message', 'N/A')}")

if elapsed < 5:
    print("\n🎉 缓存生效！响应时间<5秒")
else:
    print("\n⚠️ 缓存可能未生效")
