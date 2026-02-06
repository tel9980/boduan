# Design Document: System Optimization Roadmap

## Overview

本设计文档为A股波段交易筛选系统（v4.5.0）定义了全面的优化路线图。系统当前基于Python FastAPI后端和React TypeScript前端架构，已实现核心的波段交易筛选功能。本优化路线图包含10个关键优化方向，旨在通过真实数据接入、性能提升、智能化增强等手段，将系统从MVP阶段提升到生产级应用。

设计重点关注：
1. **优先级排序** - 基于价值、可行性、难度的综合评估
2. **技术可行性** - 评估每个方向的技术实现路径
3. **实现难度** - 量化开发工作量和复杂度
4. **用户体验提升** - 评估对投资决策效率的影响

本设计采用评分矩阵方法，为每个优化方向提供量化评估，并给出分阶段实施建议。

## Architecture

### 整体架构增强

当前系统架构：
```
Frontend (React + TypeScript) <--> Backend (FastAPI + Python) <--> Mock Data
```

优化后架构：
```
Frontend (React + TypeScript + PWA)
    |
    +-- WebSocket (实时数据)
    |
    v
Backend (FastAPI + Python)
    |
    +-- Cache Layer (Redis)
    +-- Database (PostgreSQL/MySQL)
    +-- Message Queue (Celery + Redis)
    |
    v
External Services
    +-- Market Data APIs (Tushare, 东方财富)
    +-- AI Services (OpenAI, 通义千问)
    +-- Notification Services (邮件, 微信)
```


### 架构层次说明

**表现层 (Presentation Layer)**
- React前端应用，支持PWA
- 响应式设计，适配移动端
- WebSocket客户端，接收实时数据推送

**应用层 (Application Layer)**
- FastAPI REST API服务
- WebSocket服务器
- 后台任务调度器（Celery）

**业务逻辑层 (Business Logic Layer)**
- 筛选引擎（优化后的性能）
- 回测引擎
- 技术指标计算引擎
- 板块轮动分析器
- 风险管理计算器
- AI分析协调器

**数据层 (Data Layer)**
- 缓存层（Redis）- 热数据、会话、任务队列
- 持久化层（PostgreSQL/MySQL）- 历史数据、用户配置、提醒规则
- 外部数据源适配器

**外部服务层 (External Services Layer)**
- 市场数据API集成
- AI服务集成
- 通知服务集成

## Components and Interfaces

### 1. Real Data Module (真实数据接入模块)

**职责**: 从外部API获取真实市场数据，替换当前的模拟数据

**核心组件**:
```python
class DataSourceAdapter:
    """数据源适配器基类"""
    def fetch_margin_trading_data(self, stock_codes: List[str]) -> pd.DataFrame
    def fetch_capital_flow_data(self, stock_codes: List[str]) -> pd.DataFrame
    def fetch_kline_data(self, stock_code: str, period: str, start_date: str, end_date: str) -> pd.DataFrame
    def fetch_realtime_quotes(self, stock_codes: List[str]) -> pd.DataFrame

class TushareAdapter(DataSourceAdapter):
    """Tushare数据源实现"""
    def __init__(self, token: str)
    # 实现具体的Tushare API调用

class EastMoneyAdapter(DataSourceAdapter):
    """东方财富数据源实现"""
    def __init__(self, api_key: str)
    # 实现具体的东方财富API调用

class DataSourceManager:
    """数据源管理器，支持多数据源和故障转移"""
    def __init__(self, primary: DataSourceAdapter, fallback: DataSourceAdapter)
    def get_data(self, data_type: str, **kwargs) -> pd.DataFrame
    # 优先使用主数据源，失败时切换到备用数据源
```

**接口设计**:
- `GET /api/v1/data/margin-trading?codes=000001,000002` - 获取融资融券数据
- `GET /api/v1/data/capital-flow?codes=000001,000002` - 获取资金流向数据
- `GET /api/v1/data/kline?code=000001&period=daily&start=2024-01-01&end=2024-12-31` - 获取K线数据
- `GET /api/v1/data/realtime?codes=000001,000002` - 获取实时行情

**数据源选择建议**:
- **主数据源**: Tushare Pro（需付费，数据质量高，API稳定）
- **备用数据源**: AKShare（免费，社区维护，可作为备份）
- **实时数据**: 新浪财经API或腾讯财经API（免费，延迟较低）


### 2. Performance Optimizer (性能优化模块)

**职责**: 通过缓存、增量更新、数据库存储等手段，将筛选时间从23-25秒降低到10秒以内

**优化策略**:

**2.1 多层缓存架构**
```python
class CacheManager:
    """缓存管理器"""
    def __init__(self, redis_client: Redis)
    
    # L1缓存：内存缓存（进程内，最快）
    memory_cache: Dict[str, Any] = {}
    
    # L2缓存：Redis缓存（跨进程，快速）
    redis_client: Redis
    
    # L3缓存：数据库缓存（持久化，较慢）
    db_session: Session
    
    def get(self, key: str, level: int = 2) -> Optional[Any]
    def set(self, key: str, value: Any, ttl: int, level: int = 2)
    def invalidate(self, pattern: str)
```

**缓存策略**:
- 基础数据（股票列表、行业分类）：缓存24小时
- 日线数据：缓存到当日收盘，次日凌晨失效
- 实时数据：缓存3秒（交易时段）
- 筛选结果：缓存5分钟，用户可手动刷新

**2.2 增量更新机制**
```python
class IncrementalUpdater:
    """增量更新器"""
    def __init__(self, db_session: Session, cache_manager: CacheManager)
    
    def get_changed_stocks(self, last_update_time: datetime) -> List[str]
    # 查询自上次更新以来发生变化的股票
    
    def update_changed_data(self, stock_codes: List[str])
    # 仅更新变化的股票数据
    
    def mark_update_timestamp(self, stock_codes: List[str])
    # 标记更新时间戳
```

**2.3 数据库设计**
```sql
-- 股票基础信息表
CREATE TABLE stocks (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(50),
    industry VARCHAR(50),
    market VARCHAR(10),
    is_margin_trading BOOLEAN,
    updated_at TIMESTAMP,
    INDEX idx_industry (industry),
    INDEX idx_updated_at (updated_at)
);

-- 日线数据表（分区表，按月分区）
CREATE TABLE daily_quotes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stock_code VARCHAR(10),
    trade_date DATE,
    open DECIMAL(10,2),
    close DECIMAL(10,2),
    high DECIMAL(10,2),
    low DECIMAL(10,2),
    volume BIGINT,
    amount DECIMAL(20,2),
    updated_at TIMESTAMP,
    INDEX idx_stock_date (stock_code, trade_date),
    INDEX idx_trade_date (trade_date)
) PARTITION BY RANGE (YEAR(trade_date) * 100 + MONTH(trade_date));

-- 融资融券数据表
CREATE TABLE margin_trading (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stock_code VARCHAR(10),
    trade_date DATE,
    margin_balance DECIMAL(20,2),
    margin_buy_amount DECIMAL(20,2),
    short_balance DECIMAL(20,2),
    short_sell_volume BIGINT,
    updated_at TIMESTAMP,
    UNIQUE KEY uk_stock_date (stock_code, trade_date),
    INDEX idx_trade_date (trade_date)
);

-- 资金流向数据表
CREATE TABLE capital_flow (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stock_code VARCHAR(10),
    trade_date DATE,
    main_net_inflow DECIMAL(20,2),
    large_order_net_inflow DECIMAL(20,2),
    retail_net_inflow DECIMAL(20,2),
    updated_at TIMESTAMP,
    UNIQUE KEY uk_stock_date (stock_code, trade_date),
    INDEX idx_trade_date (trade_date)
);
```

**2.4 并行处理**
```python
class ParallelScreener:
    """并行筛选器"""
    def __init__(self, num_workers: int = 4)
    
    def screen_stocks_parallel(self, stock_codes: List[str], strategy: Strategy) -> List[StockResult]:
        # 将股票列表分成多个批次
        batches = self._split_into_batches(stock_codes, batch_size=1000)
        
        # 使用进程池并行处理
        with ProcessPoolExecutor(max_workers=self.num_workers) as executor:
            futures = [executor.submit(self._screen_batch, batch, strategy) for batch in batches]
            results = [future.result() for future in futures]
        
        return self._merge_results(results)
```

**性能目标**:
- 全市场筛选（4909只股票）：从23-25秒降低到10秒以内
- 单只股票详情加载：从2秒降低到500ms以内
- 缓存命中率：达到80%以上
- 数据库查询响应时间：95%的查询在100ms内完成


### 3. Alert System (智能提醒系统)

**职责**: 监控股票价格和技术指标，在满足条件时主动通知用户

**核心组件**:
```python
class AlertRule:
    """提醒规则"""
    id: str
    user_id: str
    stock_code: str
    rule_type: str  # 'price', 'buy_signal', 'sell_signal', 'abnormal'
    conditions: Dict[str, Any]
    notification_channels: List[str]  # ['browser', 'email', 'wechat']
    is_active: bool
    triggered_at: Optional[datetime]

class AlertMonitor:
    """提醒监控器（后台任务）"""
    def __init__(self, db_session: Session, notifier: Notifier)
    
    def check_price_alerts(self):
        # 检查价格提醒（每分钟执行）
        rules = self._get_active_rules(rule_type='price')
        for rule in rules:
            current_price = self._get_current_price(rule.stock_code)
            if self._evaluate_condition(current_price, rule.conditions):
                self.notifier.send(rule)
                self._mark_triggered(rule)
    
    def check_signal_alerts(self):
        # 检查买卖信号提醒（每5分钟执行）
        rules = self._get_active_rules(rule_type__in=['buy_signal', 'sell_signal'])
        for rule in rules:
            signals = self._calculate_signals(rule.stock_code)
            if self._has_signal(signals, rule.rule_type):
                self.notifier.send(rule)
                self._mark_triggered(rule)
    
    def check_abnormal_alerts(self):
        # 检查异动提醒（每分钟执行）
        rules = self._get_active_rules(rule_type='abnormal')
        for rule in rules:
            abnormal_events = self._detect_abnormal(rule.stock_code)
            if abnormal_events:
                self.notifier.send(rule, extra_data=abnormal_events)
                self._mark_triggered(rule)

class Notifier:
    """通知发送器"""
    def __init__(self, browser_notifier, email_notifier, wechat_notifier)
    
    def send(self, rule: AlertRule, extra_data: Dict = None):
        message = self._format_message(rule, extra_data)
        
        for channel in rule.notification_channels:
            if channel == 'browser':
                self.browser_notifier.send(rule.user_id, message)
            elif channel == 'email':
                self.email_notifier.send(rule.user_id, message)
            elif channel == 'wechat':
                self.wechat_notifier.send(rule.user_id, message)
```

**提醒类型设计**:

1. **价格提醒**
   - 条件：`price >= target_price` 或 `price <= target_price`
   - 示例：当股票价格达到15.00元时提醒

2. **买入信号提醒**
   - 条件：突破压力位、MACD金叉、KDJ金叉、成交量放大
   - 示例：当MACD出现金叉且成交量放大时提醒

3. **卖出信号提醒**
   - 条件：跌破支撑位、MACD死叉、KDJ死叉、高位滞涨
   - 示例：当价格跌破支撑位时提醒

4. **异动提醒**
   - 条件：涨跌幅超过阈值、成交量异常放大、振幅过大
   - 示例：当涨幅超过5%或成交量放大3倍时提醒

**接口设计**:
- `POST /api/v1/alerts` - 创建提醒规则
- `GET /api/v1/alerts` - 获取用户的提醒规则列表
- `PUT /api/v1/alerts/{alert_id}` - 更新提醒规则
- `DELETE /api/v1/alerts/{alert_id}` - 删除提醒规则
- `GET /api/v1/alerts/history` - 获取提醒历史记录

**通知渠道实现**:
- **浏览器通知**: 使用Web Push API，需要用户授权
- **邮件通知**: 使用SMTP或第三方邮件服务（如SendGrid）
- **微信通知**: 使用微信公众号模板消息或企业微信机器人

**防重复机制**:
- 同一提醒规则触发后，在24小时内不再重复通知
- 用户可以手动重置提醒状态
- 提供"暂停提醒"功能，避免频繁打扰


### 4. Backtesting Engine (回测引擎)

**职责**: 在历史数据上验证策略有效性，计算收益率、最大回撤、夏普比率等指标

**核心组件**:
```python
class BacktestEngine:
    """回测引擎"""
    def __init__(self, data_provider: DataProvider, strategy: Strategy)
    
    def run_backtest(self, 
                     stock_codes: List[str],
                     start_date: str,
                     end_date: str,
                     initial_capital: float = 100000.0,
                     commission_rate: float = 0.0003,
                     slippage_rate: float = 0.001) -> BacktestResult:
        """
        执行回测
        
        Args:
            stock_codes: 股票代码列表
            start_date: 回测开始日期
            end_date: 回测结束日期
            initial_capital: 初始资金
            commission_rate: 佣金费率（双向）
            slippage_rate: 滑点率
        
        Returns:
            BacktestResult: 回测结果
        """
        portfolio = Portfolio(initial_capital)
        trades = []
        
        for date in self._get_trading_dates(start_date, end_date):
            # 获取当日数据
            market_data = self.data_provider.get_data(stock_codes, date)
            
            # 生成交易信号
            signals = self.strategy.generate_signals(market_data)
            
            # 执行交易
            for signal in signals:
                if signal.action == 'buy':
                    trade = portfolio.buy(
                        stock_code=signal.stock_code,
                        price=signal.price * (1 + slippage_rate),
                        quantity=signal.quantity,
                        commission_rate=commission_rate,
                        date=date
                    )
                    trades.append(trade)
                elif signal.action == 'sell':
                    trade = portfolio.sell(
                        stock_code=signal.stock_code,
                        price=signal.price * (1 - slippage_rate),
                        quantity=signal.quantity,
                        commission_rate=commission_rate,
                        date=date
                    )
                    trades.append(trade)
            
            # 更新持仓市值
            portfolio.update_market_value(market_data, date)
        
        # 计算回测指标
        return self._calculate_metrics(portfolio, trades)

class BacktestResult:
    """回测结果"""
    total_return: float  # 总收益率
    annual_return: float  # 年化收益率
    max_drawdown: float  # 最大回撤
    sharpe_ratio: float  # 夏普比率
    win_rate: float  # 胜率
    profit_loss_ratio: float  # 盈亏比
    total_trades: int  # 总交易次数
    trades: List[Trade]  # 交易明细
    equity_curve: pd.DataFrame  # 权益曲线
    drawdown_curve: pd.DataFrame  # 回撤曲线

class Portfolio:
    """投资组合"""
    def __init__(self, initial_capital: float)
    
    cash: float  # 现金
    positions: Dict[str, Position]  # 持仓
    equity_history: List[Tuple[datetime, float]]  # 权益历史
    
    def buy(self, stock_code: str, price: float, quantity: int, 
            commission_rate: float, date: datetime) -> Trade
    
    def sell(self, stock_code: str, price: float, quantity: int,
             commission_rate: float, date: datetime) -> Trade
    
    def update_market_value(self, market_data: pd.DataFrame, date: datetime)
    
    def get_total_value(self) -> float:
        return self.cash + sum(pos.market_value for pos in self.positions.values())
```

**回测指标计算**:

1. **总收益率**: `(期末总资产 - 期初总资产) / 期初总资产`
2. **年化收益率**: `(1 + 总收益率) ^ (365 / 回测天数) - 1`
3. **最大回撤**: `max((峰值 - 谷值) / 峰值)`
4. **夏普比率**: `(年化收益率 - 无风险利率) / 收益率标准差`
5. **胜率**: `盈利交易次数 / 总交易次数`
6. **盈亏比**: `平均盈利 / 平均亏损`

**参数优化功能**:
```python
class ParameterOptimizer:
    """参数优化器"""
    def __init__(self, backtest_engine: BacktestEngine)
    
    def optimize(self, 
                 parameter_space: Dict[str, List[Any]],
                 optimization_metric: str = 'sharpe_ratio') -> Dict[str, Any]:
        """
        网格搜索优化参数
        
        Args:
            parameter_space: 参数空间，如 {'ma_short': [5, 10, 20], 'ma_long': [30, 60, 120]}
            optimization_metric: 优化目标指标
        
        Returns:
            最优参数组合
        """
        best_params = None
        best_score = float('-inf')
        
        for params in self._generate_combinations(parameter_space):
            strategy = self._create_strategy_with_params(params)
            result = self.backtest_engine.run_backtest(strategy)
            score = getattr(result, optimization_metric)
            
            if score > best_score:
                best_score = score
                best_params = params
        
        return best_params
```

**接口设计**:
- `POST /api/v1/backtest/run` - 执行回测
- `GET /api/v1/backtest/results/{backtest_id}` - 获取回测结果
- `POST /api/v1/backtest/optimize` - 参数优化
- `GET /api/v1/backtest/history` - 获取历史回测记录


### 5. AI Analyzer (AI增强分析模块)

**职责**: 接入大语言模型，提供基本面分析和智能问答功能

**核心组件**:
```python
class AIAnalyzer:
    """AI分析器"""
    def __init__(self, llm_client: LLMClient, cache_manager: CacheManager)
    
    def analyze_fundamentals(self, stock_code: str) -> FundamentalAnalysis:
        """
        生成基本面分析报告
        
        Args:
            stock_code: 股票代码
        
        Returns:
            FundamentalAnalysis: 基本面分析报告
        """
        # 检查缓存
        cache_key = f"ai_analysis:{stock_code}"
        cached = self.cache_manager.get(cache_key)
        if cached:
            return cached
        
        # 收集数据
        stock_info = self._get_stock_info(stock_code)
        financial_data = self._get_financial_data(stock_code)
        industry_data = self._get_industry_data(stock_info.industry)
        news = self._get_recent_news(stock_code)
        
        # 构建提示词
        prompt = self._build_analysis_prompt(stock_info, financial_data, industry_data, news)
        
        # 调用LLM
        response = self.llm_client.generate(prompt, max_tokens=2000)
        
        # 解析结果
        analysis = self._parse_analysis(response)
        
        # 缓存结果（24小时）
        self.cache_manager.set(cache_key, analysis, ttl=86400)
        
        return analysis
    
    def answer_question(self, stock_code: str, question: str) -> str:
        """
        智能问答
        
        Args:
            stock_code: 股票代码
            question: 用户问题
        
        Returns:
            回答内容
        """
        # 收集相关数据
        context = self._build_context(stock_code)
        
        # 构建提示词
        prompt = f"""
        基于以下股票信息回答问题：
        
        {context}
        
        问题：{question}
        
        请提供专业、客观的回答。
        """
        
        # 调用LLM
        response = self.llm_client.generate(prompt, max_tokens=1000)
        
        return response

class LLMClient:
    """大语言模型客户端"""
    def __init__(self, provider: str, api_key: str):
        """
        Args:
            provider: 'openai', 'qwen', 'glm' 等
            api_key: API密钥
        """
        self.provider = provider
        self.api_key = api_key
    
    def generate(self, prompt: str, max_tokens: int = 1000) -> str:
        if self.provider == 'openai':
            return self._call_openai(prompt, max_tokens)
        elif self.provider == 'qwen':
            return self._call_qwen(prompt, max_tokens)
        elif self.provider == 'glm':
            return self._call_glm(prompt, max_tokens)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

class FundamentalAnalysis:
    """基本面分析报告"""
    stock_code: str
    stock_name: str
    business_overview: str  # 业务概述
    financial_health: str  # 财务状况
    industry_position: str  # 行业地位
    competitive_advantage: str  # 竞争优势
    risk_factors: str  # 风险因素
    investment_rating: str  # 投资评级（买入/持有/卖出）
    target_price: Optional[float]  # 目标价格
    generated_at: datetime
```

**提示词模板设计**:

```python
ANALYSIS_PROMPT_TEMPLATE = """
你是一位专业的股票分析师。请基于以下信息对股票进行全面的基本面分析：

## 股票基本信息
- 代码：{stock_code}
- 名称：{stock_name}
- 行业：{industry}
- 市值：{market_cap}亿元
- 市盈率：{pe_ratio}
- 市净率：{pb_ratio}

## 财务数据（最近一年）
- 营业收入：{revenue}亿元，同比增长{revenue_growth}%
- 净利润：{net_profit}亿元，同比增长{profit_growth}%
- 毛利率：{gross_margin}%
- 净利率：{net_margin}%
- ROE：{roe}%
- 资产负债率：{debt_ratio}%

## 行业情况
{industry_overview}

## 最近新闻
{recent_news}

请从以下维度进行分析：
1. 业务概述：公司主营业务和商业模式
2. 财务状况：财务健康度和盈利能力评估
3. 行业地位：在行业中的竞争地位
4. 竞争优势：核心竞争力和护城河
5. 风险因素：主要风险点
6. 投资评级：给出买入/持有/卖出建议，并说明理由
7. 目标价格：基于分析给出合理的目标价格区间

请保持客观、专业，避免过度乐观或悲观。
"""
```

**LLM服务选择建议**:
- **OpenAI GPT-4**: 分析质量最高，但成本较高，适合高端用户
- **通义千问**: 国内服务，响应快，成本适中，适合大众用户
- **智谱GLM**: 金融领域表现好，成本较低，适合预算有限场景

**成本控制策略**:
- 缓存分析结果，避免重复调用
- 对免费用户限制调用次数（如每日3次）
- 对付费用户提供更高的调用额度
- 使用较小的模型处理简单问题，复杂问题才用大模型

**接口设计**:
- `POST /api/v1/ai/analyze` - 生成基本面分析报告
- `POST /api/v1/ai/ask` - 智能问答
- `GET /api/v1/ai/quota` - 查询用户剩余调用额度


### 6. Mobile Optimizer (移动端优化模块)

**职责**: 提供响应式设计和PWA支持，优化移动端体验

**响应式设计策略**:

```typescript
// 断点定义
const breakpoints = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
};

// 移动端优化的组件设计
interface MobileOptimizedComponent {
  // 触摸手势支持
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  
  // 自适应布局
  mobileLayout?: 'stack' | 'grid' | 'list';
  
  // 懒加载
  lazyLoad?: boolean;
  
  // 简化模式
  simplifiedMode?: boolean;
}

// 移动端股票列表组件
const MobileStockList: React.FC = () => {
  return (
    <VirtualList
      itemHeight={80}  // 移动端行高
      overscan={5}     // 预渲染5行
      onSwipeLeft={(item) => addToFavorites(item)}
      onSwipeRight={(item) => removeFromList(item)}
    >
      {stocks.map(stock => (
        <MobileStockCard 
          key={stock.code}
          stock={stock}
          simplified={true}  // 移动端显示简化信息
        />
      ))}
    </VirtualList>
  );
};
```

**PWA配置**:

```json
// manifest.json
{
  "name": "A股波段交易筛选系统",
  "short_name": "波段交易",
  "description": "专业的A股波段交易筛选工具",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1890ff",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

```typescript
// Service Worker 配置
// sw.js
const CACHE_NAME = 'stock-screener-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-192x192.png'
];

// 缓存策略：网络优先，失败时使用缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 缓存成功的响应
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 网络失败时使用缓存
        return caches.match(event.request);
      })
  );
});
```

**移动端性能优化**:

1. **图片优化**
   - 使用WebP格式
   - 响应式图片（srcset）
   - 懒加载非关键图片

2. **代码分割**
   - 路由级别的代码分割
   - 组件级别的懒加载
   - 第三方库按需加载

3. **首屏优化**
   - 关键CSS内联
   - 预加载关键资源
   - 骨架屏占位

4. **网络优化**
   - 启用HTTP/2
   - 使用CDN加速
   - 压缩传输数据（gzip/brotli）

**移动端交互优化**:

```typescript
// 触摸手势库
import { useSwipeable } from 'react-swipeable';

const StockCard: React.FC<{ stock: Stock }> = ({ stock }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // 左滑添加到自选
      addToFavorites(stock);
      showToast('已添加到自选');
    },
    onSwipedRight: () => {
      // 右滑删除
      removeFromList(stock);
      showToast('已移除');
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });
  
  return (
    <div {...handlers} className="stock-card">
      {/* 股票信息 */}
    </div>
  );
};

// 长按显示详情
const useLongPress = (callback: () => void, ms: number = 500) => {
  const [startLongPress, setStartLongPress] = useState(false);
  
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (startLongPress) {
      timerId = setTimeout(callback, ms);
    }
    return () => {
      clearTimeout(timerId);
    };
  }, [startLongPress, callback, ms]);
  
  return {
    onTouchStart: () => setStartLongPress(true),
    onTouchEnd: () => setStartLongPress(false),
    onMouseDown: () => setStartLongPress(true),
    onMouseUp: () => setStartLongPress(false),
    onMouseLeave: () => setStartLongPress(false)
  };
};
```

**性能目标**:
- 移动端首屏加载时间：< 3秒（4G网络）
- 交互响应时间：< 100ms
- PWA安装率：> 20%（访问3次以上的用户）
- Lighthouse评分：Performance > 90, PWA > 90


### 7. Realtime Pusher (实时数据推送模块)

**职责**: 通过WebSocket推送实时股票价格更新

**核心组件**:

```python
# 后端 WebSocket 服务器
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set

class ConnectionManager:
    """WebSocket连接管理器"""
    def __init__(self):
        # 用户ID -> WebSocket连接
        self.active_connections: Dict[str, WebSocket] = {}
        # 股票代码 -> 订阅该股票的用户ID集合
        self.subscriptions: Dict[str, Set[str]] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        # 清理该用户的所有订阅
        for stock_code in list(self.subscriptions.keys()):
            if user_id in self.subscriptions[stock_code]:
                self.subscriptions[stock_code].remove(user_id)
                if not self.subscriptions[stock_code]:
                    del self.subscriptions[stock_code]
    
    def subscribe(self, user_id: str, stock_codes: List[str]):
        for stock_code in stock_codes:
            if stock_code not in self.subscriptions:
                self.subscriptions[stock_code] = set()
            self.subscriptions[stock_code].add(user_id)
    
    def unsubscribe(self, user_id: str, stock_codes: List[str]):
        for stock_code in stock_codes:
            if stock_code in self.subscriptions:
                self.subscriptions[stock_code].discard(user_id)
    
    async def broadcast_price_update(self, stock_code: str, price_data: Dict):
        """向订阅该股票的所有用户推送价格更新"""
        if stock_code not in self.subscriptions:
            return
        
        message = {
            "type": "price_update",
            "stock_code": stock_code,
            "data": price_data,
            "timestamp": datetime.now().isoformat()
        }
        
        for user_id in self.subscriptions[stock_code]:
            if user_id in self.active_connections:
                try:
                    await self.active_connections[user_id].send_json(message)
                except Exception as e:
                    logger.error(f"Failed to send to {user_id}: {e}")
                    self.disconnect(user_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_json()
            
            if data["action"] == "subscribe":
                manager.subscribe(user_id, data["stock_codes"])
            elif data["action"] == "unsubscribe":
                manager.unsubscribe(user_id, data["stock_codes"])
            
    except WebSocketDisconnect:
        manager.disconnect(user_id)

class RealtimeDataFetcher:
    """实时数据获取器（后台任务）"""
    def __init__(self, data_source: DataSourceAdapter, connection_manager: ConnectionManager):
        self.data_source = data_source
        self.connection_manager = connection_manager
    
    async def fetch_and_push(self):
        """定期获取实时数据并推送（每秒执行一次）"""
        while True:
            # 获取所有被订阅的股票代码
            subscribed_stocks = list(self.connection_manager.subscriptions.keys())
            
            if subscribed_stocks:
                # 批量获取实时行情
                quotes = self.data_source.fetch_realtime_quotes(subscribed_stocks)
                
                # 推送给订阅用户
                for _, row in quotes.iterrows():
                    await self.connection_manager.broadcast_price_update(
                        stock_code=row['code'],
                        price_data={
                            'price': row['price'],
                            'change': row['change'],
                            'change_pct': row['change_pct'],
                            'volume': row['volume'],
                            'amount': row['amount']
                        }
                    )
            
            await asyncio.sleep(1)  # 每秒更新一次
```

```typescript
// 前端 WebSocket 客户端
class RealtimeDataClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(private userId: string) {}
  
  connect() {
    const wsUrl = `ws://localhost:8000/ws/${this.userId}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      // 重新订阅之前的股票
      const stockCodes = Array.from(this.subscribers.keys());
      if (stockCodes.length > 0) {
        this.subscribe(stockCodes);
      }
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'price_update') {
        this.notifySubscribers(message.stock_code, message.data);
      }
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }
  
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnect attempts reached');
      // 降级到轮询模式
      this.fallbackToPolling();
    }
  }
  
  subscribe(stockCodes: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        stock_codes: stockCodes
      }));
    }
  }
  
  unsubscribe(stockCodes: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        stock_codes: stockCodes
      }));
    }
    
    // 清理本地订阅
    stockCodes.forEach(code => this.subscribers.delete(code));
  }
  
  onPriceUpdate(stockCode: string, callback: (data: any) => void) {
    if (!this.subscribers.has(stockCode)) {
      this.subscribers.set(stockCode, new Set());
      this.subscribe([stockCode]);
    }
    this.subscribers.get(stockCode)!.add(callback);
  }
  
  private notifySubscribers(stockCode: string, data: any) {
    const callbacks = this.subscribers.get(stockCode);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
  
  private fallbackToPolling() {
    // 降级到轮询模式
    console.log('Falling back to polling mode');
    setInterval(() => {
      const stockCodes = Array.from(this.subscribers.keys());
      if (stockCodes.length > 0) {
        fetch(`/api/v1/data/realtime?codes=${stockCodes.join(',')}`)
          .then(res => res.json())
          .then(data => {
            data.forEach((quote: any) => {
              this.notifySubscribers(quote.code, quote);
            });
          });
      }
    }, 3000);  // 每3秒轮询一次
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// 使用示例
const realtimeClient = new RealtimeDataClient('user123');
realtimeClient.connect();

// 订阅股票价格更新
realtimeClient.onPriceUpdate('000001', (data) => {
  console.log('Price updated:', data);
  updateStockDisplay('000001', data);
});
```

**性能优化**:
- 仅推送用户订阅的股票数据
- 批量获取实时行情，减少API调用
- 使用消息队列（Redis Pub/Sub）实现多实例部署
- 限制每个用户最多订阅50只股票

**降级策略**:
- WebSocket不可用时自动降级到HTTP轮询
- 轮询间隔：交易时段3秒，非交易时段30秒
- 市场闭市时停止推送，节省资源


### 8. Technical Indicator Engine (技术指标引擎)

**职责**: 计算和展示MACD、KDJ、RSI等技术指标

**核心组件**:

```python
import pandas as pd
import numpy as np

class TechnicalIndicatorEngine:
    """技术指标计算引擎"""
    
    @staticmethod
    def calculate_macd(prices: pd.Series, 
                       fast_period: int = 12, 
                       slow_period: int = 26, 
                       signal_period: int = 9) -> pd.DataFrame:
        """
        计算MACD指标
        
        Returns:
            DataFrame with columns: DIF, DEA, MACD
        """
        # 计算快速EMA和慢速EMA
        ema_fast = prices.ewm(span=fast_period, adjust=False).mean()
        ema_slow = prices.ewm(span=slow_period, adjust=False).mean()
        
        # DIF = 快线 - 慢线
        dif = ema_fast - ema_slow
        
        # DEA = DIF的9日EMA
        dea = dif.ewm(span=signal_period, adjust=False).mean()
        
        # MACD柱 = (DIF - DEA) * 2
        macd = (dif - dea) * 2
        
        return pd.DataFrame({
            'DIF': dif,
            'DEA': dea,
            'MACD': macd
        })
    
    @staticmethod
    def calculate_kdj(high: pd.Series, 
                      low: pd.Series, 
                      close: pd.Series,
                      n: int = 9,
                      m1: int = 3,
                      m2: int = 3) -> pd.DataFrame:
        """
        计算KDJ指标
        
        Returns:
            DataFrame with columns: K, D, J
        """
        # 计算RSV（未成熟随机值）
        lowest_low = low.rolling(window=n).min()
        highest_high = high.rolling(window=n).max()
        rsv = (close - lowest_low) / (highest_high - lowest_low) * 100
        
        # K值 = RSV的m1日移动平均
        k = rsv.ewm(com=m1-1, adjust=False).mean()
        
        # D值 = K值的m2日移动平均
        d = k.ewm(com=m2-1, adjust=False).mean()
        
        # J值 = 3K - 2D
        j = 3 * k - 2 * d
        
        return pd.DataFrame({
            'K': k,
            'D': d,
            'J': j
        })
    
    @staticmethod
    def calculate_rsi(prices: pd.Series, periods: List[int] = [6, 12, 24]) -> pd.DataFrame:
        """
        计算RSI指标
        
        Returns:
            DataFrame with columns: RSI_6, RSI_12, RSI_24
        """
        result = pd.DataFrame(index=prices.index)
        
        for period in periods:
            # 计算价格变化
            delta = prices.diff()
            
            # 分离上涨和下跌
            gain = delta.where(delta > 0, 0)
            loss = -delta.where(delta < 0, 0)
            
            # 计算平均涨幅和平均跌幅
            avg_gain = gain.rolling(window=period).mean()
            avg_loss = loss.rolling(window=period).mean()
            
            # 计算RS和RSI
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
            
            result[f'RSI_{period}'] = rsi
        
        return result
    
    @staticmethod
    def calculate_bollinger_bands(prices: pd.Series, 
                                   period: int = 20, 
                                   std_dev: float = 2.0) -> pd.DataFrame:
        """
        计算布林带
        
        Returns:
            DataFrame with columns: UPPER, MIDDLE, LOWER
        """
        middle = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        
        upper = middle + (std * std_dev)
        lower = middle - (std * std_dev)
        
        return pd.DataFrame({
            'UPPER': upper,
            'MIDDLE': middle,
            'LOWER': lower
        })
    
    @staticmethod
    def detect_signals(indicators: Dict[str, pd.DataFrame]) -> List[Signal]:
        """
        检测技术指标信号
        
        Args:
            indicators: 包含各种技术指标的字典
        
        Returns:
            信号列表
        """
        signals = []
        
        # MACD金叉/死叉
        if 'MACD' in indicators:
            macd_data = indicators['MACD']
            if len(macd_data) >= 2:
                # 金叉：DIF上穿DEA
                if macd_data['DIF'].iloc[-2] <= macd_data['DEA'].iloc[-2] and \
                   macd_data['DIF'].iloc[-1] > macd_data['DEA'].iloc[-1]:
                    signals.append(Signal(
                        type='buy',
                        indicator='MACD',
                        description='MACD金叉',
                        strength='medium'
                    ))
                # 死叉：DIF下穿DEA
                elif macd_data['DIF'].iloc[-2] >= macd_data['DEA'].iloc[-2] and \
                     macd_data['DIF'].iloc[-1] < macd_data['DEA'].iloc[-1]:
                    signals.append(Signal(
                        type='sell',
                        indicator='MACD',
                        description='MACD死叉',
                        strength='medium'
                    ))
        
        # KDJ金叉/死叉
        if 'KDJ' in indicators:
            kdj_data = indicators['KDJ']
            if len(kdj_data) >= 2:
                # 金叉：K上穿D，且在低位（<20）
                if kdj_data['K'].iloc[-2] <= kdj_data['D'].iloc[-2] and \
                   kdj_data['K'].iloc[-1] > kdj_data['D'].iloc[-1] and \
                   kdj_data['K'].iloc[-1] < 20:
                    signals.append(Signal(
                        type='buy',
                        indicator='KDJ',
                        description='KDJ低位金叉',
                        strength='strong'
                    ))
                # 死叉：K下穿D，且在高位（>80）
                elif kdj_data['K'].iloc[-2] >= kdj_data['D'].iloc[-2] and \
                     kdj_data['K'].iloc[-1] < kdj_data['D'].iloc[-1] and \
                     kdj_data['K'].iloc[-1] > 80:
                    signals.append(Signal(
                        type='sell',
                        indicator='KDJ',
                        description='KDJ高位死叉',
                        strength='strong'
                    ))
        
        # RSI超买/超卖
        if 'RSI' in indicators:
            rsi_data = indicators['RSI']
            rsi_6 = rsi_data['RSI_6'].iloc[-1]
            
            if rsi_6 < 20:
                signals.append(Signal(
                    type='buy',
                    indicator='RSI',
                    description='RSI超卖',
                    strength='medium'
                ))
            elif rsi_6 > 80:
                signals.append(Signal(
                    type='sell',
                    indicator='RSI',
                    description='RSI超买',
                    strength='medium'
                ))
        
        return signals

class Signal:
    """交易信号"""
    def __init__(self, type: str, indicator: str, description: str, strength: str):
        self.type = type  # 'buy' or 'sell'
        self.indicator = indicator  # 'MACD', 'KDJ', 'RSI', etc.
        self.description = description
        self.strength = strength  # 'weak', 'medium', 'strong'
        self.timestamp = datetime.now()
```

**前端图表集成**:

```typescript
// 使用 Lightweight Charts 库展示技术指标
import { createChart, IChartApi } from 'lightweight-charts';

interface TechnicalChartProps {
  stockCode: string;
  klineData: KlineData[];
  indicators: {
    macd?: MACDData[];
    kdj?: KDJData[];
    rsi?: RSIData[];
  };
}

const TechnicalChart: React.FC<TechnicalChartProps> = ({ 
  stockCode, 
  klineData, 
  indicators 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<IChartApi | null>(null);
  
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // 创建主图（K线）
    const newChart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: '#ffffff',
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
    });
    
    const candlestickSeries = newChart.addCandlestickSeries();
    candlestickSeries.setData(klineData);
    
    // 添加MACD副图
    if (indicators.macd) {
      const macdPane = newChart.addPane({ height: 100 });
      const difSeries = macdPane.addLineSeries({ color: '#2196F3' });
      const deaSeries = macdPane.addLineSeries({ color: '#FF9800' });
      const macdSeries = macdPane.addHistogramSeries({ color: '#4CAF50' });
      
      difSeries.setData(indicators.macd.map(d => ({ time: d.time, value: d.dif })));
      deaSeries.setData(indicators.macd.map(d => ({ time: d.time, value: d.dea })));
      macdSeries.setData(indicators.macd.map(d => ({ time: d.time, value: d.macd })));
    }
    
    setChart(newChart);
    
    return () => {
      newChart.remove();
    };
  }, [klineData, indicators]);
  
  return (
    <div>
      <div ref={chartContainerRef} />
      <IndicatorLegend indicators={indicators} />
    </div>
  );
};
```

**接口设计**:
- `GET /api/v1/indicators/macd?code=000001&period=daily` - 获取MACD指标
- `GET /api/v1/indicators/kdj?code=000001&period=daily` - 获取KDJ指标
- `GET /api/v1/indicators/rsi?code=000001&period=daily` - 获取RSI指标
- `GET /api/v1/indicators/signals?code=000001` - 获取技术信号


### 9. Sector Rotation Analyzer (板块轮动分析器)

**职责**: 识别热门板块和资金流向，推荐板块内的优质股票

**核心组件**:

```python
class SectorRotationAnalyzer:
    """板块轮动分析器"""
    
    def __init__(self, data_provider: DataProvider):
        self.data_provider = data_provider
    
    def analyze_sectors(self, date: str = None) -> List[SectorAnalysis]:
        """
        分析所有板块的表现
        
        Returns:
            按资金流入排序的板块分析列表
        """
        if date is None:
            date = datetime.now().strftime('%Y-%m-%d')
        
        sectors = self._get_all_sectors()
        sector_analyses = []
        
        for sector in sectors:
            # 获取板块内所有股票
            stocks = self._get_stocks_in_sector(sector)
            
            # 计算板块指标
            analysis = SectorAnalysis(
                sector_name=sector,
                stock_count=len(stocks),
                avg_change_pct=self._calculate_avg_change(stocks, date),
                total_capital_inflow=self._calculate_capital_inflow(stocks, date),
                total_volume=self._calculate_total_volume(stocks, date),
                leading_stocks=self._find_leading_stocks(stocks, date),
                trend=self._analyze_trend(stocks, date),
                hot_score=self._calculate_hot_score(stocks, date)
            )
            
            sector_analyses.append(analysis)
        
        # 按资金流入排序
        sector_analyses.sort(key=lambda x: x.total_capital_inflow, reverse=True)
        
        return sector_analyses
    
    def detect_rotation_signals(self, days: int = 3) -> List[RotationSignal]:
        """
        检测板块轮动信号
        
        Args:
            days: 连续天数阈值
        
        Returns:
            轮动信号列表
        """
        signals = []
        
        # 获取最近N天的板块数据
        historical_data = self._get_historical_sector_data(days)
        
        for sector, data in historical_data.items():
            # 检测连续资金流入
            if self._is_continuous_inflow(data, days):
                signals.append(RotationSignal(
                    sector_name=sector,
                    signal_type='inflow',
                    strength='strong',
                    description=f'连续{days}天资金净流入',
                    recommended_stocks=self._recommend_stocks(sector)
                ))
            
            # 检测资金流出
            elif self._is_continuous_outflow(data, days):
                signals.append(RotationSignal(
                    sector_name=sector,
                    signal_type='outflow',
                    strength='strong',
                    description=f'连续{days}天资金净流出',
                    recommended_stocks=[]
                ))
        
        return signals
    
    def _calculate_hot_score(self, stocks: List[str], date: str) -> float:
        """
        计算板块热度评分（0-100）
        
        综合考虑：
        1. 资金流入强度（40%）
        2. 涨幅（30%）
        3. 成交量放大（20%）
        4. 上涨股票占比（10%）
        """
        capital_score = self._normalize_capital_inflow(stocks, date) * 40
        change_score = self._normalize_change_pct(stocks, date) * 30
        volume_score = self._normalize_volume_ratio(stocks, date) * 20
        rising_ratio_score = self._calculate_rising_ratio(stocks, date) * 10
        
        return capital_score + change_score + volume_score + rising_ratio_score
    
    def _find_leading_stocks(self, stocks: List[str], date: str, top_n: int = 5) -> List[LeadingStock]:
        """
        找出板块龙头股
        
        龙头股标准：
        1. 涨幅居前
        2. 成交量放大
        3. 资金净流入
        4. 市值较大
        """
        stock_scores = []
        
        for stock_code in stocks:
            data = self.data_provider.get_stock_data(stock_code, date)
            
            score = (
                data['change_pct'] * 0.3 +
                data['volume_ratio'] * 0.2 +
                data['capital_inflow'] / 1e8 * 0.3 +
                np.log10(data['market_cap'] / 1e8) * 0.2
            )
            
            stock_scores.append((stock_code, score, data))
        
        # 按评分排序
        stock_scores.sort(key=lambda x: x[1], reverse=True)
        
        # 返回前N只
        return [
            LeadingStock(
                stock_code=code,
                stock_name=data['name'],
                change_pct=data['change_pct'],
                capital_inflow=data['capital_inflow'],
                volume_ratio=data['volume_ratio'],
                score=score
            )
            for code, score, data in stock_scores[:top_n]
        ]
    
    def recommend_stocks_by_strategy(self, sector: str, strategy: Strategy) -> List[str]:
        """
        在指定板块中推荐符合策略的股票
        
        Args:
            sector: 板块名称
            strategy: 波段交易策略
        
        Returns:
            推荐股票代码列表
        """
        stocks = self._get_stocks_in_sector(sector)
        screener = StockScreener(strategy)
        results = screener.screen(stocks)
        
        # 按综合评分排序
        results.sort(key=lambda x: x.score, reverse=True)
        
        return [r.stock_code for r in results]

class SectorAnalysis:
    """板块分析结果"""
    sector_name: str
    stock_count: int
    avg_change_pct: float  # 平均涨跌幅
    total_capital_inflow: float  # 总资金流入
    total_volume: int  # 总成交量
    leading_stocks: List[LeadingStock]  # 龙头股
    trend: str  # 'up', 'down', 'sideways'
    hot_score: float  # 热度评分（0-100）

class RotationSignal:
    """板块轮动信号"""
    sector_name: str
    signal_type: str  # 'inflow', 'outflow'
    strength: str  # 'weak', 'medium', 'strong'
    description: str
    recommended_stocks: List[str]
    timestamp: datetime

class LeadingStock:
    """龙头股"""
    stock_code: str
    stock_name: str
    change_pct: float
    capital_inflow: float
    volume_ratio: float
    score: float
```

**前端展示设计**:

```typescript
interface SectorRotationProps {
  sectors: SectorAnalysis[];
  rotationSignals: RotationSignal[];
}

const SectorRotationPanel: React.FC<SectorRotationProps> = ({ 
  sectors, 
  rotationSignals 
}) => {
  return (
    <div className="sector-rotation-panel">
      {/* 板块热度排行 */}
      <Card title="板块热度排行">
        <Table
          dataSource={sectors}
          columns={[
            { title: '板块', dataIndex: 'sector_name' },
            { title: '涨跌幅', dataIndex: 'avg_change_pct', render: (v) => `${v.toFixed(2)}%` },
            { title: '资金流入', dataIndex: 'total_capital_inflow', render: (v) => `${(v/1e8).toFixed(2)}亿` },
            { title: '热度', dataIndex: 'hot_score', render: (v) => <Progress percent={v} /> },
            { 
              title: '操作', 
              render: (_, record) => (
                <Button onClick={() => viewSectorDetail(record.sector_name)}>
                  查看详情
                </Button>
              )
            }
          ]}
        />
      </Card>
      
      {/* 轮动信号 */}
      <Card title="板块轮动信号">
        {rotationSignals.map(signal => (
          <Alert
            key={signal.sector_name}
            type={signal.signal_type === 'inflow' ? 'success' : 'warning'}
            message={`${signal.sector_name} - ${signal.description}`}
            description={
              signal.recommended_stocks.length > 0 && (
                <div>
                  推荐股票：{signal.recommended_stocks.join(', ')}
                </div>
              )
            }
          />
        ))}
      </Card>
      
      {/* 资金流向图表 */}
      <Card title="板块资金流向趋势">
        <SectorCapitalFlowChart sectors={sectors} />
      </Card>
    </div>
  );
};
```

**接口设计**:
- `GET /api/v1/sectors/analysis` - 获取所有板块分析
- `GET /api/v1/sectors/{sector_name}/detail` - 获取板块详情
- `GET /api/v1/sectors/rotation-signals` - 获取轮动信号
- `GET /api/v1/sectors/{sector_name}/recommend?strategy=swing` - 获取板块内推荐股票

