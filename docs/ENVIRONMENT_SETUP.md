# 环境变量配置指南

## 快速开始

1. **复制配置文件**
   ```bash
   cp .env.example .env
   ```

2. **编辑 .env 文件**，填入你的配置

3. **启动服务**
   ```bash
   # 后端会自动读取 .env 文件
   cd backend
   python -m uvicorn main:app --reload
   ```

## 必需配置

### AI 服务

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `GLM_API_KEY` | 智谱AI API Key（推荐） | `your_glm_api_key_here` |
| `ZHIPUAI_API_KEY` | 备选变量名（向后兼容） | `your_zhipuai_api_key_here` |

**获取 API Key**: https://open.bigmodel.cn/

## 可选配置

### CORS 跨域

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | 允许的前端地址，逗号分隔 |

### 服务器

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `8000` | 服务器端口 |
| `HOST` | `0.0.0.0` | 服务器主机 |

### 缓存

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `CACHE_TTL_STOCK` | `60` | 股票数据缓存时间（秒） |
| `CACHE_TTL_MARKET` | `300` | 市场环境数据缓存时间（秒） |

### 日志

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `LOG_LEVEL` | `INFO` | 日志级别：DEBUG/INFO/WARNING/ERROR |
| `LOG_FILE` | `logs/app.log` | 日志文件路径 |

## 生产环境配置示例

```bash
# AI 服务（必填）
GLM_API_KEY=your_production_api_key_here

# CORS（限制为生产域名）
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com

# 服务器
PORT=8000
HOST=0.0.0.0

# 缓存（生产环境可适当延长）
CACHE_TTL_STOCK=120
CACHE_TTL_MARKET=600

# 日志
LOG_LEVEL=WARNING
LOG_FILE=/var/log/stock-screener/app.log
```

## 开发环境配置示例

```bash
# AI 服务
GLM_API_KEY=your_development_api_key_here

# CORS（允许本地开发服务器）
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# 服务器
PORT=8000
HOST=127.0.0.1

# 缓存（开发环境可以更短）
CACHE_TTL_STOCK=30
CACHE_TTL_MARKET=60

# 日志
LOG_LEVEL=DEBUG
```

## 安全注意事项

1. **永远不要提交 .env 文件到 Git**
   - 已添加到 .gitignore
   - 使用 .env.example 作为模板

2. **API Key 管理**
   - 生产环境和开发环境使用不同的 Key
   - 定期轮换 API Key
   - 不要将 Key 分享给他人

3. **CORS 配置**
   - 生产环境只配置实际使用的域名
   - 不要在生产环境使用 `*`

## 故障排查

### AI 功能不工作

```bash
# 检查环境变量是否加载
cd backend
python -c "import os; print('GLM_API_KEY:', '已设置' if os.getenv('GLM_API_KEY') else '未设置')"
```

### CORS 错误

```bash
# 检查允许的源
cd backend
python -c "import os; print('ALLOWED_ORIGINS:', os.getenv('ALLOWED_ORIGINS', '使用默认值'))"
```

### 加载失败

确保已安装 python-dotenv：
```bash
pip install python-dotenv
```

## 相关文件

- `.env` - 你的本地配置（不提交到 git）
- `.env.example` - 配置模板（提交到 git）
- `.gitignore` - 确保 .env 不被提交
- `backend/main.py` - 读取环境变量的代码
