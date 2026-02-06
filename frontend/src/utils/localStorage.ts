/**
 * 本地存储工具
 */

const STORAGE_KEYS = {
  FAVORITES: 'band_trading_favorites',
  HISTORY: 'band_trading_history',
  PRESETS: 'band_trading_presets',
  SETTINGS: 'band_trading_settings'
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
        isBandTradingMode: false
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
        isBandTradingMode: false
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
        isBandTradingMode: false
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
