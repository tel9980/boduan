# A股波段交易筛选系统 v4.15.4

> 🎯 专为波段交易设计的智能选股系统，支持AI分析，一键筛选优质股票

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-4.15.4-red.svg)](https://github.com/tel9980/boduan)

---

## ✨ 核心功能

- 🔍 **智能筛选**：自动筛选4900+只A股，找出符合波段交易条件的股票
- 🤖 **AI分析**：集成GLM-4-Flash，提供智能分析和投资建议
- 📊 **多策略**：支持激进型、保守型、平衡型三种策略
- 💎 **融资融券**：重点关注融资融券标的，资金流向分析
- 📈 **K线图表**：直观展示股票走势，支持技术分析
- 🎯 **买卖点**：智能计算买入价、止损价、目标价
- ⚡ **极速响应**：智能缓存，30分钟内秒开（<1秒）

---

## 🚀 快速开始

### 方式1：一键安装（推荐小白用户）

1. **下载代码**
   ```bash
   git clone https://github.com/tel9980/boduan.git
   cd boduan
   ```
   或直接下载 ZIP：https://github.com/tel9980/boduan/archive/refs/heads/main.zip

2. **一键安装**
   ```bash
   双击运行：一键安装.bat
   ```

3. **启动系统**
   ```bash
   双击运行：启动系统_极速版.bat
   ```

4. **打开浏览器**
   ```
   访问：http://localhost:5173
   ```

### 方式2：手动安装（适合有经验的用户）

#### 安装依赖

```bash
# 1. 创建虚拟环境
python -m venv .venv

# 2. 激活虚拟环境
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# 3. 安装后端依赖
pip install -r backend/requirements.txt

# 4. 安装前端依赖
cd frontend
npm install
cd ..
```

#### 配置环境变量

```bash
# 复制环境变量模板
copy .env.example .env  # Windows
cp .env.example .env  # Linux/Mac

# 编辑 .env 文件，配置 GLM API 密钥（可选）
GLM_API_KEY=your_api_key_here
```

#### 启动服务

```bash
# 启动后端
python backend/main.py

# 启动前端（新窗口）
cd frontend
npm run dev
```

---

## 📖 使用指南

### 小白用户
- [小白部署指南.md](小白部署指南.md) - 零基础部署指南，手把手教学

### 进阶用户
- [v4.15.4_快速使用指南.md](v4.15.4_快速使用指南.md) - 详细使用指南
- [v4.15.4_极速优化完成.md](v4.15.4_极速优化完成.md) - 技术优化报告

---

## 🎯 筛选策略

### 激进型
- **适合人群**：风险承受能力强，追求高收益
- **筛选条件**：涨幅3%-7%，量比2-5
- **特点**：优先选择涨幅大、量比大的股票

### 保守型
- **适合人群**：风险承受能力弱，追求稳健
- **筛选条件**：涨幅-2%-1%，量比1.5-2.5
- **特点**：优先选择回调、融资融券好的股票

### 平衡型
- **适合人群**：大多数用户，平衡收益与风险
- **筛选条件**：涨幅0%-4%，量比1.8-3
- **特点**：按综合评分排序

---

## 📊 性能指标

| 指标 | v4.15.2 | v4.15.4 | 提升 |
|------|---------|---------|------|
| 数据获取 | 41.7秒 | 27秒 | 35% |
| 详细分析 | 162只 | 50只 | 69% |
| 总耗时 | 5-6分钟 | 2.5-3.5分钟 | 40% |
| 缓存响应 | <1秒 | <1秒 | - |
| **用户体验（使用极速版）** | **3-4分钟** | **<1秒** | **200倍+** |

---

## 🛠️ 技术栈

### 后端
- **框架**：FastAPI
- **数据源**：AKShare + 腾讯API
- **AI服务**：GLM-4-Flash
- **缓存**：文件缓存（JSON）
- **并发**：ThreadPoolExecutor（30 workers）

### 前端
- **框架**：React 18
- **语言**：TypeScript
- **UI库**：自定义组件
- **图表**：ECharts
- **状态管理**：React Hooks

---

## 📁 项目结构

```
boduan/
├── backend/                 # 后端代码
│   ├── main.py             # 主程序
│   ├── glm_service.py      # AI服务
│   ├── auto_preheat.py     # 自动预热
│   └── requirements.txt    # 依赖列表
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # 组件
│   │   ├── api/           # API接口
│   │   └── App.tsx        # 主应用
│   └── package.json       # 依赖列表
├── 一键安装.bat            # 一键安装脚本
├── 启动系统.bat            # 普通启动脚本
├── 启动系统_极速版.bat     # 极速启动脚本
├── 小白部署指南.md         # 小白部署指南
└── README.md              # 本文件
```

---

## ❓ 常见问题

### Q1: 如何获取 GLM API 密钥？
**A**: 
1. 访问：https://open.bigmodel.cn/
2. 注册并登录
3. 点击右上角头像 → "API密钥"
4. 创建新密钥并复制

### Q2: 为什么筛选速度慢？
**A**: 
- 首次筛选需要2-3分钟（实时数据）
- 使用"启动系统_极速版.bat"可以预热缓存
- 预热后任何时候点击都能秒开

### Q3: 如何调整筛选条件？
**A**: 
- 编辑 `backend/main.py`
- 修改 `BAND_TRADING_CONFIG` 配置
- 重启后端服务

### Q4: 支持哪些操作系统？
**A**: 
- Windows 10/11（推荐）
- Linux（需要修改启动脚本）
- macOS（需要修改启动脚本）

### Q5: 数据来源是什么？
**A**: 
- 主要：AKShare（免费开源）
- 备用：腾讯API
- 融资融券：模拟数据（可接入真实API）

---

## 🔄 更新日志

### v4.15.4 (2026-02-08)
- ✅ 性能优化：数据获取并发30，详细分析50只
- ✅ AI并发控制：严格限制GLM-4-Flash并发为1
- ✅ 自动预热缓存：每30分钟自动刷新
- ✅ 用户体验：使用极速版启动后响应<1秒
- ✅ 小白友好：新增一键安装脚本和小白部署指南

### v4.15.3 (2026-02-07)
- ✅ 性能优化：首次筛选速度提升40%
- ✅ 智能缓存：5分钟有效期
- ✅ 并发优化：数据获取并发20

### v4.15.2 (2026-02-06)
- ✅ 智能缓存：自动缓存筛选结果
- ✅ 前端优化：修复显示问题

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## ⚠️ 免责声明

- 本系统仅供学习和参考使用
- 不构成任何投资建议
- 投资有风险，入市需谨慎
- 请根据自己的风险承受能力做决策
- 使用本系统产生的任何损失，开发者不承担责任

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

- GitHub: https://github.com/tel9980/boduan
- Issues: https://github.com/tel9980/boduan/issues

---

**版本**: v4.15.4  
**更新时间**: 2026-02-08  
**开发者**: tel9980  
**Star**: 如果觉得有用，请给个 ⭐️
