# 后端架构重构指南

## 已完成的工作

### 1. 目录结构创建
```
backend/
├── api/                # API路由层（待实现）
├── services/           # 业务逻辑层（待实现）
├── models/             # 数据模型（待实现）
├── utils/              # 工具函数（待实现）
├── core/               # 核心配置 ✅
│   ├── __init__.py
│   ├── config.py      # 配置管理
│   └── cache.py       # 缓存管理
├── app_factory.py      # 应用工厂 ✅
├── main.py            # 现有主文件（保留兼容）
└── ...
```

### 2. 核心模块已实现
- **core/config.py**: 集中管理所有配置项
- **core/cache.py**: 统一的缓存管理
- **app_factory.py**: FastAPI应用工厂，支持生命周期管理

## 建议的重构步骤

### 阶段1：工具函数拆分（低风险）
将main.py中的纯工具函数迁移到utils/目录：

```python
# utils/stock_utils.py
- generate_stock_codes()      # 生成股票代码列表
- parse_qq_stock_line()       # 解析腾讯股票数据
- get_industry()              # 获取行业分类
- get_board_type()            # 判断板块类型

# utils/data_utils.py
- fetch_qq_stock_data()       # 获取腾讯股票数据
- format_stock_code()         # 格式化股票代码
```

### 阶段2：服务层拆分（中风险）
将业务逻辑迁移到services/目录：

```python
# services/stock_service.py
- get_all_stocks_data()       # 获取所有股票数据
- get_stock_detail()          # 获取单只股票详情
- get_realtime_quote()        # 获取实时行情

# services/screening_service.py
- band_trading_screen()       # 波段交易筛选（核心逻辑）
- calculate_stock_score()     # 计算股票评分
- filter_stocks()             # 股票过滤逻辑

# services/analysis_service.py
- analyze_market_environment() # 市场环境分析
- calculate_trade_points()    # 计算买卖点
- generate_kline_data()       # 生成K线数据
```

### 阶段3：API路由拆分（中风险）
将API端点迁移到api/目录：

```python
# api/stocks.py
- GET /api/realtime           # 获取实时行情
- GET /api/hot                # 获取热门股票
- GET /api/stock/{code}       # 获取股票详情

# api/screening.py
- GET /api/screen             # 通用筛选
- GET /api/band-trading/screen # 波段交易筛选
- POST /api/batch-screen      # 批量筛选

# api/analysis.py
- GET /api/market-environment # 市场环境分析
- GET /api/cache/clear        # 清除缓存
```

### 阶段4：数据模型定义（低风险）
创建Pydantic模型：

```python
# models/stock.py
class Stock(BaseModel):
    code: str
    name: str
    price: float
    change_percent: float
    ...

class ScreeningResult(BaseModel):
    success: bool
    count: int
    data: List[Stock]
    ...
```

## 重构建议

### 1. 保持向后兼容
- 先保留main.py的现有功能
- 逐步迁移和测试
- 不要一次性修改太多

### 2. 渐进式重构
- 每次只迁移一个功能模块
- 迁移后立即测试
- 确认无误后再继续

### 3. 使用新模块的方式

```python
# 在main.py中逐步替换

# 替换前
from main import get_all_stocks_data

# 替换后
from services.stock_service import get_all_stocks_data
```

## 已创建的文件使用说明

### 使用新的配置系统
```python
from core import config, band_trading_config

# 读取配置
api_key = config.GLM_API_KEY
ttl = config.CACHE_TTL_STOCK
max_positions = band_trading_config.MAX_POSITIONS
```

### 使用新的缓存系统
```python
from core import cache_manager

# 设置缓存
cache_manager.stock_data.set(data)

# 获取缓存
data = cache_manager.stock_data.get()

# 清除所有缓存
cache_manager.clear_all()
```

### 使用应用工厂
```python
from app_factory import create_app

app = create_app()

# 在路由处理器中获取线程池
@app.get("/api/test")
async def test():
    executor = app.state.executor
    # 使用executor...
```

## 风险提示

1. **不要直接修改现有main.py的业务逻辑**
   - 风险太高
   - 可能导致功能损坏
   
2. **建议顺序**
   - 先创建新模块
   - 测试新模块
   - 逐步替换import
   - 最后删除旧代码

3. **保持测试**
   - 每次修改后运行测试
   - 确保API响应格式不变
   - 检查前端是否正常工作

## 下一步建议

1. **先实现utils/stock_utils.py**
   - 这些函数相对独立
   - 容易提取和测试
   
2. **然后实现services/stock_service.py**
   - 依赖utils
   - 可以独立测试
   
3. **最后拆分API路由**
   - 使用FastAPI的APIRouter
   - 在main.py中注册路由

需要我帮你实现其中任何一个模块吗？
