
def get_market_environment() -> Dict[str, Any]:
    """Get market environment (based on SH Index)"""
    try:
        # Fetch SH Index (sh000001)
        data = fetch_qq_stock_data(['sh000001'])
        if not data:
            return None
        
        sh_index = parse_qq_stock_line(data)
        if not sh_index:
            return None
            
        current_price = sh_index['price']
        change_percent = sh_index['change_percent']
        
        # Determine sentiment
        sentiment = 'neutral'
        if change_percent > 1.0: sentiment = 'bullish'
        elif change_percent < -1.0: sentiment = 'bearish'
        
        return {
            'index_code': '000001',
            'index_name': '上证指数',
            'index_price': current_price,
            'index_change': change_percent,
            'above_ma5': True, # Simplified
            'market_sentiment': sentiment,
            'safe_to_buy': sentiment != 'bearish'
        }
    except Exception:
        return None

def detect_board_type(code: str) -> Dict[str, str]:
    if code.startswith('688'):
        return {'type': 'kcb', 'name': '科创板', 'color': 'purple', 'risk_note': '高风险'}
    elif code.startswith(('300', '301')):
        return {'type': 'cyb', 'name': '创业板', 'color': 'orange', 'risk_note': '波动大'}
    elif code.startswith('6'):
        return {'type': 'sh', 'name': '沪主板', 'color': 'blue', 'risk_note': '稳健'}
    else:
        return {'type': 'sz', 'name': '深主板', 'color': 'green', 'risk_note': '稳健'}

def detect_negative_news(code: str) -> Dict[str, Any]:
    # Mock implementation
    return {
        'has_negative_news': False,
        'negative_count': 0,
        'total_news_count': 5,
        'negative_news': [],
        'risk_level': 'low'
    }

def analyze_tail_trend(stock) -> Dict[str, Any]:
    # Simplified tail trend analysis
    change = stock.get('change_percent', 0)
    trend = 'stable'
    if change > 3: trend = 'strong_up'
    elif change > 0: trend = 'up'
    elif change < -3: trend = 'down'
    
    return {
        'trend': trend,
        'strength': abs(change),
        'tail_change': 0.5, # Mock
        'tail_volume_ratio': 1.2, # Mock
        'description': f'尾盘走势{trend}'
    }

def analyze_upside_space(stock) -> Dict[str, Any]:
    price = stock['price']
    limit_price = round(price * 1.1, 2) # Simplified 10% limit
    if stock['code'].startswith(('30', '68')):
        limit_price = round(price * 1.2, 2)
        
    space = (limit_price - price) / price * 100
    
    return {
        'space': round(space, 2),
        'limit_price': limit_price,
        'current_change': stock.get('change_percent', 0),
        'near_limit': space < 2.0,
        'limit_rate': 10 if stock['code'].startswith(('60', '00')) else 20
    }

def filter_stocks_service(codes: List[str], include_kcb_cyb: bool, prefer_tail_inflow: bool, strict_risk_control: bool) -> Dict[str, Any]:
    """Detailed filtering service"""
    results = []
    analysis_results = []
    ai_selected = []
    
    # 1. Fetch basic data in batch
    data_str = fetch_qq_stock_data([f"sh{c}" if c.startswith('6') else f"sz{c}" for c in codes])
    stocks_map = {}
    for line in data_str.strip().split('\n'):
        s = parse_qq_stock_line(line)
        if s: stocks_map[s['code']] = s
        
    # 2. Process each stock
    for code in codes:
        if code not in stocks_map: continue
        stock = stocks_map[code]
        
        # Skip if filters apply (though usually already filtered)
        if not include_kcb_cyb and (code.startswith('30') or code.startswith('68')): continue
        
        # Get Technical Data
        tech_data = get_technical_data(code)
        stock['kline'] = tech_data.get('kline', [])
        stock['indicators'] = tech_data.get('indicators')
        stock['ma5'] = tech_data.get('ma5', 0)
        
        # Enrich Data
        margin_info = get_margin_trading_info(code)
        stock['margin_info'] = margin_info
        
        capital_flow = get_capital_flow(code)
        stock['capital_flow'] = capital_flow
        
        stock['beginner_score'] = calculate_beginner_score(stock, margin_info)
        stock['beginner_tags'] = get_beginner_tags(stock, margin_info)
        stock['operation_suggestion'] = get_operation_suggestion(stock)
        stock['ai_analysis'] = generate_analysis_report(stock)
        
        # Board Type
        stock['board_type'] = detect_board_type(code)
        
        # Technical Indicators for frontend
        tech_indicators = {
            'tail_trend': analyze_tail_trend(stock),
            'upside_space': analyze_upside_space(stock),
            'capital_flow': capital_flow,
            'margin_info': margin_info,
            'open_probability': 'medium'
        }
        
        # AI Selection Logic
        if stock['beginner_score'] >= 80:
            ai_item = {
                'code': code,
                'name': stock['name'],
                'price': stock['price'],
                'change_percent': stock['change_percent'],
                'volume_ratio': stock['volume_ratio'],
                'market_cap': stock['market_cap'],
                'turnover': stock['turnover'],
                'score': stock['beginner_score'],
                'reasons': [stock['ai_analysis']],
                'warnings': [],
                'indicators': tech_indicators,
                'negative_news': detect_negative_news(code),
                'board_type': stock['board_type']
            }
            ai_selected.append(ai_item)
            
        results.append(stock)
        analysis_results.append({
            'code': code,
            'analysis': stock['ai_analysis'],
            'score': stock['beginner_score']
        })
        
    # Sort by score
    results.sort(key=lambda x: x.get('beginner_score', 0), reverse=True)
    ai_selected.sort(key=lambda x: x['score'], reverse=True)
    
    # Generate Final Picks (Top 3)
    final_picks = []
    for item in ai_selected[:3]:
        pick = {
            'rank': len(final_picks) + 1,
            'code': item['code'],
            'name': item['name'],
            'price': item['price'],
            'change_percent': item['change_percent'],
            'volume_ratio': item['volume_ratio'],
            'market_cap': item['market_cap'],
            'score': item['score'],
            'summary': item['reasons'][0],
            'reasons': item['reasons'],
            'warnings': item['warnings'],
            'tail_trend': item['indicators']['tail_trend'],
            'upside_space': item['indicators']['upside_space'],
            'capital_flow': item['indicators']['capital_flow'],
            'board_type': item['board_type'],
            'trade_plan': {
                'entry_price': item['price'],
                'entry_time': '明日开盘',
                'stop_loss_price': item['price'] * 0.95,
                'stop_loss_ratio': -5,
                'take_profit_price': item['price'] * 1.1,
                'take_profit_ratio': 10,
                'expected_return': 10,
                'hold_period': '1-3天',
                'risk_reward_ratio': 2.0
            }
        }
        final_picks.append(pick)

    return {
        "count": len(results),
        "total_analyzed": len(codes),
        "filter_criteria": {
            "volume_pattern": "阶梯式放量",
            "price_position": "站稳5日线+近期高点",
            "sector": "优先数字经济（加分项）"
        },
        "data": results,
        "all_analysis": analysis_results,
        "ai_selected": ai_selected,
        "market_environment": get_market_environment() or {},
        "final_pick": final_picks[0] if final_picks else None,
        "final_picks": final_picks
    }
