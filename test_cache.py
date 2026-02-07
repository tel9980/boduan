"""测试智能缓存功能"""
import requests
import time

API_BASE = "http://localhost:8000/api"

def test_cache():
    """测试缓存功能"""
    print("=" * 60)
    print("测试智能缓存功能")
    print("=" * 60)
    
    # 测试激进型策略
    print("\n【测试1】第一次请求激进型策略（应该需要2-3分钟）")
    start_time = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "aggressive",
                "change_min": 3,
                "change_max": 7,
                "volume_ratio_min": 2.0,
                "volume_ratio_max": 5.0,
                "market_cap_max": 160,
                "limit": 3
            },
            timeout=300
        )
        
        elapsed = time.time() - start_time
        print(f"✅ 请求完成，耗时：{elapsed:.1f}秒")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   返回股票数量：{data.get('count', 0)}")
            print(f"   缓存年龄：{data.get('cache_age_minutes', 'N/A')}分钟")
            
            if data.get('data'):
                print(f"\n   选中的股票：")
                for i, stock in enumerate(data['data'], 1):
                    print(f"   {i}. {stock['name']}({stock['code']}) - 涨幅:{stock['change_percent']:.2f}% 量比:{stock['volume_ratio']:.1f}")
        else:
            print(f"❌ 请求失败：{response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ 请求异常：{e}")
        return
    
    # 等待2秒
    print("\n等待2秒...")
    time.sleep(2)
    
    # 第二次请求（应该使用缓存，<1秒）
    print("\n【测试2】第二次请求激进型策略（应该<1秒，使用缓存）")
    start_time = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "aggressive",
                "change_min": 3,
                "change_max": 7,
                "volume_ratio_min": 2.0,
                "volume_ratio_max": 5.0,
                "market_cap_max": 160,
                "limit": 3
            },
            timeout=300
        )
        
        elapsed = time.time() - start_time
        print(f"✅ 请求完成，耗时：{elapsed:.1f}秒")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   返回股票数量：{data.get('count', 0)}")
            print(f"   缓存年龄：{data.get('cache_age_minutes', 'N/A')}分钟")
            print(f"   提示信息：{data.get('message', 'N/A')}")
            
            if elapsed < 2:
                print(f"\n   ✅ 缓存生效！响应时间<2秒")
            else:
                print(f"\n   ⚠️ 缓存可能未生效，响应时间>{elapsed:.1f}秒")
        else:
            print(f"❌ 请求失败：{response.status_code}")
    except Exception as e:
        print(f"❌ 请求异常：{e}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    test_cache()
