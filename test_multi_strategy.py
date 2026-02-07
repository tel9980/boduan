"""测试多策略独立缓存"""
import requests
import time

API_BASE = "http://localhost:8000/api"

def test_strategy(strategy_type, strategy_name):
    """测试单个策略"""
    print(f"\n{'='*60}")
    print(f"测试策略：{strategy_name} ({strategy_type})")
    print(f"{'='*60}")
    
    start_time = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": strategy_type,
                "limit": 3
            },
            timeout=300
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            cache_age = data.get('cache_age_minutes', 'N/A')
            
            print(f"✅ 请求完成，耗时：{elapsed:.1f}秒")
            print(f"   缓存年龄：{cache_age}分钟")
            print(f"   返回股票数量：{data.get('count', 0)}")
            
            if data.get('data'):
                print(f"\n   选中的股票：")
                for i, stock in enumerate(data['data'], 1):
                    print(f"   {i}. {stock['name']}({stock['code']}) - 涨幅:{stock['change_percent']:.2f}% 量比:{stock['volume_ratio']:.1f}")
            
            return elapsed, cache_age
        else:
            print(f"❌ 请求失败：{response.status_code}")
            return None, None
    except Exception as e:
        print(f"❌ 请求异常：{e}")
        return None, None

def main():
    print("=" * 60)
    print("测试多策略独立缓存")
    print("=" * 60)
    
    strategies = [
        ("aggressive", "激进型"),
        ("conservative", "保守型"),
        ("balanced", "平衡型")
    ]
    
    results = {}
    
    # 第一轮：测试所有策略（冷启动）
    print("\n【第一轮】冷启动测试（每个策略都需要实时筛选）")
    for strategy_type, strategy_name in strategies:
        elapsed, cache_age = test_strategy(strategy_type, strategy_name)
        results[strategy_type] = {"first": elapsed, "cache_age": cache_age}
        time.sleep(1)  # 等待1秒
    
    # 第二轮：再次测试所有策略（热启动）
    print("\n\n【第二轮】热启动测试（应该使用缓存，<2秒）")
    for strategy_type, strategy_name in strategies:
        elapsed, cache_age = test_strategy(strategy_type, strategy_name)
        results[strategy_type]["second"] = elapsed
        time.sleep(1)  # 等待1秒
    
    # 总结
    print("\n\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    
    for strategy_type, strategy_name in strategies:
        first = results[strategy_type]["first"]
        second = results[strategy_type]["second"]
        
        if first and second:
            speedup = first / second
            print(f"\n{strategy_name} ({strategy_type}):")
            print(f"   第一次：{first:.1f}秒")
            print(f"   第二次：{second:.1f}秒")
            print(f"   加速：{speedup:.1f}倍")
            
            if second < 5:
                print(f"   ✅ 缓存生效！")
            else:
                print(f"   ⚠️ 缓存可能未生效")

if __name__ == "__main__":
    main()
