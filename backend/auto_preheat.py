"""自动预热缓存 - 每5分钟自动刷新缓存"""
import requests
import time
import schedule
from datetime import datetime

API_BASE = "http://localhost:8000/api"

strategies = [
    ("balanced", "平衡型"),
    ("aggressive", "激进型"),
    ("conservative", "保守型")
]

def preheat_all_strategies():
    """预热所有策略的缓存"""
    print("\n" + "=" * 60)
    print(f"🔄 开始预热缓存 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
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
                stocks = data.get('data', [])
                print(f"✅ {strategy_name}缓存生成成功！耗时：{elapsed:.1f}秒")
                if stocks:
                    print(f"   推荐股票：{', '.join([s['name'] for s in stocks])}")
            else:
                print(f"❌ {strategy_name}缓存生成失败：{response.status_code}")
        except Exception as e:
            print(f"❌ {strategy_name}缓存生成异常：{e}")
        
        time.sleep(2)  # 等待2秒
    
    print("\n" + "=" * 60)
    print(f"✅ 缓存预热完成 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

def main():
    """主函数"""
    print("""
╔══════════════════════════════════════════════════════╗
║     A股波段交易筛选系统 - 自动预热服务               ║
║                                                      ║
║  功能：每30分钟自动刷新三种策略的缓存                ║
║  效果：用户任何时候点击都能秒开                      ║
║                                                      ║
║  按 Ctrl+C 停止服务                                  ║
╚══════════════════════════════════════════════════════╝
    """)
    
    # 立即执行一次
    print("\n🚀 首次预热...")
    preheat_all_strategies()
    
    # 每30分钟执行一次
    schedule.every(30).minutes.do(preheat_all_strategies)
    
    print("\n⏰ 定时任务已启动，每30分钟自动刷新缓存...")
    print("   下次刷新时间：30分钟后")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 服务已停止")

if __name__ == "__main__":
    main()
