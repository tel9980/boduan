# Requirements Document

## Introduction

本文档定义了A股波段交易筛选系统（当前版本v4.5.0）的系统优化路线图需求。系统基于Python FastAPI后端和React TypeScript前端，已实现波段交易策略筛选、行业分散、K线图表、智能买卖点建议等核心功能。本优化路线图旨在通过真实数据接入、性能优化、智能提醒、回测系统等10个方向的增强，显著提升系统的实用性、准确性和用户体验。

## Glossary

- **System**: A股波段交易筛选系统
- **Real_Data_Module**: 真实数据接入模块，负责从外部API获取融资融券、资金流向、K线等真实市场数据
- **Performance_Optimizer**: 性能优化模块，负责缓存策略、增量更新、数据库存储等性能提升功能
- **Alert_System**: 智能提醒系统，负责价格提醒、买卖点提醒、异动提醒等通知功能
- **Backtesting_Engine**: 回测引擎，负责验证策略有效性和计算历史收益率
- **AI_Analyzer**: AI增强分析模块，负责接入大语言模型进行基本面分析和智能问答
- **Mobile_Optimizer**: 移动端优化模块，负责响应式设计和PWA支持
- **Realtime_Pusher**: 实时数据推送模块，负责通过WebSocket推送实时价格更新
- **Technical_Indicator_Engine**: 技术指标引擎，负责计算和展示MACD、KDJ、RSI等技术指标
- **Sector_Rotation_Analyzer**: 板块轮动分析器，负责识别热门板块和资金流向
- **Risk_Manager**: 风险管理工具，负责仓位管理、止盈止损自动计算
- **User**: 使用系统进行A股波段交易筛选的投资者
- **Stock**: 股票标的，包括主板和创业板融资融券标的
- **Strategy**: 波段交易策略，包括筛选条件和买卖点判断逻辑
- **Market_Data**: 市场数据，包括价格、成交量、融资融券数据、资金流向等

## Requirements

### Requirement 1: 真实数据接入

**User Story:** 作为投资者，我希望系统使用真实的市场数据而非模拟数据，以便我能基于准确的信息做出交易决策。

#### Acceptance Criteria

1. WHEN Real_Data_Module 请求融资融券数据 THEN THE System SHALL 从外部API获取真实的融资融券余额、融资买入额、融券卖出量数据
2. WHEN Real_Data_Module 请求资金流向数据 THEN THE System SHALL 从外部API获取真实的主力资金净流入、大单净流入、散户资金流向数据
3. WHEN Real_Data_Module 请求K线数据 THEN THE System SHALL 从外部API获取真实的开盘价、收盘价、最高价、最低价、成交量数据
4. IF 外部API请求失败 THEN THE System SHALL 记录错误日志并返回明确的错误信息给用户
5. WHEN 真实数据更新 THEN THE System SHALL 在5秒内完成数据刷新并更新前端展示
6. THE System SHALL 支持至少两个数据源（如Tushare、东方财富API）以提供数据冗余

### Requirement 2: 性能优化

**User Story:** 作为投资者，我希望系统能快速完成股票筛选，以便我能及时捕捉交易机会。

#### Acceptance Criteria

1. WHEN User 触发全市场筛选 THEN THE Performance_Optimizer SHALL 在10秒内完成4909只股票的筛选（相比当前23-25秒提升60%）
2. WHEN 市场数据未发生变化 THEN THE Performance_Optimizer SHALL 使用缓存数据而非重新计算
3. WHEN 部分股票数据更新 THEN THE Performance_Optimizer SHALL 仅更新变化的股票数据而非全量刷新
4. THE Performance_Optimizer SHALL 将历史数据存储在数据库中以减少API调用次数
5. WHEN 数据库查询执行 THEN THE Performance_Optimizer SHALL 使用索引优化查询性能
6. THE System SHALL 在后台预加载常用筛选条件的结果以提升响应速度

### Requirement 3: 智能提醒系统

**User Story:** 作为投资者，我希望系统能在关键时刻主动提醒我，以便我不会错过重要的交易机会。

#### Acceptance Criteria

1. WHEN Stock 价格达到用户设定的目标价格 THEN THE Alert_System SHALL 发送价格提醒通知
2. WHEN Stock 出现买入信号（如突破压力位、MACD金叉） THEN THE Alert_System SHALL 发送买点提醒通知
3. WHEN Stock 出现卖出信号（如跌破支撑位、MACD死叉） THEN THE Alert_System SHALL 发送卖点提醒通知
4. WHEN Stock 出现异动（如涨跌幅超过5%、成交量放大3倍） THEN THE Alert_System SHALL 发送异动提醒通知
5. THE Alert_System SHALL 支持多种通知渠道（浏览器通知、邮件、微信）
6. WHEN User 设置提醒条件 THEN THE System SHALL 验证条件的有效性并持久化存储
7. THE Alert_System SHALL 在触发提醒后避免重复通知同一事件

### Requirement 4: 回测系统

**User Story:** 作为投资者，我希望能验证策略的历史表现，以便我能评估策略的有效性和风险。

#### Acceptance Criteria

1. WHEN User 选择策略和回测时间段 THEN THE Backtesting_Engine SHALL 计算该策略在历史数据上的收益率
2. WHEN Backtesting_Engine 执行回测 THEN THE System SHALL 计算最大回撤、夏普比率、胜率等关键指标
3. WHEN 回测完成 THEN THE System SHALL 展示每笔交易的买入点、卖出点、持仓时间、收益率
4. THE Backtesting_Engine SHALL 考虑交易成本（佣金、印花税、滑点）以提供真实的收益估算
5. WHEN User 调整策略参数 THEN THE System SHALL 支持参数优化功能以找到最佳参数组合
6. THE System SHALL 提供回测结果的可视化图表（收益曲线、回撤曲线、交易分布）

### Requirement 5: AI增强分析

**User Story:** 作为投资者，我希望获得AI驱动的深度分析，以便我能更全面地理解股票的投资价值。

#### Acceptance Criteria

1. WHEN User 请求股票分析 THEN THE AI_Analyzer SHALL 调用大语言模型生成基本面分析报告
2. WHEN AI_Analyzer 生成分析报告 THEN THE System SHALL 包含公司业务、财务状况、行业地位、竞争优势等维度
3. WHEN User 提出问题 THEN THE AI_Analyzer SHALL 基于股票数据和市场信息提供智能问答
4. THE AI_Analyzer SHALL 在30秒内完成分析报告生成
5. IF AI服务不可用 THEN THE System SHALL 降级到传统分析方法并通知用户
6. THE System SHALL 缓存AI分析结果以减少重复调用成本

### Requirement 6: 移动端优化

**User Story:** 作为投资者，我希望能在手机上流畅使用系统，以便我能随时随地进行交易决策。

#### Acceptance Criteria

1. WHEN User 在移动设备访问系统 THEN THE Mobile_Optimizer SHALL 自动适配屏幕尺寸并优化布局
2. THE Mobile_Optimizer SHALL 支持触摸手势操作（滑动、缩放、长按）
3. WHEN User 安装PWA应用 THEN THE System SHALL 支持离线访问基本功能
4. THE Mobile_Optimizer SHALL 优化移动端的加载速度（首屏加载时间小于3秒）
5. WHEN 移动端网络较慢 THEN THE System SHALL 优先加载关键数据并延迟加载次要内容
6. THE System SHALL 在移动端提供简化的操作界面以提升易用性

### Requirement 7: 实时数据推送

**User Story:** 作为投资者，我希望看到实时更新的股票价格，以便我能及时响应市场变化。

#### Acceptance Criteria

1. WHEN 市场开盘 THEN THE Realtime_Pusher SHALL 通过WebSocket连接推送实时价格更新
2. WHEN Stock 价格变化 THEN THE System SHALL 在1秒内更新前端展示
3. IF WebSocket连接断开 THEN THE Realtime_Pusher SHALL 自动重连并恢复数据推送
4. THE Realtime_Pusher SHALL 仅推送用户关注的股票数据以减少带宽消耗
5. WHEN 市场闭市 THEN THE Realtime_Pusher SHALL 停止推送并通知用户
6. THE System SHALL 在WebSocket不可用时降级到轮询方式获取数据

### Requirement 8: 技术指标扩展

**User Story:** 作为投资者，我希望看到更多技术指标，以便我能从多个维度分析股票走势。

#### Acceptance Criteria

1. WHEN User 查看股票详情 THEN THE Technical_Indicator_Engine SHALL 计算并展示MACD指标（DIF、DEA、MACD柱）
2. WHEN User 查看股票详情 THEN THE Technical_Indicator_Engine SHALL 计算并展示KDJ指标（K值、D值、J值）
3. WHEN User 查看股票详情 THEN THE Technical_Indicator_Engine SHALL 计算并展示RSI指标（6日、12日、24日）
4. THE Technical_Indicator_Engine SHALL 在K线图上叠加显示技术指标
5. WHEN 技术指标出现金叉或死叉 THEN THE System SHALL 在图表上标注信号点
6. THE System SHALL 允许用户自定义技术指标参数（如MACD的快线、慢线周期）

### Requirement 9: 板块轮动分析

**User Story:** 作为投资者，我希望了解市场热点板块，以便我能跟随资金流向进行投资。

#### Acceptance Criteria

1. WHEN User 访问板块分析页面 THEN THE Sector_Rotation_Analyzer SHALL 展示所有行业板块的涨跌幅排名
2. WHEN Sector_Rotation_Analyzer 分析板块 THEN THE System SHALL 计算每个板块的资金净流入和成交量变化
3. THE Sector_Rotation_Analyzer SHALL 识别连续3天资金净流入的热门板块
4. WHEN 板块出现轮动信号 THEN THE System SHALL 推荐该板块中符合波段交易策略的股票
5. THE System SHALL 提供板块资金流向的历史趋势图表
6. WHEN User 点击板块 THEN THE System SHALL 展示该板块的龙头股票和资金流向明细

### Requirement 10: 风险管理工具

**User Story:** 作为投资者，我希望系统能帮我管理风险，以便我能控制损失并保护收益。

#### Acceptance Criteria

1. WHEN User 输入账户总资金和风险偏好 THEN THE Risk_Manager SHALL 计算每只股票的建议仓位
2. WHEN User 选择股票 THEN THE Risk_Manager SHALL 基于ATR（平均真实波幅）自动计算止损价格
3. WHEN User 持有股票 THEN THE Risk_Manager SHALL 基于盈利情况自动计算止盈价格
4. THE Risk_Manager SHALL 提供仓位分配建议以实现行业分散和风险平衡
5. WHEN 股票价格触及止损位 THEN THE System SHALL 发送风险提醒通知
6. THE System SHALL 展示投资组合的整体风险指标（如VaR、最大回撤预期）

### Requirement 11: 优先级和可行性评估

**User Story:** 作为系统架构师，我需要评估各优化方向的优先级和可行性，以便制定合理的实施路线图。

#### Acceptance Criteria

1. THE System SHALL 为每个优化方向分配优先级等级（高、中、低）
2. THE System SHALL 为每个优化方向评估技术可行性（容易、中等、困难）
3. THE System SHALL 为每个优化方向评估实现难度（1-5分，5分最难）
4. THE System SHALL 为每个优化方向评估用户体验提升程度（1-5分，5分提升最大）
5. THE System SHALL 基于优先级、可行性、难度、用户体验提升计算综合评分
6. THE System SHALL 提供分阶段实施建议（第一阶段、第二阶段、第三阶段）
