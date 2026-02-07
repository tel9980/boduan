import requests
import json

# 测试三个策略
strategies = [
    {
        'name': '激进型',
        'params': {
            'change_min': 3,
            'change_max': 7,
            'volume_ratio_min': 2,
            'volume_ratio_max': 5,
            'market_cap_max': 160,
            'limit': 3,
            'strategy_type': 'aggressive'
        }
    },
    {
        'name': '保守型',
        'params': {
            'change_min': -2,
            'change_max': 1,
            'volume_ratio_min': 1.5,
            'volume_ratio_max': 2.5,
            'market_cap_max': 160,
            'limit': 3,
            'strategy_type': 'conservative'
        }
    },
    {
        'name': '平衡型',
        'params': {
            'change_min': 0,
            'change_max': 4,
            'volume_ratio_min': 1.8,
            'volume_ratio_max': 3,
            'market_cap_max': 160,
            'limit': 3,
            'strategy_type': 'balanced'
        }
    }
]

print("=" * 80)
print("测试策略差异化")
print("=" * 80)

results = {}

for strategy in strategies:
    print(f"\n{'='*80}")
    print(f"测试 {strategy['name']}")
    print(f"{'='*80}")
    
    url = "http://localhost:8000/api/band-trading-realtime"
    
    try:
        response = requests.get(url, params=strategy['params'], timeout=60)
        response.raise_for_status()
        data = response.json()
        
        print(f"✅ 请求成功")
        print(f"返回股票数量: {data.get('count', 0)}")
        
        stocks = data.get('data', [])
        results[strategy['name']] = [s['code'] for s in stocks]
        
        print(f"\n选出的股票:")
        for i, stock in enumerate(stocks, 1):
            print(f"  {i}. {stock['name']} ({stock['code']})")
            print(f"     涨幅: {stock['change_percent']:.2f}%")
            print(f"     量比: {stock['volume_ratio']:.2f}")
            print(f"     评分: {stock.get('score', 0):.1f}")
            if stock.get('margin_info'):
                print(f"     融资融券评分: {stock['margin_info'].get('margin_score', 0):.1f}")
            print()
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        results[strategy['name']] = []

# 对比结果
print("\n" + "=" * 80)
print("对比结果")
print("=" * 80)

all_codes = set()
for name, codes in results.items():
    all_codes.update(codes)
    print(f"{name}: {codes}")

if len(all_codes) == sum(len(codes) for codes in results.values()):
    print("\n✅ 成功！三个策略选出的股票完全不同")
else:
    print("\n⚠️ 警告：有重复的股票")
    
print("\n" + "=" * 80)
