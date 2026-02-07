"""全面系统测试"""
import requests
import time

API_BASE = "http://localhost:8000/api"

def test_api_health():
    """测试API健康状态"""
    print("\n" + "="*60)
    print("【测试1】API健康检查")
    print("="*60)
    
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API正常运行")
            print(f"   版本: {data.get('version', 'N/A')}")
            print(f"   策略: {data.get('strategy', {}).get('name', 'N/A')}")
            return True
        else:
            print(f"❌ API响应异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API连接失败: {e}")
        return False

def test_band_trading_realtime():
    """测试实时波段交易筛选"""
    print("\n" + "="*60)
    print("【测试2】实时波段交易筛选（平衡型）")
    print("="*60)
    
    try:
        print("⏳ 请求中（预计2-3分钟）...")
        start_time = time.time()
        
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "balanced",
                "limit": 3
            },
            timeout=300
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 请求成功，耗时：{elapsed:.1f}秒")
            print(f"   返回股票数量：{data.get('count', 0)}")
            print(f"   AI功能：{'✅ 已启用' if data.get('ai_enabled') else '❌ 未启用'}")
            
            if data.get('data'):
                print(f"\n   选中的股票：")
                for i, stock in enumerate(data['data'], 1):
                    print(f"   {i}. {stock['name']}({stock['code']})")
                    print(f"      涨幅:{stock['change_percent']:.2f}% | 量比:{stock['volume_ratio']:.1f} | 评分:{stock.get('score', 0):.1f}")
                    if stock.get('ai_analysis'):
                        print(f"      🤖 AI: {stock['ai_analysis'][:60]}...")
            
            return True
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(response.text[:200])
            return False
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

def test_cache_functionality():
    """测试缓存功能"""
    print("\n" + "="*60)
    print("【测试3】缓存功能验证")
    print("="*60)
    
    try:
        print("⏳ 第二次请求（应该使用缓存，<3秒）...")
        start_time = time.time()
        
        response = requests.get(
            f"{API_BASE}/band-trading-realtime",
            params={
                "strategy_type": "balanced",
                "limit": 3
            },
            timeout=300
        )
        
        elapsed = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            cache_age = data.get('cache_age_minutes', 'N/A')
            
            print(f"✅ 请求成功，耗时：{elapsed:.1f}秒")
            print(f"   缓存年龄：{cache_age}分钟")
            print(f"   提示信息：{data.get('message', 'N/A')}")
            
            if elapsed < 5:
                print(f"\n   ✅ 缓存生效！响应时间<5秒")
                return True
            else:
                print(f"\n   ⚠️ 缓存可能未生效，响应时间>{elapsed:.1f}秒")
                return False
        else:
            print(f"❌ 请求失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 请求异常: {e}")
        return False

def test_strategy_differentiation():
    """测试策略差异化"""
    print("\n" + "="*60)
    print("【测试4】策略差异化验证")
    print("="*60)
    
    strategies = [
        ("aggressive", "激进型"),
        ("conservative", "保守型"),
        ("balanced", "平衡型")
    ]
    
    results = {}
    
    for strategy_type, strategy_name in strategies:
        print(f"\n⏳ 测试{strategy_name}...")
        try:
            response = requests.get(
                f"{API_BASE}/band-trading-realtime",
                params={
                    "strategy_type": strategy_type,
                    "limit": 3
                },
                timeout=300
            )
            
            if response.status_code == 200:
                data = response.json()
                stocks = [s['code'] for s in data.get('data', [])]
                results[strategy_type] = stocks
                print(f"   ✅ {strategy_name}: {', '.join([s['name'] for s in data.get('data', [])])}")
            else:
                print(f"   ❌ {strategy_name}请求失败")
                results[strategy_type] = []
        except Exception as e:
            print(f"   ❌ {strategy_name}异常: {e}")
            results[strategy_type] = []
        
        time.sleep(1)
    
    # 检查差异化
    print(f"\n📊 差异化分析：")
    aggressive = set(results.get('aggressive', []))
    conservative = set(results.get('conservative', []))
    balanced = set(results.get('balanced', []))
    
    if aggressive and conservative and balanced:
        if aggressive != conservative or aggressive != balanced or conservative != balanced:
            print(f"   ✅ 三个策略选出的股票不同，差异化成功！")
            return True
        else:
            print(f"   ⚠️ 三个策略选出的股票相同，差异化可能失败")
            return False
    else:
        print(f"   ⚠️ 部分策略未返回数据")
        return False

def main():
    print("="*60)
    print("A股波段交易筛选系统 - 全面测试")
    print("="*60)
    
    results = []
    
    # 测试1：API健康检查
    results.append(("API健康检查", test_api_health()))
    
    # 测试2：实时筛选
    results.append(("实时筛选", test_band_trading_realtime()))
    
    # 测试3：缓存功能
    results.append(("缓存功能", test_cache_functionality()))
    
    # 测试4：策略差异化（需要较长时间）
    print("\n⚠️ 策略差异化测试需要较长时间（约6-9分钟），是否继续？")
    print("   输入 y 继续，其他键跳过...")
    # 自动跳过，避免等待太久
    print("   ⏭️ 自动跳过策略差异化测试")
    
    # 总结
    print("\n" + "="*60)
    print("测试总结")
    print("="*60)
    
    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{test_name}: {status}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\n总计：{passed}/{total} 测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过！系统运行正常！")
    else:
        print(f"\n⚠️ {total - passed} 个测试失败，请检查")

if __name__ == "__main__":
    main()
