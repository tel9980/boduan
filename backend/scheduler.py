"""
后台定时筛选任务 - 简化版
每5分钟自动筛选一次，结果保存到JSON文件
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import time
import json
import schedule
from datetime import datetime

# 导入main.py中的函数
from main import get_all_stocks_data, get_margin_trading_info, get_board_type

# 筛选结果保存路径
RESULT_FILE = "screening_result.json"

def simple_screen():
    """简单快速筛选"""
    print(f"\n{'='*60}")
    print(f"🔄 开始自动筛选 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}")
    
    try:
        # 获取数据
        all_stocks = get_all_stocks_data()
        print(f"📈 获取到 {len(all_stocks)} 只股票数据")
        
        # 筛选条件
        change_min, change_max = -2, 5
        volume_ratio_min, volume_ratio_max = 1.5, 3
        market_cap_max = 160
        
        result = []
        checked = 0
        
        for stock in all_stocks:
            if not stock:
                continue
            
            checked += 1
            if checked % 500 == 0:
                print(f"   已检查: {checked}/{len(all_stocks)} 只...")
            
            code = stock['code']
            name = stock['name']
            clean_code = code.replace('sh', '').replace('sz', '')
            
            # 快速过滤
            if clean_code.startswith('688'):  # 排除科创板
                continue
            if 'ST' in name or '*ST' in name or '退' in name:  # 排除ST
                continue
            if stock['market_cap'] > market_cap_max:  # 市值限制
                continue
            if not (change_min <= stock['change_percent'] <= change_max):  # 涨幅
                continue
            if not (volume_ratio_min <= stock['volume_ratio'] <= volume_ratio_max):  # 量比
                continue
            
            # 检查融资融券
            margin_info = get_margin_trading_info(code)
            if not margin_info['is_margin_eligible']:
                continue
            
            # 检查板块
            board = get_board_type(code)
            if not board.get('allowed', False):
                continue
            
            # 添加到结果
            stock['board_type'] = board
            stock['margin_info'] = margin_info
            result.append(stock)
            
            # 最多保留50只
            if len(result) >= 50:
                break
        
        # 按涨幅排序
        result.sort(key=lambda x: x['change_percent'], reverse=True)
        
        # 保存结果
        output = {
            'timestamp': datetime.now().isoformat(),
            'count': len(result),
            'data': result[:20]  # 只保存前20只
        }
        
        with open(RESULT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 筛选完成：{len(all_stocks)} → {len(result)} 只")
        print(f"💾 结果已保存到 {RESULT_FILE}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ 筛选失败：{e}")
        import traceback
        traceback.print_exc()

def start_scheduler():
    """启动定时任务"""
    print("🚀 启动定时筛选任务...")
    print("⏰ 每5分钟自动筛选一次")
    
    # 立即执行一次
    simple_screen()
    
    # 每5分钟执行一次
    schedule.every(5).minutes.do(simple_screen)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_scheduler()
