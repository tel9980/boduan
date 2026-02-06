"""
测试AKShare数据获取
"""

import sys
sys.path.append('backend')

from data_adapter import akshare_adapter

print("=" * 60)
print("测试AKShare数据适配器")
print("=" * 60)

# 测试1：获取实时行情
print("\n📡 测试1：获取实时行情数据...")
try:
    df = akshare_adapter.get_realtime_quotes()
    if not df.empty:
        print(f"✅ 成功获取 {len(df)} 只股票的实时数据")
        print("\n前5只股票示例：")
        print(df.head()[['code', 'name', 'price', 'change_percent', 'volume_ratio', 'market_cap']])
    else:
        print("❌ 返回空数据")
except Exception as e:
    print(f"❌ 获取失败: {e}")

# 测试2：获取融资融券数据
print("\n" + "=" * 60)
print("📊 测试2：获取融资融券数据...")
test_codes = ['000001', '600000', '300750']
for code in test_codes:
    try:
        result = akshare_adapter.get_margin_trading(code)
        print(f"\n股票 {code}:")
        print(f"  是否支持融资融券: {result['is_margin_eligible']}")
        print(f"  融资融券评分: {result['margin_score']}")
        print(f"  数据来源: {'真实数据' if result.get('has_data') else '模拟数据'}")
    except Exception as e:
        print(f"  ❌ 获取失败: {e}")

# 测试3：获取资金流向数据
print("\n" + "=" * 60)
print("💰 测试3：获取资金流向数据...")
for code in test_codes:
    try:
        result = akshare_adapter.get_capital_flow(code)
        print(f"\n股票 {code}:")
        print(f"  主力净流入: {result['main_inflow']}亿")
        print(f"  流向强度: {result['flow_strength']}")
        print(f"  数据来源: {'真实数据' if result.get('has_data') else '模拟数据'}")
    except Exception as e:
        print(f"  ❌ 获取失败: {e}")

# 测试4：获取K线数据
print("\n" + "=" * 60)
print("📈 测试4：获取K线数据...")
try:
    kline = akshare_adapter.get_kline_data('000001', period='daily', days=5)
    if kline:
        print(f"✅ 成功获取 {len(kline)} 天的K线数据")
        print("\n最近5天K线：")
        for k in kline:
            print(f"  {k['date']}: 开{k['open']} 收{k['close']} 高{k['high']} 低{k['low']}")
    else:
        print("⚠️ 返回空数据，将使用模拟数据")
except Exception as e:
    print(f"❌ 获取失败: {e}")

print("\n" + "=" * 60)
print("✅ 测试完成！")
print("=" * 60)
