/**
 * 本地存储工具
 */

const STORAGE_KEYS = {
  FAVORITES: 'band_trading_favorites',
  HISTORY: 'band_trading_history',
  PRESETS: 'band_trading_presets',
  SETTINGS: 'band_trading_settings',
  BOARD_HISTORY: 'band_trading_board_history', // 板块历史
  TRACKING_HISTORY: 'band_trading_tracking_history', // 历史表现追踪
  MARKET_EMOTION: 'band_trading_market_emotion', // 市场情绪
  TRADING_PLANS: 'band_trading_trading_plans', // 交易计划
  ALERT_RULES: 'band_trading_alert_rules', // 提醒规则
  ALERT_HISTORY: 'band_trading_alert_history', // 提醒历史
  NOTIFICATION_SETTINGS: 'band_trading_notification_settings', // 提醒设置
  PORTFOLIO_POSITIONS: 'band_trading_portfolio_positions', // 持仓记录
  WATCHLIST_STOCKS: 'band_trading_watchlist_stocks' // 自选股列表（提醒用）
};

// 自选股接口
export interface FavoriteStock {
  code: string;
  name: string;
  addedAt: string;
  note?: string;
}

// 筛选历史接口
export interface ScreenHistory {
  id: string;
  timestamp: string;
  config: any;
  resultCount: number;
  marketEnv?: any;
}

// 预设方案接口
export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  config: any;
  createdAt: string;
}

// ==================== 自选股管理 ====================

export function getFavorites(): FavoriteStock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取自选股失败:', error);
    return [];
  }
}

export function addFavorite(stock: { code: string; name: string; note?: string }): boolean {
  try {
    const favorites = getFavorites();
    
    // 检查是否已存在
    if (favorites.some(f => f.code === stock.code)) {
      return false;
    }
    
    const newFavorite: FavoriteStock = {
      code: stock.code,
      name: stock.name,
      note: stock.note,
      addedAt: new Date().toISOString()
    };
    
    favorites.unshift(newFavorite);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('添加自选股失败:', error);
    return false;
  }
}

export function removeFavorite(code: string): boolean {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f.code !== code);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('删除自选股失败:', error);
    return false;
  }
}

export function isFavorite(code: string): boolean {
  const favorites = getFavorites();
  return favorites.some(f => f.code === code);
}

export function updateFavoriteNote(code: string, note: string): boolean {
  try {
    const favorites = getFavorites();
    const favorite = favorites.find(f => f.code === code);
    if (favorite) {
      favorite.note = note;
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新备注失败:', error);
    return false;
  }
}

// ==================== 筛选历史 ====================

export function getHistory(limit: number = 10): ScreenHistory[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('获取历史记录失败:', error);
    return [];
  }
}

export function addHistory(config: any, resultCount: number, marketEnv?: any): void {
  try {
    const history = getHistory(50); // 保留最近50条
    
    const newRecord: ScreenHistory = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      config,
      resultCount,
      marketEnv
    };
    
    history.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch (error) {
    console.error('添加历史记录失败:', error);
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('清除历史记录失败:', error);
  }
}

export function deleteHistoryItem(id: string): boolean {
  try {
    const history = getHistory(50);
    const filtered = history.filter(h => h.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
}

// ==================== 预设方案 ====================

export function getPresets(): FilterPreset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
    return data ? JSON.parse(data) : getDefaultPresets();
  } catch (error) {
    console.error('获取预设方案失败:', error);
    return getDefaultPresets();
  }
}

function getDefaultPresets(): FilterPreset[] {
  return [
    {
      id: 'aggressive',
      name: '激进型',
      description: '追求高收益，涨幅3-7%，量比2-4',
      config: {
        changeMin: 3,
        changeMax: 7,
        volumeRatioMin: 2,
        volumeRatioMax: 4,
        marketCapMin: 50,
        marketCapMax: 160,
        includeKcbCyb: true,
        requireMargin: true,
        preferTailInflow: true,
        strictRiskControl: true,
        isBandTradingMode: true  // 改为 true
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'conservative',
      name: '保守型',
      description: '稳健为主，回调-2-1%，量比1.5-2.5',
      config: {
        changeMin: -2,
        changeMax: 1,
        volumeRatioMin: 1.5,
        volumeRatioMax: 2.5,
        marketCapMin: 50,
        marketCapMax: 160,
        includeKcbCyb: true,
        requireMargin: true,
        preferTailInflow: true,
        strictRiskControl: true,
        isBandTradingMode: true  // 改为 true
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'balanced',
      name: '平衡型',
      description: '均衡配置，涨幅0-4%，量比1.8-3',
      config: {
        changeMin: 0,
        changeMax: 4,
        volumeRatioMin: 1.8,
        volumeRatioMax: 3,
        marketCapMin: 50,
        marketCapMax: 160,
        includeKcbCyb: true,
        requireMargin: true,
        preferTailInflow: true,
        strictRiskControl: true,
        isBandTradingMode: true  // 改为 true
      },
      createdAt: new Date().toISOString()
    }
  ];
}

export function addPreset(preset: Omit<FilterPreset, 'id' | 'createdAt'>): boolean {
  try {
    const presets = getPresets();
    
    const newPreset: FilterPreset = {
      ...preset,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    presets.push(newPreset);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    return true;
  } catch (error) {
    console.error('添加预设方案失败:', error);
    return false;
  }
}

export function removePreset(id: string): boolean {
  try {
    const presets = getPresets();
    const filtered = presets.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('删除预设方案失败:', error);
    return false;
  }
}

// ==================== 设置管理 ====================

export interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  tableDensity: 'compact' | 'standard' | 'comfortable';
  cacheExpiry: number; // 分钟
  autoRefresh: boolean;
  refreshInterval: number;
  soundEnabled: boolean;
  notificationEnabled: boolean;
}

export function getSettings(): AppSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch (error) {
    console.error('获取设置失败:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings(): AppSettings {
  return {
    theme: 'light',
    fontSize: 'medium',
    tableDensity: 'standard',
    cacheExpiry: 5,
    autoRefresh: false,
    refreshInterval: 60,
    soundEnabled: false,
    notificationEnabled: false
  };
}

export function updateSettings(settings: Partial<AppSettings>): boolean {
  try {
    const current = getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('更新设置失败:', error);
    return false;
  }
}

export function toggleTheme(): 'light' | 'dark' {
  const settings = getSettings();
  const newTheme = settings.theme === 'light' ? 'dark' : 'light';
  updateSettings({ theme: newTheme });
  return newTheme;
}

// ==================== 筛选结果缓存 ====================

export interface CachedScreenResult {
  timestamp: string;
  config: any;
  stocks: any[];
  marketEnv?: any;
  expiresAt: string;
}

export function getCachedScreenResult(config: any, expiryMinutes?: number): CachedScreenResult | null {
  try {
    const cacheKey = `screen_cache_${JSON.stringify(config)}`;
    const data = localStorage.getItem(cacheKey);
    
    if (!data) return null;
    
    const cached: CachedScreenResult = JSON.parse(data);
    
    // 检查是否过期（使用自定义过期时间或默认5分钟）
    if (new Date(cached.expiresAt) < new Date()) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return cached;
  } catch (error) {
    console.error('获取缓存失败:', error);
    return null;
  }
}

export function setCachedScreenResult(config: any, stocks: any[], marketEnv?: any, expiryMinutes: number = 5): void {
  try {
    const cacheKey = `screen_cache_${JSON.stringify(config)}`;
    
    const cached: CachedScreenResult = {
      timestamp: new Date().toISOString(),
      config,
      stocks,
      marketEnv,
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString() // 使用自定义过期时间
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.error('保存缓存失败:', error);
  }
}

export function clearScreenCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('screen_cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('清除缓存失败:', error);
  }
}

export function getCacheRemainingTime(config: any): string | null {
  try {
    const cacheKey = `screen_cache_${JSON.stringify(config)}`;
    const data = localStorage.getItem(cacheKey);
    
    if (!data) return null;
    
    const cached: CachedScreenResult = JSON.parse(data);
    const expiresAt = new Date(cached.expiresAt);
    const now = new Date();
    
    if (expiresAt < now) return null;
    
    const remainingMs = expiresAt.getTime() - now.getTime();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    
    return `${remainingMinutes}分钟`;
  } catch (error) {
    return null;
  }
}

// ==================== 数据清理 ====================

export function clearAllData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('清除数据失败:', error);
  }
}

export function getStorageSize(): string {
  try {
    let total = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        total += data.length;
      }
    });
    return `${(total / 1024).toFixed(2)} KB`;
  } catch (error) {
    return '0 KB';
  }
}

// ==================== 板块历史管理 ====================

export interface BoardHistoryItem {
  timestamp: string;
  boardDistribution: {
    sh_count: number;
    sz_count: number;
    cyb_count: number;
  };
  industryDistribution: Record<string, number>;
  avgChange: number;
  avgRatio: number;
}

export function getBoardHistory(limit: number = 5): BoardHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOARD_HISTORY);
    const history = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('获取板块历史失败:', error);
    return [];
  }
}

export function addBoardHistory(item: Omit<BoardHistoryItem, 'timestamp'>): void {
  try {
    const history = getBoardHistory(10); // 保留最近10条
    
    const newItem: BoardHistoryItem = {
      ...item,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.BOARD_HISTORY, JSON.stringify(history.slice(0, 10)));
  } catch (error) {
    console.error('添加板块历史失败:', error);
  }
}

export function clearBoardHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.BOARD_HISTORY);
  } catch (error) {
    console.error('清除板块历史失败:', error);
  }
}

// ==================== 历史表现追踪 ====================

export interface TrackingRecord {
  id: string;
  date: string;
  stocks: {
    code: string;
    name: string;
    buyPrice: number;
    change: number;
    ratio: number;
    boardType: string;
    industry: string;
  }[];
  performance?: {
    code: string;
    name: string;
    afterPrice: number;
    afterChange: number;
    profit: number;
    success: boolean;
  }[];
  winRate?: number;
  avgProfit?: number;
  tracked: boolean;
}

export function getTrackingHistory(limit: number = 10): TrackingRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRACKING_HISTORY);
    const history = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('获取追踪历史失败:', error);
    return [];
  }
}

export function addTrackingRecord(stocks: any[]): void {
  try {
    const history = getTrackingHistory(30); // 保留最近30条
    
    const newRecord: TrackingRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stocks: stocks.map(s => ({
        code: s.code,
        name: s.name,
        buyPrice: s.price,
        change: s.change_percent,
        ratio: s.volume_ratio,
        boardType: s.board_type?.name || '未知',
        industry: s.industry || '未知'
      })),
      tracked: false
    };
    
    history.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.TRACKING_HISTORY, JSON.stringify(history.slice(0, 30)));
  } catch (error) {
    console.error('添加追踪记录失败:', error);
  }
}

export function updateTrackingPerformance(id: string, performance: any[]): void {
  try {
    const history = getTrackingHistory(30);
    const record = history.find(r => r.id === id);
    
    if (record) {
      record.performance = performance;
      record.tracked = true;
      
      // 计算胜率和平均收益
      const successCount = performance.filter(p => p.success).length;
      record.winRate = (successCount / performance.length) * 100;
      record.avgProfit = performance.reduce((sum, p) => sum + p.profit, 0) / performance.length;
      
      localStorage.setItem(STORAGE_KEYS.TRACKING_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('更新追踪表现失败:', error);
  }
}

export function getTrackingStatistics(): {
  totalRecords: number;
  trackedRecords: number;
  overallWinRate: number;
  overallAvgProfit: number;
  bestProfit: number;
  worstProfit: number;
} {
  try {
    const history = getTrackingHistory(30);
    const trackedRecords = history.filter(r => r.tracked);
    
    if (trackedRecords.length === 0) {
      return {
        totalRecords: history.length,
        trackedRecords: 0,
        overallWinRate: 0,
        overallAvgProfit: 0,
        bestProfit: 0,
        worstProfit: 0
      };
    }
    
    const allPerformances = trackedRecords.flatMap(r => r.performance || []);
    const successCount = allPerformances.filter(p => p.success).length;
    const profits = allPerformances.map(p => p.profit);
    
    return {
      totalRecords: history.length,
      trackedRecords: trackedRecords.length,
      overallWinRate: (successCount / allPerformances.length) * 100,
      overallAvgProfit: profits.reduce((sum, p) => sum + p, 0) / profits.length,
      bestProfit: Math.max(...profits),
      worstProfit: Math.min(...profits)
    };
  } catch (error) {
    console.error('获取追踪统计失败:', error);
    return {
      totalRecords: 0,
      trackedRecords: 0,
      overallWinRate: 0,
      overallAvgProfit: 0,
      bestProfit: 0,
      worstProfit: 0
    };
  }
}

export function clearTrackingHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRACKING_HISTORY);
  } catch (error) {
    console.error('清除追踪历史失败:', error);
  }
}

// ==================== 市场情绪指数 ====================

export interface MarketEmotion {
  timestamp: string;
  score: number;
  level: 'panic_extreme' | 'panic' | 'neutral' | 'optimistic' | 'optimistic_extreme';
  riseCount: number;
  fallCount: number;
  riseRatio: number;
  avgChange: number;
  avgRatio: number;
  suggestion: string;
}

export function getMarketEmotionHistory(limit: number = 5): MarketEmotion[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MARKET_EMOTION);
    const history = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('获取市场情绪历史失败:', error);
    return [];
  }
}

export function addMarketEmotion(emotion: Omit<MarketEmotion, 'timestamp'>): void {
  try {
    const history = getMarketEmotionHistory(10); // 保留最近10条
    
    const newEmotion: MarketEmotion = {
      ...emotion,
      timestamp: new Date().toISOString()
    };
    
    history.unshift(newEmotion);
    localStorage.setItem(STORAGE_KEYS.MARKET_EMOTION, JSON.stringify(history.slice(0, 10)));
  } catch (error) {
    console.error('添加市场情绪失败:', error);
  }
}

export function clearMarketEmotion(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.MARKET_EMOTION);
  } catch (error) {
    console.error('清除市场情绪失败:', error);
  }
}

// ==================== 交易计划 ====================

export interface TradingPlan {
  code: string;
  name: string;
  buyPrice: number;
  stopLoss: number;
  targetPrice: number;
  holdDays: string;
  riskRewardRatio: string;
  currentPrice?: number;
  currentStatus?: 'approaching_target' | 'normal' | 'approaching_stop';
  distanceToStop?: number;
  distanceToTarget?: number;
  suggestion?: string;
}

export function getTradingPlans(): TradingPlan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRADING_PLANS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取交易计划失败:', error);
    return [];
  }
}

export function saveTradingPlans(plans: TradingPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRADING_PLANS, JSON.stringify(plans));
  } catch (error) {
    console.error('保存交易计划失败:', error);
  }
}

export function generateTradingPlan(stock: any): TradingPlan {
  const buyPrice = stock.price;
  const stopLoss = buyPrice * 0.95;  // -5%
  
  // 根据量比和涨幅调整目标价
  let targetPercent = 0.05;  // 默认+5%
  if (stock.volume_ratio > 2 && stock.change_percent > 3) {
    targetPercent = 0.08;  // 强势股+8%
  } else if (stock.volume_ratio > 2.5) {
    targetPercent = 0.06;  // 量比高+6%
  }
  
  const targetPrice = buyPrice * (1 + targetPercent);
  const riskRewardRatio = `1:${(targetPercent / 0.05).toFixed(1)}`;
  
  return {
    code: stock.code,
    name: stock.name,
    buyPrice,
    stopLoss,
    targetPrice,
    holdDays: '3-5天',
    riskRewardRatio,
    currentPrice: buyPrice,
    currentStatus: 'normal',
    distanceToStop: -5.0,
    distanceToTarget: targetPercent * 100,
    suggestion: '继续持有，严格执行止损'
  };
}

export function updateTradingPlanStatus(plan: TradingPlan, currentPrice: number): TradingPlan {
  const distanceToStop = ((currentPrice - plan.stopLoss) / plan.buyPrice) * 100;
  const distanceToTarget = ((plan.targetPrice - currentPrice) / plan.buyPrice) * 100;
  
  let currentStatus: 'approaching_target' | 'normal' | 'approaching_stop' = 'normal';
  let suggestion = '继续持有，严格执行止损';
  
  if (distanceToTarget <= 1) {
    currentStatus = 'approaching_target';
    suggestion = '接近目标价，可考虑止盈或上移止损至成本价';
  } else if (distanceToStop <= 1) {
    currentStatus = 'approaching_stop';
    suggestion = '接近止损位，注意风险，考虑止损';
  } else if (currentPrice > plan.buyPrice * 1.03) {
    suggestion = '已盈利>3%，建议上移止损至成本价，保护利润';
  }
  
  return {
    ...plan,
    currentPrice,
    currentStatus,
    distanceToStop,
    distanceToTarget,
    suggestion
  };
}

export function clearTradingPlans(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRADING_PLANS);
  } catch (error) {
    console.error('清除交易计划失败:', error);
  }
}


// ==================== 模拟数据生成（用于演示） ====================

export function simulateTrackingPerformance(recordId: string): void {
  try {
    const history = getTrackingHistory(30);
    const record = history.find(r => r.id === recordId);
    
    if (!record || record.tracked) return;
    
    // 模拟3天后的表现（基于初始数据生成合理的模拟结果）
    const performance = record.stocks.map(stock => {
      // 基于初始涨幅和量比生成模拟收益
      // 量比高、涨幅适中的股票更容易成功
      const baseProfit = stock.change + (stock.ratio - 1.5) * 2;
      const randomFactor = (Math.random() - 0.5) * 10; // ±5%的随机波动
      const profit = baseProfit + randomFactor;
      
      // 目标是+5%，所以profit >= 5%算成功
      const success = profit >= 5;
      
      return {
        code: stock.code,
        name: stock.name,
        afterPrice: stock.buyPrice * (1 + profit / 100),
        afterChange: profit,
        profit,
        success
      };
    });
    
    updateTrackingPerformance(recordId, performance);
  } catch (error) {
    console.error('模拟追踪表现失败:', error);
  }
}

// 自动模拟旧记录的表现（用于演示）
export function autoSimulateOldRecords(): void {
  try {
    const history = getTrackingHistory(30);
    const now = new Date();
    
    history.forEach(record => {
      if (record.tracked) return;
      
      const recordDate = new Date(record.date);
      const daysDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // 如果记录超过3天且未追踪，自动模拟表现
      if (daysDiff >= 3) {
        simulateTrackingPerformance(record.id);
      }
    });
  } catch (error) {
    console.error('自动模拟失败:', error);
  }
}


// ==================== 提醒规则管理 ====================

export interface AlertRule {
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

export function getAlertRules(): AlertRule[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ALERT_RULES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取提醒规则失败:', error);
    return [];
  }
}

export function saveAlertRules(rules: AlertRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ALERT_RULES, JSON.stringify(rules));
  } catch (error) {
    console.error('保存提醒规则失败:', error);
  }
}

export function addAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): string {
  try {
    const rules = getAlertRules();
    
    const newRule: AlertRule = {
      ...rule,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };
    
    rules.push(newRule);
    saveAlertRules(rules);
    
    return newRule.id;
  } catch (error) {
    console.error('添加提醒规则失败:', error);
    return '';
  }
}

export function removeAlertRule(ruleId: string): boolean {
  try {
    const rules = getAlertRules();
    const filtered = rules.filter(r => r.id !== ruleId);
    saveAlertRules(filtered);
    return true;
  } catch (error) {
    console.error('删除提醒规则失败:', error);
    return false;
  }
}

export function updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
  try {
    const rules = getAlertRules();
    const rule = rules.find(r => r.id === ruleId);
    
    if (rule) {
      Object.assign(rule, updates);
      saveAlertRules(rules);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('更新提醒规则失败:', error);
    return false;
  }
}

export function clearExpiredAlertRules(): void {
  try {
    const rules = getAlertRules();
    const now = new Date();
    const activeRules = rules.filter(r => new Date(r.expiresAt) > now);
    saveAlertRules(activeRules);
  } catch (error) {
    console.error('清除过期提醒规则失败:', error);
  }
}

// ==================== 提醒历史管理 ====================

export interface AlertHistoryItem {
  id: string;
  ruleId: string;
  triggeredAt: string;
  message: string;
  data: any;
  read: boolean;
}

export function getAlertHistory(limit: number = 100): AlertHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ALERT_HISTORY);
    const history = data ? JSON.parse(data) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('获取提醒历史失败:', error);
    return [];
  }
}

export function addAlertHistory(item: Omit<AlertHistoryItem, 'id' | 'triggeredAt' | 'read'>): void {
  try {
    const history = getAlertHistory(100); // 保留最近100条
    
    const newItem: AlertHistoryItem = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date().toISOString(),
      read: false
    };
    
    history.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(history.slice(0, 100)));
  } catch (error) {
    console.error('添加提醒历史失败:', error);
  }
}

export function markAlertAsRead(historyId: string): boolean {
  try {
    const history = getAlertHistory(100);
    const item = history.find(h => h.id === historyId);
    
    if (item) {
      item.read = true;
      localStorage.setItem(STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(history));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('标记提醒已读失败:', error);
    return false;
  }
}

export function markAllAlertsAsRead(): boolean {
  try {
    const history = getAlertHistory(100);
    history.forEach(item => item.read = true);
    localStorage.setItem(STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(history));
    return true;
  } catch (error) {
    console.error('标记所有提醒已读失败:', error);
    return false;
  }
}

export function clearOldHistory(keepCount: number = 100): void {
  try {
    const history = getAlertHistory(1000);
    const trimmed = history.slice(0, keepCount);
    localStorage.setItem(STORAGE_KEYS.ALERT_HISTORY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('清除旧提醒历史失败:', error);
  }
}

export function clearAlertHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ALERT_HISTORY);
  } catch (error) {
    console.error('清除提醒历史失败:', error);
  }
}

// ==================== 提醒设置管理 ====================

export interface NotificationSettings {
  masterSwitch: boolean;
  priceAlert: boolean;
  positionAlert: boolean;
  watchlistAlert: boolean;
  smartRecommendation: boolean;
  tradingHoursOnly: boolean;
  maxAlertsPerDay: number;
  alertInterval: number; // 小时
  soundEnabled: boolean;
  browserNotification: boolean;
}

export function getNotificationSettings(): NotificationSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    return data ? JSON.parse(data) : getDefaultNotificationSettings();
  } catch (error) {
    console.error('获取提醒设置失败:', error);
    return getDefaultNotificationSettings();
  }
}

function getDefaultNotificationSettings(): NotificationSettings {
  return {
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
  };
}

export function updateNotificationSettings(settings: Partial<NotificationSettings>): boolean {
  try {
    const current = getNotificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('更新提醒设置失败:', error);
    return false;
  }
}

// ==================== 持仓管理 ====================

export interface Position {
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
  board?: string;        // 板块信息
  industry?: string;     // 行业信息
  notes?: string;        // 备注信息
  createdAt?: string;    // 创建时间
  updatedAt?: string;    // 更新时间
}

export function getPositions(): Position[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PORTFOLIO_POSITIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取持仓失败:', error);
    return [];
  }
}

export function savePositions(positions: Position[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_POSITIONS, JSON.stringify(positions));
  } catch (error) {
    console.error('保存持仓失败:', error);
  }
}

export function addPosition(position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): string {
  try {
    const positions = getPositions();
    
    const now = new Date().toISOString();
    const newPosition: Position = {
      ...position,
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };
    
    positions.push(newPosition);
    savePositions(positions);
    
    return newPosition.id;
  } catch (error) {
    console.error('添加持仓失败:', error);
    return '';
  }
}

export function removePosition(positionId: string): boolean {
  try {
    const positions = getPositions();
    const filtered = positions.filter(p => p.id !== positionId);
    savePositions(filtered);
    return true;
  } catch (error) {
    console.error('删除持仓失败:', error);
    return false;
  }
}

export function updatePosition(positionId: string, updates: Partial<Position>): boolean {
  try {
    const positions = getPositions();
    const position = positions.find(p => p.id === positionId);
    
    if (position) {
      Object.assign(position, updates, { updatedAt: new Date().toISOString() });
      savePositions(positions);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('更新持仓失败:', error);
    return false;
  }
}

export function clearPositions(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.PORTFOLIO_POSITIONS);
  } catch (error) {
    console.error('清除持仓失败:', error);
  }
}

// ==================== 自选股管理（提醒用） ====================

export interface WatchListStock {
  code: string;
  name: string;
  addedAt: string;
  monitorAbnormal: boolean;
  monitorSignal: boolean;
  lastPrice?: number;
  lastChange?: number;
}

export function getWatchList(): WatchListStock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST_STOCKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取自选股列表失败:', error);
    return [];
  }
}

export function saveWatchList(stocks: WatchListStock[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATCHLIST_STOCKS, JSON.stringify(stocks));
  } catch (error) {
    console.error('保存自选股列表失败:', error);
  }
}

export function addToWatchList(stock: Omit<WatchListStock, 'addedAt' | 'monitorAbnormal' | 'monitorSignal'>): boolean {
  try {
    const watchlist = getWatchList();
    
    // 检查是否已存在
    if (watchlist.some(s => s.code === stock.code)) {
      return false;
    }
    
    // 限制最多50只
    if (watchlist.length >= 50) {
      throw new Error('自选股数量已达上限（50只）');
    }
    
    const newStock: WatchListStock = {
      ...stock,
      addedAt: new Date().toISOString(),
      monitorAbnormal: true,
      monitorSignal: true
    };
    
    watchlist.push(newStock);
    saveWatchList(watchlist);
    return true;
  } catch (error) {
    console.error('添加自选股失败:', error);
    return false;
  }
}

export function removeFromWatchList(code: string): boolean {
  try {
    const watchlist = getWatchList();
    const filtered = watchlist.filter(s => s.code !== code);
    saveWatchList(filtered);
    return true;
  } catch (error) {
    console.error('删除自选股失败:', error);
    return false;
  }
}

export function updateWatchListStock(code: string, updates: Partial<WatchListStock>): boolean {
  try {
    const watchlist = getWatchList();
    const stock = watchlist.find(s => s.code === code);
    
    if (stock) {
      Object.assign(stock, updates);
      saveWatchList(watchlist);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('更新自选股失败:', error);
    return false;
  }
}

export function clearWatchList(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCHLIST_STOCKS);
  } catch (error) {
    console.error('清除自选股列表失败:', error);
  }
}
