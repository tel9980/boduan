"""
测试 v4.15.3 性能优化
"""
import requests
import time
import json

API_BASE = "http://localhost:8000/api"

def test_screening_performance():
    """测试筛选性能"""
    print("=" * 60)
    print("测试 v4.15.3 性能优化")
    print("=" * 60)
    
    # 清空缓存（如果需要）
    print("\n1. 清空缓存...")
    try:
        response = requests.get(f"{API_BASE}/cache/clear", timeout=5)
        if response.status_code == 200:
            print("   ✅ 缓存已清空")
        else:
            print("   ⚠️ 清空缓存失败")
    except Exception as e:
        print(f"   ⚠️ 清空缓存异常: {e}")
    
    # 测试实时筛选（激进型）
    print("\n2. 测试实时筛选（激进型）...")
    print("   预期耗时：3-4分钟（优化前：5-6分钟）")
    print("   开始计时...")
    
    start_time = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "aggressive",
                "change_min": 3.0,
                "change_max": 7.0,
                "volume_ratio_min": 2.0,
                "volume_ratio_max": 5.0,
                "market_cap_max": 160.0,
                "limit": 3
            },
            timeout=600  # 10分钟超时
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n   ✅ 筛选成功！")
            print(f"   ⏱️  总耗时：{elapsed:.1f}秒（{elapsed/60:.1f}分钟）")
            print(f"   📊 结果数量：{data.get('count', 0)}只")
            
            if data.get('data'):
                print(f"\n   推荐股票：")
                for i, stock in enumerate(data['data'][:3], 1):
                    print(f"      {i}. {stock['name']}({stock['code']}) - 评分:{stock['score']:.1f}")
                    print(f"         涨幅:{stock['change_percent']:.2f}% | 量比:{stock['volume_ratio']:.1f} | 市值:{stock['market_cap']:.0f}亿")
            
            # 性能评估
            print(f"\n   性能评估：")
            if elapsed < 240:  # 4分钟
                print(f"      ✅ 优秀！耗时{elapsed/60:.1f}分钟，达到优化目标")
            elif elapsed < 300:  # 5分钟
                print(f"      ✅ 良好！耗时{elapsed/60:.1f}分钟，接近优化目标")
            elif elapsed < 360:  # 6分钟
                print(f"      ⚠️ 一般。耗时{elapsed/60:.1f}分钟，与优化前相当")
            else:
                print(f"      ❌ 较慢。耗时{elapsed/60:.1f}分钟，需要进一步优化")
            
            # 保存结果
            with open("optimization_test_result.json", "w", encoding="utf-8") as f:
                json.dump({
                    "version": "v4.15.3",
                    "test_time": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "elapsed_seconds": elapsed,
                    "elapsed_minutes": elapsed / 60,
                    "count": data.get('count', 0),
                    "success": True
                }, f, ensure_ascii=False, indent=2)
            
        else:
            print(f"   ❌ 筛选失败：HTTP {response.status_code}")
            print(f"   错误信息：{response.text}")
            
    except requests.exceptions.Timeout:
        elapsed = time.time() - start_time
        print(f"\n   ❌ 请求超时（{elapsed:.1f}秒）")
        print(f"   说明：筛选时间超过10分钟，需要进一步优化")
    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n   ❌ 测试异常：{e}")
        print(f"   耗时：{elapsed:.1f}秒")
    
    # 测试缓存（5分钟内再次请求）
    print("\n3. 测试缓存功能...")
    print("   5分钟内再次请求应该使用缓存（<1秒）")
    
    start_time = time.time()
    
    try:
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "aggressive",
                "change_min": 3.0,
                "change_max": 7.0,
                "volume_ratio_min": 2.0,
                "volume_ratio_max": 5.0,
                "market_cap_max": 160.0,
                "limit": 3
            },
            timeout=10
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            cache_age = data.get('cache_age_minutes', 0)
            
            print(f"   ✅ 缓存测试成功！")
            print(f"   ⏱️  响应时间：{elapsed:.2f}秒")
            print(f"   📦 缓存年龄：{cache_age:.1f}分钟")
            
            if elapsed < 2:
                print(f"   ✅ 缓存工作正常！响应时间<2秒")
            else:
                print(f"   ⚠️ 缓存可能未生效，响应时间{elapsed:.2f}秒")
        else:
            print(f"   ❌ 缓存测试失败：HTTP {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ 缓存测试异常：{e}")
    
    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    test_screening_performance()
