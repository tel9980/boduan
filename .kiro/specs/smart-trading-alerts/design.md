# Design Document: Smart Trading Alerts

## Overview

本设计文档为A股波段交易筛选系统（v4.11.0）的智能提醒功能定义技术实现方案。基于已完成的需求文档，本设计采用纯前端实现方案，使用浏览器原生API和localStorage，确保零成本、小白友好的用户体验。

**设计原则：**
1. **零成本** - 使用免费数据源和浏览器原生功能
2. **简单实用** - 功能直观，操作简单
3. **小白友好** - 通俗易懂的语言和界面
4. **渐进增强** - 分阶段实施，优先核心功能

## Architecture

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  UI Components                                           │
│  ├── AlertCenter (提醒中心)                              │
│  ├── PortfolioTracker (持仓追踪)                         │
│  ├── WatchListPanel (自选股面板)                         │
│  ├── TechnicalIndicators (技术指标)                      │
│  └── NotificationSettings (提醒设置)                     │
├─────────────────────────────────────────────────────────┤
│  Business Logic                                          │
│  ├── AlertManager (提醒管理器)                           │
│  ├── PortfolioManager (持仓管理器)                       │
│  ├── WatchListManager (自选股管理器)                     │
│  ├── IndicatorCalculator (指标计算器)                    │
│  └── NotificationService (通知服务)                      │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                              │
│  ├── localStorage (本地存储)                             │
│  └── Existing Features Integration (已有功能集成)        │
└─────────────────────────────────────────────────────────┘
```

### 数据流

```
用户操作 → UI组件 → 业务逻辑 → localStorage
                              ↓
                    定时检查 → 触发条件 → 浏览器通知
```

## Components and Interfaces

### 1. Alert Manager (提醒管理器)

**职责**: 管理所有类型的提醒规则，定时检查触发条件


**核心接口**:

```typescript
// 提醒规则接口
interface AlertRule {
  id: string;
  type: 'price' | 'stop_loss' | 'take_profit' | 'abnormal' | 'signal';
  stockCode: string;
  stockName: string;
  conditions: {
    targetPrice?: number;
    direction?: 'up' | 'down';
    changePercent?: number;
    volumeRatio?: number;
  };
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
  lastTriggeredAt?: string;
  notificationChannels: ('browser' | 'sound' | 'internal')[];
}

// 提醒管理器
class AlertManager {
  private rules: AlertRule[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  
  // 添加提醒规则
  addRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): string;
  
  // 删除提醒规则
  removeRule(ruleId: string): void;
  
  // 更新提醒规则
  updateRule(ruleId: string, updates: Partial<AlertRule>): void;
  
  // 获取所有规则
  getRules(filter?: { type?: string; isActive?: boolean }): AlertRule[];
  
  // 启动监控
  startMonitoring(): void;
  
  // 停止监控
  stopMonitoring(): void;
  
  // 检查规则（每分钟执行）
  private checkRules(): Promise<void>;
  
  // 触发提醒
  private triggerAlert(rule: AlertRule, data: any): void;
}
```

**实现细节**:

```typescript
// localStorage 存储键
const ALERT_RULES_KEY = 'ALERT_RULES';

export class AlertManager {
  constructor(
    private notificationService: NotificationService,
    private dataService: DataService
  ) {
    this.loadRules();
  }
  
  private loadRules(): void {
    const stored = localStorage.getItem(ALERT_RULES_KEY);
    this.rules = stored ? JSON.parse(stored) : [];
  }
  
  private saveRules(): void {
    localStorage.setItem(ALERT_RULES_KEY, JSON.stringify(this.rules));
  }
  
  addRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): string {
    const newRule: AlertRule = {
      ...rule,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    this.rules.push(newRule);
    this.saveRules();
    
    return newRule.id;
  }

  
  startMonitoring(): void {
    if (this.checkInterval) return;
    
    // 立即检查一次
    this.checkRules();
    
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkRules();
    }, 60000);
  }
  
  private async checkRules(): Promise<void> {
    const activeRules = this.rules.filter(r => r.isActive);
    
    for (const rule of activeRules) {
      // 检查是否过期
      if (new Date(rule.expiresAt) < new Date()) {
        rule.isActive = false;
        continue;
      }
      
      // 检查是否在冷却期（24小时内已触发）
      if (rule.lastTriggeredAt) {
        const lastTriggered = new Date(rule.lastTriggeredAt);
        const now = new Date();
        const hoursSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastTrigger < 24) continue;
      }
      
      // 获取当前数据
      const currentData = await this.dataService.getStockData(rule.stockCode);
      
      // 检查触发条件
      if (this.evaluateCondition(rule, currentData)) {
        this.triggerAlert(rule, currentData);
        rule.lastTriggeredAt = new Date().toISOString();
      }
    }
    
    this.saveRules();
  }
  
  private evaluateCondition(rule: AlertRule, data: any): boolean {
    switch (rule.type) {
      case 'price':
        if (rule.conditions.direction === 'up') {
          return data.price >= rule.conditions.targetPrice!;
        } else {
          return data.price <= rule.conditions.targetPrice!;
        }
      
      case 'abnormal':
        return Math.abs(data.change_percent) > (rule.conditions.changePercent || 5) ||
               data.volume_ratio > (rule.conditions.volumeRatio || 3);
      
      default:
        return false;
    }
  }
  
  private triggerAlert(rule: AlertRule, data: any): void {
    const message = this.formatAlertMessage(rule, data);
    
    rule.notificationChannels.forEach(channel => {
      if (channel === 'browser') {
        this.notificationService.sendBrowserNotification(message);
      } else if (channel === 'sound') {
        this.notificationService.playSound();
      }
    });
    
    // 保存到提醒历史
    this.saveAlertHistory(rule, data, message);
  }
}
```

---

### 2. Portfolio Manager (持仓管理器)

**职责**: 管理用户持仓，计算盈亏，监控止损止盈

**核心接口**:

```typescript
interface Position {
  id: string;
  stockCode: string;
  stockName: string;
  buyPrice: number;
  quantity: number;
  buyDate: string;
  stopLoss: number;
  takeProfit: number;
  currentPrice?: number;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercent?: number;
  status?: 'profit' | 'loss' | 'even';
  holdDays?: number;
}

class PortfolioManager {
  private positions: Position[] = [];
  
  // 添加持仓
  addPosition(position: Omit<Position, 'id'>): string;
  
  // 删除持仓
  removePosition(positionId: string): void;
  
  // 更新持仓价格
  updatePositions(): Promise<void>;
  
  // 获取所有持仓
  getPositions(): Position[];
  
  // 获取持仓统计
  getStatistics(): {
    totalValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    positionCount: number;
    avgHoldDays: number;
  };
  
  // 检查止损止盈
  checkStopLossTakeProfit(): void;
}
```



**实现细节**:

```typescript
const POSITIONS_KEY = 'PORTFOLIO_POSITIONS';

export class PortfolioManager {
  constructor(
    private dataService: DataService,
    private alertManager: AlertManager
  ) {
    this.loadPositions();
    this.startAutoUpdate();
  }
  
  private loadPositions(): void {
    const stored = localStorage.getItem(POSITIONS_KEY);
    this.positions = stored ? JSON.parse(stored) : [];
  }
  
  private savePositions(): void {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(this.positions));
  }
  
  addPosition(position: Omit<Position, 'id'>): string {
    const newPosition: Position = {
      ...position,
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.positions.push(newPosition);
    this.savePositions();
    
    // 自动创建止损止盈提醒
    this.createStopLossAlert(newPosition);
    this.createTakeProfitAlert(newPosition);
    
    return newPosition.id;
  }
  
  async updatePositions(): Promise<void> {
    for (const position of this.positions) {
      const data = await this.dataService.getStockData(position.stockCode);
      
      position.currentPrice = data.price;
      position.currentValue = data.price * position.quantity;
      position.profitLoss = (data.price - position.buyPrice) * position.quantity;
      position.profitLossPercent = ((data.price - position.buyPrice) / position.buyPrice) * 100;
      
      if (position.profitLoss > 0) {
        position.status = 'profit';
      } else if (position.profitLoss < 0) {
        position.status = 'loss';
      } else {
        position.status = 'even';
      }
      
      // 计算持有天数
      const buyDate = new Date(position.buyDate);
      const now = new Date();
      position.holdDays = Math.floor((now.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    
    this.savePositions();
  }
  
  private startAutoUpdate(): void {
    // 每30秒更新一次
    setInterval(() => {
      this.updatePositions();
      this.checkStopLossTakeProfit();
    }, 30000);
  }
  
  checkStopLossTakeProfit(): void {
    this.positions.forEach(position => {
      if (!position.currentPrice) return;
      
      // 检查止损
      const distanceToStopLoss = ((position.currentPrice - position.stopLoss) / position.buyPrice) * 100;
      if (distanceToStopLoss <= 1) {
        this.alertManager.addRule({
          type: 'stop_loss',
          stockCode: position.stockCode,
          stockName: position.stockName,
          conditions: { targetPrice: position.stopLoss, direction: 'down' },
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser', 'sound']
        });
      }
      
      // 检查止盈
      const distanceToTakeProfit = ((position.takeProfit - position.currentPrice) / position.buyPrice) * 100;
      if (distanceToTakeProfit <= 1) {
        this.alertManager.addRule({
          type: 'take_profit',
          stockCode: position.stockCode,
          stockName: position.stockName,
          conditions: { targetPrice: position.takeProfit, direction: 'up' },
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser', 'sound']
        });
      }
    });
  }
}
```

---

### 3. WatchList Manager (自选股管理器)

**职责**: 管理自选股列表，监控异动和买入信号

**核心接口**:

```typescript
interface WatchListStock {
  code: string;
  name: string;
  addedAt: string;
  monitorAbnormal: boolean;
  monitorSignal: boolean;
  lastPrice?: number;
  lastChange?: number;
}

class WatchListManager {
  private stocks: WatchListStock[] = [];
  
  // 添加自选股
  addStock(code: string, name: string): void;
  
  // 删除自选股
  removeStock(code: string): void;
  
  // 批量删除
  removeMultiple(codes: string[]): void;
  
  // 获取自选股列表
  getStocks(): WatchListStock[];
  
  // 更新自选股数据
  updateStocks(): Promise<void>;
  
  // 检查异动
  checkAbnormal(): void;
  
  // 检查买入信号
  checkBuySignals(): void;
}
```



**实现细节**:

```typescript
const WATCHLIST_KEY = 'WATCHLIST_STOCKS';
const MAX_WATCHLIST_SIZE = 50;

export class WatchListManager {
  constructor(
    private dataService: DataService,
    private alertManager: AlertManager
  ) {
    this.loadStocks();
    this.startMonitoring();
  }
  
  addStock(code: string, name: string): void {
    if (this.stocks.length >= MAX_WATCHLIST_SIZE) {
      throw new Error(`自选股数量已达上限（${MAX_WATCHLIST_SIZE}只）`);
    }
    
    if (this.stocks.some(s => s.code === code)) {
      throw new Error('该股票已在自选股中');
    }
    
    this.stocks.push({
      code,
      name,
      addedAt: new Date().toISOString(),
      monitorAbnormal: true,
      monitorSignal: true
    });
    
    this.saveStocks();
  }
  
  private startMonitoring(): void {
    // 每5分钟检查一次
    setInterval(() => {
      this.updateStocks();
      this.checkAbnormal();
      this.checkBuySignals();
    }, 5 * 60 * 1000);
  }
  
  async checkAbnormal(): Promise<void> {
    for (const stock of this.stocks) {
      if (!stock.monitorAbnormal) continue;
      
      const data = await this.dataService.getStockData(stock.code);
      
      // 检查涨跌幅异常
      if (Math.abs(data.change_percent) > 5) {
        this.alertManager.addRule({
          type: 'abnormal',
          stockCode: stock.code,
          stockName: stock.name,
          conditions: { changePercent: 5 },
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser']
        });
      }
      
      // 检查成交量异常
      if (data.volume_ratio > 3) {
        this.alertManager.addRule({
          type: 'abnormal',
          stockCode: stock.code,
          stockName: stock.name,
          conditions: { volumeRatio: 3 },
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser']
        });
      }
    }
  }
  
  async checkBuySignals(): Promise<void> {
    for (const stock of this.stocks) {
      if (!stock.monitorSignal) continue;
      
      const data = await this.dataService.getStockData(stock.code);
      
      // 检查是否符合波段交易策略
      const meetsStrategy = 
        data.change_percent >= -2 && data.change_percent <= 5 &&
        data.volume_ratio >= 1.5 && data.volume_ratio <= 3 &&
        data.market_cap <= 160;
      
      if (meetsStrategy) {
        this.alertManager.addRule({
          type: 'signal',
          stockCode: stock.code,
          stockName: stock.name,
          conditions: {},
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser']
        });
      }
    }
  }
}
```

---

### 4. Indicator Calculator (技术指标计算器)

**职责**: 计算MACD、KDJ、RSI等技术指标，生成交易信号

**核心接口**:

```typescript
interface MACDData {
  dif: number;
  dea: number;
  macd: number;
  signal: 'golden_cross' | 'death_cross' | 'none';
}

interface KDJData {
  k: number;
  d: number;
  j: number;
  signal: 'low_golden_cross' | 'high_death_cross' | 'overbought' | 'oversold' | 'none';
}

interface RSIData {
  rsi6: number;
  rsi12: number;
  rsi24: number;
  signal: 'overbought' | 'oversold' | 'none';
}

interface TechnicalSignal {
  overall: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  score: number; // 0-100
  confidence: number; // 0-100
  signals: {
    macd: MACDData;
    kdj: KDJData;
    rsi: RSIData;
  };
  recommendation: string;
}

class IndicatorCalculator {
  // 计算MACD
  calculateMACD(prices: number[]): MACDData;
  
  // 计算KDJ
  calculateKDJ(high: number[], low: number[], close: number[]): KDJData;
  
  // 计算RSI
  calculateRSI(prices: number[]): RSIData;
  
  // 综合分析
  analyzeTechnicals(stockCode: string): Promise<TechnicalSignal>;
}
```



**实现细节**:

```typescript
export class IndicatorCalculator {
  constructor(private dataService: DataService) {}
  
  calculateMACD(prices: number[], fast = 12, slow = 26, signal = 9): MACDData {
    // 计算EMA
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    
    // DIF = 快线 - 慢线
    const dif = emaFast[emaFast.length - 1] - emaSlow[emaSlow.length - 1];
    
    // DEA = DIF的信号线
    const difArray = emaFast.map((f, i) => f - emaSlow[i]);
    const deaArray = this.calculateEMA(difArray, signal);
    const dea = deaArray[deaArray.length - 1];
    
    // MACD柱
    const macd = (dif - dea) * 2;
    
    // 判断信号
    let signalType: 'golden_cross' | 'death_cross' | 'none' = 'none';
    if (difArray.length >= 2 && deaArray.length >= 2) {
      const prevDif = difArray[difArray.length - 2];
      const prevDea = deaArray[deaArray.length - 2];
      
      if (prevDif <= prevDea && dif > dea) {
        signalType = 'golden_cross';
      } else if (prevDif >= prevDea && dif < dea) {
        signalType = 'death_cross';
      }
    }
    
    return { dif, dea, macd, signal: signalType };
  }
  
  calculateKDJ(high: number[], low: number[], close: number[], n = 9): KDJData {
    // 计算RSV
    const lowestLow = Math.min(...low.slice(-n));
    const highestHigh = Math.max(...high.slice(-n));
    const rsv = ((close[close.length - 1] - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // K值 = 2/3 * 前K + 1/3 * RSV
    // D值 = 2/3 * 前D + 1/3 * K
    // J值 = 3K - 2D
    // 简化实现，使用当前值
    const k = rsv;
    const d = rsv;
    const j = 3 * k - 2 * d;
    
    // 判断信号
    let signal: 'low_golden_cross' | 'high_death_cross' | 'overbought' | 'oversold' | 'none' = 'none';
    if (k < 20 && d < 20) {
      signal = 'oversold';
    } else if (k > 80 && d > 80) {
      signal = 'overbought';
    }
    
    return { k, d, j, signal };
  }
  
  calculateRSI(prices: number[], periods = [6, 12, 24]): RSIData {
    const rsi6 = this.calculateSingleRSI(prices, 6);
    const rsi12 = this.calculateSingleRSI(prices, 12);
    const rsi24 = this.calculateSingleRSI(prices, 24);
    
    let signal: 'overbought' | 'oversold' | 'none' = 'none';
    if (rsi6 < 20) {
      signal = 'oversold';
    } else if (rsi6 > 80) {
      signal = 'overbought';
    }
    
    return { rsi6, rsi12, rsi24, signal };
  }
  
  private calculateSingleRSI(prices: number[], period: number): number {
    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    const gains = changes.map(c => c > 0 ? c : 0);
    const losses = changes.map(c => c < 0 ? -c : 0);
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }
  
  private calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    
    return ema;
  }
  
  async analyzeTechnicals(stockCode: string): Promise<TechnicalSignal> {
    // 获取历史数据
    const klineData = await this.dataService.getKlineData(stockCode, 60);
    const prices = klineData.map(k => k.close);
    const highs = klineData.map(k => k.high);
    const lows = klineData.map(k => k.low);
    
    // 计算各指标
    const macd = this.calculateMACD(prices);
    const kdj = this.calculateKDJ(highs, lows, prices);
    const rsi = this.calculateRSI(prices);
    
    // 综合评分
    let score = 50; // 基础分
    
    // MACD贡献
    if (macd.signal === 'golden_cross') score += 15;
    else if (macd.signal === 'death_cross') score -= 15;
    
    // KDJ贡献
    if (kdj.signal === 'low_golden_cross') score += 20;
    else if (kdj.signal === 'high_death_cross') score -= 20;
    else if (kdj.signal === 'oversold') score += 10;
    else if (kdj.signal === 'overbought') score -= 10;
    
    // RSI贡献
    if (rsi.signal === 'oversold') score += 15;
    else if (rsi.signal === 'overbought') score -= 15;
    
    // 限制在0-100范围
    score = Math.max(0, Math.min(100, score));
    
    // 判断整体信号
    let overall: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
    if (score >= 80) overall = 'strong_buy';
    else if (score >= 60) overall = 'buy';
    else if (score >= 40) overall = 'hold';
    else if (score >= 20) overall = 'sell';
    else overall = 'strong_sell';
    
    // 计算可信度
    const confidence = this.calculateConfidence(macd, kdj, rsi);
    
    // 生成建议
    const recommendation = this.generateRecommendation(overall, score, { macd, kdj, rsi });
    
    return {
      overall,
      score,
      confidence,
      signals: { macd, kdj, rsi },
      recommendation
    };
  }
  
  private calculateConfidence(macd: MACDData, kdj: KDJData, rsi: RSIData): number {
    let confidence = 50;
    
    // 多个指标同向增加可信度
    const signals = [macd.signal, kdj.signal, rsi.signal].filter(s => s !== 'none');
    confidence += signals.length * 10;
    
    return Math.min(100, confidence);
  }
  
  private generateRecommendation(
    overall: string,
    score: number,
    signals: { macd: MACDData; kdj: KDJData; rsi: RSIData }
  ): string {
    const recommendations = {
      strong_buy: '多个技术指标显示强烈买入信号，建议积极关注',
      buy: '技术指标偏多，可考虑适量买入',
      hold: '技术指标中性，建议观望等待更明确信号',
      sell: '技术指标偏空，建议减仓或观望',
      strong_sell: '多个技术指标显示卖出信号，建议规避风险'
    };
    
    return recommendations[overall as keyof typeof recommendations];
  }
}
```

---

### 5. Notification Service (通知服务)

**职责**: 发送浏览器通知、播放音效、管理通知权限



**核心接口**:

```typescript
interface NotificationMessage {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

class NotificationService {
  // 请求通知权限
  requestPermission(): Promise<NotificationPermission>;
  
  // 发送浏览器通知
  sendBrowserNotification(message: NotificationMessage): void;
  
  // 播放音效
  playSound(soundType?: 'alert' | 'warning' | 'success'): void;
  
  // 检查权限状态
  checkPermission(): NotificationPermission;
  
  // 显示系统内消息
  showInternalMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void;
}
```

**实现细节**:

```typescript
export class NotificationService {
  private audioContext: AudioContext | null = null;
  
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知功能');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }
  
  sendBrowserNotification(message: NotificationMessage): void {
    if (Notification.permission !== 'granted') {
      console.warn('未授权浏览器通知');
      this.showInternalMessage(message.body, 'info');
      return;
    }
    
    const notification = new Notification(message.title, {
      body: message.body,
      icon: message.icon || '/logo.png',
      tag: message.tag,
      data: message.data,
      requireInteraction: false,
      silent: false
    });
    
    notification.onclick = () => {
      window.focus();
      if (message.data?.stockCode) {
        // 跳转到股票详情
        window.location.hash = `#/stock/${message.data.stockCode}`;
      }
      notification.close();
    };
    
    // 5秒后自动关闭
    setTimeout(() => notification.close(), 5000);
  }
  
  playSound(soundType: 'alert' | 'warning' | 'success' = 'alert'): void {
    // 使用Web Audio API播放简单音效
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // 不同类型的音效
    const frequencies = {
      alert: 800,
      warning: 600,
      success: 1000
    };
    
    oscillator.frequency.value = frequencies[soundType];
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }
  
  showInternalMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    // 使用现有的UI组件显示消息（如Ant Design的message组件）
    // 这里假设有一个全局的message对象
    if (typeof window !== 'undefined' && (window as any).showMessage) {
      (window as any).showMessage(message, type);
    }
  }
}
```

---

## UI Components

### 1. AlertCenter (提醒中心)

**功能**: 统一管理所有提醒规则

**组件结构**:

```tsx
interface AlertCenterProps {
  alertManager: AlertManager;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ alertManager }) => {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  return (
    <div className="alert-center">
      <div className="header">
        <h2>📢 提醒中心</h2>
        <Button onClick={() => setShowAddDialog(true)}>+ 添加提醒</Button>
      </div>
      
      <Tabs>
        <TabPane tab="价格提醒" key="price">
          <AlertList rules={rules.filter(r => r.type === 'price')} />
        </TabPane>
        <TabPane tab="止损止盈" key="stop">
          <AlertList rules={rules.filter(r => r.type.includes('stop'))} />
        </TabPane>
        <TabPane tab="异动提醒" key="abnormal">
          <AlertList rules={rules.filter(r => r.type === 'abnormal')} />
        </TabPane>
        <TabPane tab="提醒历史" key="history">
          <AlertHistory />
        </TabPane>
      </Tabs>
      
      {showAddDialog && (
        <AddAlertDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={(rule) => {
            alertManager.addRule(rule);
            setShowAddDialog(false);
          }}
        />
      )}
    </div>
  );
};
```

### 2. PortfolioTracker (持仓追踪)

**功能**: 显示持仓列表和统计

```tsx
const PortfolioTracker: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  
  return (
    <div className="portfolio-tracker">
      <Card title="💼 持仓追踪">
        <div className="statistics">
          <Statistic title="总市值" value={statistics?.totalValue} prefix="¥" />
          <Statistic 
            title="总盈亏" 
            value={statistics?.totalProfitLoss} 
            prefix="¥"
            valueStyle={{ color: statistics?.totalProfitLoss >= 0 ? '#3f8600' : '#cf1322' }}
          />
          <Statistic 
            title="盈亏比例" 
            value={statistics?.totalProfitLossPercent} 
            suffix="%"
            valueStyle={{ color: statistics?.totalProfitLossPercent >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </div>
        
        <Table
          dataSource={positions}
          columns={[
            { title: '股票', dataIndex: 'stockName', key: 'name' },
            { title: '买入价', dataIndex: 'buyPrice', key: 'buyPrice' },
            { title: '当前价', dataIndex: 'currentPrice', key: 'currentPrice' },
            { title: '数量', dataIndex: 'quantity', key: 'quantity' },
            { 
              title: '盈亏', 
              dataIndex: 'profitLoss', 
              key: 'profitLoss',
              render: (value, record) => (
                <span style={{ color: value >= 0 ? '#3f8600' : '#cf1322' }}>
                  {value >= 0 ? '+' : ''}{value?.toFixed(2)} ({record.profitLossPercent?.toFixed(2)}%)
                </span>
              )
            },
            { title: '持有天数', dataIndex: 'holdDays', key: 'holdDays' },
            { 
              title: '操作', 
              key: 'action',
              render: (_, record) => (
                <Space>
                  <Button size="small">详情</Button>
                  <Button size="small" danger>删除</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};
```



### 3. WatchListPanel (自选股面板)

**功能**: 管理和监控自选股

```tsx
const WatchListPanel: React.FC = () => {
  const [stocks, setStocks] = useState<WatchListStock[]>([]);
  const [sortBy, setSortBy] = useState<'change' | 'ratio' | 'cap'>('change');
  
  return (
    <Card title="⭐ 自选股" extra={<Button>+ 添加</Button>}>
      <div className="sort-controls">
        <Radio.Group value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <Radio.Button value="change">按涨跌幅</Radio.Button>
          <Radio.Button value="ratio">按量比</Radio.Button>
          <Radio.Button value="cap">按市值</Radio.Button>
        </Radio.Group>
      </div>
      
      <List
        dataSource={stocks}
        renderItem={stock => (
          <List.Item
            actions={[
              <Switch 
                checkedChildren="监控异动" 
                unCheckedChildren="不监控"
                checked={stock.monitorAbnormal}
              />,
              <Switch 
                checkedChildren="监控信号" 
                unCheckedChildren="不监控"
                checked={stock.monitorSignal}
              />,
              <Button size="small" danger>删除</Button>
            ]}
          >
            <List.Item.Meta
              title={`${stock.name} (${stock.code})`}
              description={
                <Space>
                  <span>价格: ¥{stock.lastPrice}</span>
                  <span style={{ color: stock.lastChange! >= 0 ? '#3f8600' : '#cf1322' }}>
                    {stock.lastChange! >= 0 ? '+' : ''}{stock.lastChange?.toFixed(2)}%
                  </span>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
```

### 4. TechnicalIndicators (技术指标)

**功能**: 显示技术指标分析

```tsx
const TechnicalIndicators: React.FC<{ stockCode: string }> = ({ stockCode }) => {
  const [signal, setSignal] = useState<TechnicalSignal | null>(null);
  const [loading, setLoading] = useState(false);
  
  const getSignalColor = (overall: string) => {
    const colors = {
      strong_buy: '#237804',
      buy: '#52c41a',
      hold: '#faad14',
      sell: '#ff7875',
      strong_sell: '#cf1322'
    };
    return colors[overall as keyof typeof colors];
  };
  
  const getSignalIcon = (overall: string) => {
    const icons = {
      strong_buy: '🚀',
      buy: '📈',
      hold: '⏸️',
      sell: '📉',
      strong_sell: '⚠️'
    };
    return icons[overall as keyof typeof icons];
  };
  
  return (
    <Card title="📊 技术指标分析" loading={loading}>
      {signal && (
        <>
          <div className="overall-signal" style={{ 
            textAlign: 'center', 
            padding: '20px',
            backgroundColor: getSignalColor(signal.overall) + '20',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '48px' }}>{getSignalIcon(signal.overall)}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getSignalColor(signal.overall) }}>
              {signal.overall.replace('_', ' ').toUpperCase()}
            </div>
            <div style={{ fontSize: '16px', marginTop: '10px' }}>
              综合评分: {signal.score}/100 | 可信度: {signal.confidence}%
            </div>
            <div style={{ marginTop: '10px', color: '#666' }}>
              {signal.recommendation}
            </div>
          </div>
          
          <Tabs>
            <TabPane tab="MACD" key="macd">
              <div className="indicator-detail">
                <p>DIF: {signal.signals.macd.dif.toFixed(2)}</p>
                <p>DEA: {signal.signals.macd.dea.toFixed(2)}</p>
                <p>MACD: {signal.signals.macd.macd.toFixed(2)}</p>
                <Tag color={signal.signals.macd.signal === 'golden_cross' ? 'green' : 
                           signal.signals.macd.signal === 'death_cross' ? 'red' : 'default'}>
                  {signal.signals.macd.signal === 'golden_cross' ? '金叉 - 买入信号' :
                   signal.signals.macd.signal === 'death_cross' ? '死叉 - 卖出信号' : '无明确信号'}
                </Tag>
                <div className="help-text">
                  💡 MACD金叉表示短期趋势向上，死叉表示短期趋势向下
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="KDJ" key="kdj">
              <div className="indicator-detail">
                <p>K: {signal.signals.kdj.k.toFixed(2)}</p>
                <p>D: {signal.signals.kdj.d.toFixed(2)}</p>
                <p>J: {signal.signals.kdj.j.toFixed(2)}</p>
                <Tag color={
                  signal.signals.kdj.signal === 'low_golden_cross' ? 'green' :
                  signal.signals.kdj.signal === 'high_death_cross' ? 'red' :
                  signal.signals.kdj.signal === 'oversold' ? 'blue' :
                  signal.signals.kdj.signal === 'overbought' ? 'orange' : 'default'
                }>
                  {signal.signals.kdj.signal === 'low_golden_cross' ? '低位金叉 - 强买入' :
                   signal.signals.kdj.signal === 'high_death_cross' ? '高位死叉 - 强卖出' :
                   signal.signals.kdj.signal === 'oversold' ? '超卖 - 可关注' :
                   signal.signals.kdj.signal === 'overbought' ? '超买 - 注意风险' : '无明确信号'}
                </Tag>
                <div className="help-text">
                  💡 KDJ在20以下为超卖区，80以上为超买区
                </div>
              </div>
            </TabPane>
            
            <TabPane tab="RSI" key="rsi">
              <div className="indicator-detail">
                <p>RSI(6): {signal.signals.rsi.rsi6.toFixed(2)}</p>
                <p>RSI(12): {signal.signals.rsi.rsi12.toFixed(2)}</p>
                <p>RSI(24): {signal.signals.rsi.rsi24.toFixed(2)}</p>
                <Tag color={
                  signal.signals.rsi.signal === 'oversold' ? 'green' :
                  signal.signals.rsi.signal === 'overbought' ? 'red' : 'default'
                }>
                  {signal.signals.rsi.signal === 'oversold' ? '超卖 - 可关注' :
                   signal.signals.rsi.signal === 'overbought' ? '超买 - 注意风险' : '无明确信号'}
                </Tag>
                <div className="help-text">
                  💡 RSI在20以下为超卖，80以上为超买
                </div>
              </div>
            </TabPane>
          </Tabs>
        </>
      )}
    </Card>
  );
};
```

### 5. NotificationSettings (提醒设置)

**功能**: 配置提醒规则

```tsx
const NotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    masterSwitch: true,
    priceAlert: true,
    positionAlert: true,
    watchlistAlert: true,
    smartRecommendation: true,
    tradingHoursOnly: true,
    maxAlertsPerDay: 10,
    alertInterval: 24,
    soundEnabled: true,
    browserNotification: true
  });
  
  return (
    <Card title="⚙️ 提醒设置">
      <Form layout="vertical">
        <Form.Item label="总开关">
          <Switch 
            checked={settings.masterSwitch}
            checkedChildren="开启"
            unCheckedChildren="关闭"
            onChange={checked => setSettings({...settings, masterSwitch: checked})}
          />
          <div className="help-text">关闭后将停止所有提醒</div>
        </Form.Item>
        
        <Divider>提醒类型</Divider>
        
        <Form.Item label="价格提醒">
          <Switch checked={settings.priceAlert} />
        </Form.Item>
        
        <Form.Item label="持仓提醒（止损/止盈）">
          <Switch checked={settings.positionAlert} />
        </Form.Item>
        
        <Form.Item label="自选股异动提醒">
          <Switch checked={settings.watchlistAlert} />
        </Form.Item>
        
        <Form.Item label="智能推荐">
          <Switch checked={settings.smartRecommendation} />
        </Form.Item>
        
        <Divider>提醒频率</Divider>
        
        <Form.Item label="仅在交易时段提醒">
          <Switch checked={settings.tradingHoursOnly} />
          <div className="help-text">9:30-15:00</div>
        </Form.Item>
        
        <Form.Item label="每日最大提醒数量">
          <Slider 
            min={5} 
            max={50} 
            value={settings.maxAlertsPerDay}
            marks={{ 5: '5', 10: '10', 20: '20', 50: '50' }}
          />
        </Form.Item>
        
        <Form.Item label="同一股票提醒间隔（小时）">
          <Slider 
            min={1} 
            max={72} 
            value={settings.alertInterval}
            marks={{ 1: '1h', 24: '24h', 48: '48h', 72: '72h' }}
          />
        </Form.Item>
        
        <Divider>通知渠道</Divider>
        
        <Form.Item label="浏览器通知">
          <Switch checked={settings.browserNotification} />
          <Button size="small" style={{ marginLeft: '10px' }}>
            请求权限
          </Button>
        </Form.Item>
        
        <Form.Item label="音效提醒">
          <Switch checked={settings.soundEnabled} />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary">保存设置</Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
```

---

## Data Storage

### localStorage Schema

```typescript
// 提醒规则
ALERT_RULES: AlertRule[]

// 持仓记录
PORTFOLIO_POSITIONS: Position[]

// 自选股列表
WATCHLIST_STOCKS: WatchListStock[]

// 提醒历史
ALERT_HISTORY: {
  id: string;
  ruleId: string;
  triggeredAt: string;
  message: string;
  data: any;
}[]

// 提醒设置
NOTIFICATION_SETTINGS: {
  masterSwitch: boolean;
  priceAlert: boolean;
  positionAlert: boolean;
  watchlistAlert: boolean;
  smartRecommendation: boolean;
  tradingHoursOnly: boolean;
  maxAlertsPerDay: number;
  alertInterval: number;
  soundEnabled: boolean;
  browserNotification: boolean;
}
```

---

## Integration with Existing Features

### 与v4.11.0功能集成

1. **智能交易计划（v4.11.0）**
   - 持仓追踪自动使用交易计划的止损/止盈价
   - 复用交易计划的风险收益比计算

2. **市场情绪指数（v4.11.0）**
   - 智能推荐结合市场情绪给出操作建议
   - 极端情绪时自动发送提醒

3. **历史表现追踪（v4.11.0）**
   - 每周发送策略表现报告
   - 胜率下降时提醒用户

4. **风险分散评分（v4.9.0）**
   - 持仓风险评估使用风险分散评分
   - 集中度过高时提醒

5. **板块轮动提示（v4.10.0）**
   - 检测板块轮动，推荐热门板块股票
   - 资金流入板块时提醒

---

## Implementation Plan

### Phase 1: 核心功能（优先级最高）

**目标**: 实现基础的提醒和持仓追踪功能

**任务**:
1. 实现 AlertManager 和 NotificationService
2. 实现价格提醒功能
3. 实现持仓追踪功能
4. 实现浏览器通知
5. 创建 AlertCenter 和 PortfolioTracker 组件

**预计时间**: 2-3天

### Phase 2: 自选股和技术指标（优先级高）

**目标**: 实现自选股监控和技术指标分析

**任务**:
1. 实现 WatchListManager
2. 实现 IndicatorCalculator
3. 实现自选股异动监控
4. 创建 WatchListPanel 和 TechnicalIndicators 组件
5. 集成技术指标图表

**预计时间**: 2-3天

### Phase 3: 智能推荐和设置（优先级中）

**目标**: 实现智能推荐和提醒设置

**任务**:
1. 实现每日推荐功能
2. 实现板块轮动提醒
3. 实现市场情绪提醒
4. 创建 NotificationSettings 组件
5. 实现提醒历史记录

**预计时间**: 1-2天

---

## Testing Strategy

### Unit Tests

- AlertManager 的规则管理
- PortfolioManager 的盈亏计算
- IndicatorCalculator 的指标计算
- NotificationService 的通知发送

### Integration Tests

- 提醒触发流程
- 持仓更新流程
- 自选股监控流程
- 技术指标分析流程

### User Acceptance Tests

- 用户能成功添加价格提醒
- 用户能收到浏览器通知
- 用户能查看持仓盈亏
- 用户能看到技术指标分析

---

## Performance Considerations

1. **定时任务优化**
   - 价格提醒检查：每分钟
   - 持仓更新：每30秒
   - 自选股监控：每5分钟
   - 避免同时执行多个检查任务

2. **数据缓存**
   - 缓存股票数据，避免重复请求
   - 缓存技术指标计算结果

3. **通知节流**
   - 限制每日最大通知数量
   - 同一股票24小时内只提醒一次
   - 批量通知合并

4. **localStorage优化**
   - 定期清理过期数据
   - 限制历史记录数量（最多保留100条）

---

## Security and Privacy

1. **数据隐私**
   - 所有数据仅存储在用户本地
   - 不上传任何用户数据到服务器

2. **权限管理**
   - 浏览器通知需要用户明确授权
   - 音效播放需要用户交互后才能启用

3. **数据安全**
   - localStorage数据不加密（因为是本地数据）
   - 定期备份提醒（提示用户导出数据）

---

## Future Enhancements

1. **高级技术指标**
   - 布林带（BOLL）
   - 均线系统（MA）
   - 成交量指标（OBV）

2. **AI智能分析**
   - 接入LLM进行基本面分析
   - 智能问答功能

3. **多设备同步**
   - 需要后端服务器支持
   - 云端存储提醒规则和持仓

4. **更多通知渠道**
   - 邮件通知
   - 微信通知
   - 短信通知

5. **高级提醒规则**
   - 组合条件提醒
   - 自定义公式提醒
   - 机器学习预测提醒
