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
from main import get_all_stocks_data, get_margin_trading_info, get_board_type, get_industry

# 筛选结果保存路径
RESULT_FILE = "screening_result.json"

def simple_screen():
    """简单快速筛选 - 板块分散版"""
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
        
        # 按板块分类存储
        sh_stocks = []  # 沪市主板
        sz_stocks = []  # 深市主板
        cyb_stocks = []  # 创业板
        
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
            
            # 添加板块和融资融券信息
            stock['board_type'] = board
            stock['margin_info'] = margin_info
            stock['industry'] = get_industry(name, code)  # 添加行业信息
            
            # 按板块分类
            if board['type'] == 'sh':
                sh_stocks.append(stock)
            elif board['type'] == 'sz':
                sz_stocks.append(stock)
            elif board['type'] == 'cyb':
                cyb_stocks.append(stock)
            
            # 每个板块最多保留20只
            if len(sh_stocks) >= 20 and len(sz_stocks) >= 20 and len(cyb_stocks) >= 20:
                break
        
        # 按涨幅排序各板块
        sh_stocks.sort(key=lambda x: x['change_percent'], reverse=True)
        sz_stocks.sort(key=lambda x: x['change_percent'], reverse=True)
        cyb_stocks.sort(key=lambda x: x['change_percent'], reverse=True)
        
        # 板块分散策略：优先选择不同板块
        result = []
        
        # 1. 先从每个板块各选1只（确保分散）
        if sh_stocks:
            result.append(sh_stocks[0])
        if sz_stocks:
            result.append(sz_stocks[0])
        if cyb_stocks:
            result.append(cyb_stocks[0])
        
        # 2. 如果还不够3只，从剩余的补充
        if len(result) < 3:
            remaining = []
            if len(sh_stocks) > 1:
                remaining.extend(sh_stocks[1:])
            if len(sz_stocks) > 1:
                remaining.extend(sz_stocks[1:])
            if len(cyb_stocks) > 1:
                remaining.extend(cyb_stocks[1:])
            
            remaining.sort(key=lambda x: x['change_percent'], reverse=True)
            result.extend(remaining[:3 - len(result)])
        
        # 保存结果
        output = {
            'timestamp': datetime.now().isoformat(),
            'count': len(result),
            'data': result,
            'board_distribution': {
                'sh_count': sum(1 for s in result if s['board_type']['type'] == 'sh'),
                'sz_count': sum(1 for s in result if s['board_type']['type'] == 'sz'),
                'cyb_count': sum(1 for s in result if s['board_type']['type'] == 'cyb'),
            },
            'industry_distribution': {
                industry: sum(1 for s in result if s.get('industry') == industry)
                for industry in set(s.get('industry', '未知') for s in result)
            }
        }
        
        with open(RESULT_FILE, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 筛选完成：{len(all_stocks)} → {len(result)} 只")
        print(f"📊 板块分布：沪市{output['board_distribution']['sh_count']}只 | 深市{output['board_distribution']['sz_count']}只 | 创业板{output['board_distribution']['cyb_count']}只")
        print(f"🏭 行业分布：{' | '.join([f'{k}({v}只)' for k, v in output['industry_distribution'].items()])}")
        print(f"💾 结果已保存到 {RESULT_FILE}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"❌ 筛选失败：{e}")
        import traceback
        traceback.print_exc()

def start_scheduler():
    """启动定时任务"""
    print("🚀 启动定时筛选任务...")
    print("⏰ 每30分钟自动筛选一次")
    
    # 立即执行一次
    simple_screen()
    
    # 每30分钟执行一次
    schedule.every(30).minutes.do(simple_screen)
    
    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == "__main__":
    start_scheduler()
