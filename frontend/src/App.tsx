/**
 * 股票筛选器
 * 实现股票筛选和精选过滤功能
 */
import { useState, useRef, useEffect } from 'react';
import { screenStocks, screenBandTradingStocks, filterStocks, createCancelToken, updateMarginStocks } from './api/stock';
import type { ScreenedStock, FilteredStock, AnalysisResult, AISelectedStock, MarketEnvironment, FinalPick } from './api/stock';
import AIRadar from './components/AIRadar';
import StockCard from './components/StockCard';
import FilterPanel from './components/FilterPanel';
import type { FilterConfig } from './components/FilterPanel';
import FinalPickCard from './components/FinalPickCard';
import MarketEnvironmentComponent from './components/MarketEnvironment';
import FavoritesPanel from './components/FavoritesPanel';
import QuickFilters from './components/QuickFilters';
import StockComparison from './components/StockComparison';
import { addHistory } from './utils/localStorage';
import { getCachedScreenResult, setCachedScreenResult, clearScreenCache } from './utils/localStorage';
import { getSettings, toggleTheme } from './utils/localStorage';
import './App.css';

type AppState = 'idle' | 'screening' | 'screened' | 'filtering' | 'filtered';

function App() {
  const [state, setState] = useState<AppState>('idle');
  const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<FilteredStock[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [aiSelectedStocks, setAiSelectedStocks] = useState<AISelectedStock[]>([]);
  const [marketEnv, setMarketEnv] = useState<MarketEnvironment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalPick, setFinalPick] = useState<FinalPick | null>(null);
  const [finalPicks, setFinalPicks] = useState<FinalPick[]>([]);  // 新增：Top3候选
  const [selectedPickIndex, setSelectedPickIndex] = useState<number>(0);  // 新增：当前选中的候选
  const [showFinalPick, setShowFinalPick] = useState<boolean>(false);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    changeMin: -2,      // 波段交易：允许回调
    changeMax: 5,       // 不追涨
    volumeRatioMin: 1.5,
    volumeRatioMax: 3,
    marketCapMin: 50,
    marketCapMax: 160,  // 市值上限160亿
    includeKcbCyb: true,
    requireMargin: true,  // 必须融资融券
    preferTailInflow: true,
    strictRiskControl: true,
    isBandTradingMode: true,  // 波段交易模式
  });

  const {
    isBandTradingMode, changeMin, changeMax, volumeRatioMin, volumeRatioMax,
    marketCapMin, marketCapMax, includeKcbCyb, requireMargin, preferTailInflow, strictRiskControl
  } = filterConfig;

  // Helper setters for filterConfig
  const setFilterConfigValue = (key: keyof FilterConfig, value: any) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
  };
  const setIsBandTradingMode = (val: boolean) => setFilterConfigValue('isBandTradingMode', val);
  const setChangeMin = (val: number) => setFilterConfigValue('changeMin', val);
  const setChangeMax = (val: number) => setFilterConfigValue('changeMax', val);
  const setVolumeRatioMin = (val: number) => setFilterConfigValue('volumeRatioMin', val);
  const setVolumeRatioMax = (val: number) => setFilterConfigValue('volumeRatioMax', val);
  const setMarketCapMin = (val: number) => setFilterConfigValue('marketCapMin', val);
  const setMarketCapMax = (val: number) => setFilterConfigValue('marketCapMax', val);
  const setIncludeKcbCyb = (val: boolean) => setFilterConfigValue('includeKcbCyb', val);
  const setPreferTailInflow = (val: boolean) => setFilterConfigValue('preferTailInflow', val);
  const setStrictRiskControl = (val: boolean) => setFilterConfigValue('strictRiskControl', val);

  const [filterProgress, setFilterProgress] = useState<string>(''); // 新增：过滤进度提示
  const [isScreenedCollapsed, setIsScreenedCollapsed] = useState<boolean>(false); // 新增：初步筛选结果是否折叠
  const [isUpdatingMargin, setIsUpdatingMargin] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false); // 新增：显示自选股面板
  const [sortBy, setSortBy] = useState<'default' | 'change' | 'ratio' | 'inflow' | 'cap'>('default'); // 排序方式
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // 排序顺序
  const [showSavePreset, setShowSavePreset] = useState<boolean>(false); // 显示保存预设对话框
  const [searchKeyword, setSearchKeyword] = useState<string>(''); // 搜索关键词
  const [theme, setTheme] = useState<'light' | 'dark'>(getSettings().theme); // 主题
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set()); // 批量选中的股票

  // 取消请求的控制器
  const cancelTokenSource = useRef<any>(null);

  // Config moved to filterConfig

  // 更新融资融券数据
  const handleUpdateMargin = async () => {
      setIsUpdatingMargin(true);
      try {
          const result = await updateMarginStocks();
          alert(`✅ 更新成功！\n${result.message}`);
      } catch (err: any) {
          alert(`❌ 更新失败：${err.message || '未知错误'}`);
      } finally {
          setIsUpdatingMargin(false);
      }
  };

  // 筛选股票
  const handleScreen = async () => {
    setState('screening');
    setError(null);
    setFilteredStocks([]);
    setAnalysisResults([]);
    setMarketEnv(null);  // 清除旧的市场环境数据
    setFilterProgress('正在获取全市场数据...');

    // 检查缓存
    const cached = getCachedScreenResult(filterConfig);
    if (cached) {
      console.log('✅ 使用缓存数据');
      setFilterProgress('');
      setScreenedStocks(cached.stocks);
      if (cached.marketEnv) {
        setMarketEnv(cached.marketEnv as any);
      }
      setState('screened');
      return;
    }

    try {
      let result;
      if (isBandTradingMode) {
         result = await screenBandTradingStocks({
          change_min: changeMin,
          change_max: changeMax,
          volume_ratio_min: volumeRatioMin,
          volume_ratio_max: volumeRatioMax,
          market_cap_max: marketCapMax,
          limit: 3,
        });
      } else {
        result = await screenStocks({
          change_min: changeMin,
          change_max: changeMax,
          volume_ratio_min: volumeRatioMin,
          volume_ratio_max: volumeRatioMax,
          market_cap_min: marketCapMin,
          market_cap_max: marketCapMax,
          limit: 30,
          include_cyb: includeKcbCyb,
          require_margin: requireMargin,
        });
      }
      setFilterProgress('');
      setScreenedStocks(result.data);
      // 设置市场环境数据（如果有）
      if (result.market_environment) {
        setMarketEnv(result.market_environment as any);
      }
      // 保存到缓存
      setCachedScreenResult(filterConfig, result.data, result.market_environment);
      // 添加到历史记录
      addHistory(filterConfig, result.data.length, result.market_environment);
      setState('screened');
    } catch (err: any) {
      setFilterProgress('');
      setError(err.response?.data?.detail || '筛选失败，请稍后重试');
      setState('idle');
    }
  };

  // 过滤精选股票
  const handleFilter = async () => {
    if (screenedStocks.length === 0) return;

    setState('filtering');
    setError(null);
    setFilterProgress('正在初始化分析...');

    // 创建取消令牌
    cancelTokenSource.current = createCancelToken();

    // 模拟进度更新
    const progressTimer = setInterval(() => {
      setFilterProgress(prev => {
        const tips = [
          '正在获取实时行情数据...',
          '正在分析K线走势...',
          '正在计算资金流向...',
          '正在检测技术指标...',
          '正在评估风险因素...',
          '正在进行AI综合评分...',
          '正在生成交易计划...',
          '即将完成分析...',
        ];
        const currentIndex = tips.indexOf(prev);
        return currentIndex < tips.length - 1 ? tips[currentIndex + 1] : tips[tips.length - 1];
      });
    }, 8000); // 每8秒更新一次提示

    try {
      const codes = screenedStocks.map(s => s.code);
      const result = await filterStocks(
        codes,
        includeKcbCyb,
        preferTailInflow,
        strictRiskControl,
        cancelTokenSource.current.token
      );

      clearInterval(progressTimer);
      setFilterProgress('');

      setFilteredStocks(result.data);
      setAnalysisResults(result.all_analysis);
      setAiSelectedStocks(result.ai_selected || []);
      setMarketEnv(result.market_environment || null);
      setFinalPick(result.final_pick || null);
      setFinalPicks(result.final_picks || []);  // 新增：获取Top3候选
      setSelectedPickIndex(0);  // 新增：默认选中第一个
      setShowFinalPick(false);
      setIsScreenedCollapsed(true);  // 新增：精选完成后折叠初步筛选结果
      setState('filtered');
    } catch (err: any) {
      clearInterval(progressTimer);
      setFilterProgress('');

      if (err.message === 'Cancel') {
        setError('分析已取消');
      } else {
        setError(err.response?.data?.detail || '过滤失败，请稍后重试。提示：如果股票数量较多，分析可能需要1-3分钟');
      }
      setState('screened');
    }
  };

  // 取消过滤
  const handleCancelFilter = () => {
    if (cancelTokenSource.current) {
      cancelTokenSource.current.cancel('Cancel');
      setFilterProgress('');
      setState('screened');
    }
  };

  // 重置
  const handleReset = () => {
    setState('idle');
    setScreenedStocks([]);
    setFilteredStocks([]);
    setAnalysisResults([]);
    setAiSelectedStocks([]);
    setMarketEnv(null);
    setError(null);
    setFinalPick(null);
    setFinalPicks([]);  // 新增：重置Top3候选
    setSelectedPickIndex(0);  // 新增：重置选中索引
    setShowFinalPick(false);
    setIsScreenedCollapsed(false);  // 新增：重置时展开初步筛选结果
  };

  // 格式化金额
  const formatAmount = (amount: number): string => {
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(2) + '亿';
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toFixed(2);
  };

  // 计算统计数据
  const getStatistics = () => {
    if (screenedStocks.length === 0) return null;
    
    const avgChange = screenedStocks.reduce((sum, s) => sum + s.change_percent, 0) / screenedStocks.length;
    const avgRatio = screenedStocks.reduce((sum, s) => sum + s.volume_ratio, 0) / screenedStocks.length;
    const avgCap = screenedStocks.reduce((sum, s) => sum + s.market_cap, 0) / screenedStocks.length;
    const totalInflow = screenedStocks.reduce((sum, s) => sum + (s.main_inflow ?? 0), 0);
    const inflowCount = screenedStocks.filter(s => (s.main_inflow ?? 0) > 0).length;
    
    return {
      avgChange: avgChange.toFixed(2),
      avgRatio: avgRatio.toFixed(2),
      avgCap: avgCap.toFixed(1),
      totalInflow: totalInflow.toFixed(2),
      inflowCount,
      inflowRate: ((inflowCount / screenedStocks.length) * 100).toFixed(1)
    };
  };

  // 排序股票列表
  const getSortedStocks = () => {
    let stocks = screenedStocks;
    
    // 先应用搜索过滤
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      stocks = stocks.filter(s => 
        s.name.toLowerCase().includes(keyword) || 
        s.code.includes(keyword)
      );
    }
    
    // 再应用排序
    if (sortBy === 'default') return stocks;
    
    const sorted = [...stocks].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'change':
          compareValue = a.change_percent - b.change_percent;
          break;
        case 'ratio':
          compareValue = a.volume_ratio - b.volume_ratio;
          break;
        case 'inflow':
          compareValue = (a.main_inflow ?? 0) - (b.main_inflow ?? 0);
          break;
        case 'cap':
          compareValue = a.market_cap - b.market_cap;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
    
    return sorted;
  };

  // 切换排序
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // 保存自定义预设
  const handleSavePreset = () => {
    const presetName = prompt('请输入预设名称：');
    if (!presetName) return;
    
    const presetDesc = prompt('请输入预设描述（可选）：') || '';
    
    const success = import('./utils/localStorage').then(({ addPreset }) => {
      return addPreset({
        name: presetName,
        description: presetDesc,
        config: filterConfig
      });
    });
    
    success.then(result => {
      if (result) {
        alert('✅ 预设保存成功！');
      } else {
        alert('❌ 预设保存失败');
      }
    });
  };

  // 清除缓存
  const handleClearCache = () => {
    if (confirm('确定要清除所有缓存数据吗？\n这将清除筛选结果缓存，但不会影响自选股和历史记录。')) {
      clearScreenCache();
      alert('✅ 缓存已清除！');
    }
  };

  // 切换主题
  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // 批量选择
  const handleSelectStock = (code: string) => {
    const newSelected = new Set(selectedStocks);
    if (newSelected.has(code)) {
      newSelected.delete(code);
    } else {
      newSelected.add(code);
    }
    setSelectedStocks(newSelected);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedStocks.size === getSortedStocks().length) {
      setSelectedStocks(new Set());
    } else {
      setSelectedStocks(new Set(getSortedStocks().map(s => s.code)));
    }
  };

  // 批量添加到自选
  const handleBatchAddToFavorites = () => {
    if (selectedStocks.size === 0) {
      alert('请先选择股票');
      return;
    }
    
    import('./utils/localStorage').then(({ addFavorite }) => {
      let successCount = 0;
      const stocks = getSortedStocks().filter(s => selectedStocks.has(s.code));
      
      stocks.forEach(stock => {
        if (addFavorite({ code: stock.code, name: stock.name })) {
          successCount++;
        }
      });
      
      alert(`✅ 成功添加 ${successCount} 只股票到自选！`);
      setSelectedStocks(new Set());
    });
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter: 开始筛选
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (state === 'idle' || state === 'screened') {
          handleScreen();
        }
      }
      
      // Ctrl/Cmd + F: 精选过滤
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (state === 'screened' && screenedStocks.length > 0) {
          handleFilter();
        }
      }
      
      // Ctrl/Cmd + R: 重置
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (state !== 'idle') {
          handleReset();
        }
      }
      
      // Esc: 取消分析
      if (e.key === 'Escape') {
        if (state === 'filtering') {
          handleCancelFilter();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, screenedStocks.length]);

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div className="app">
      {/* 头部 */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <h1>股票智能筛选器</h1>
            <span style={{
              marginLeft: '10px',
              padding: '2px 8px',
              fontSize: '12px',
              background: '#52c41a',
              color: 'white',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              v4.6.0
            </span>
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              fontSize: '11px',
              background: '#1890ff',
              color: 'white',
              borderRadius: '4px'
            }} title="使用AKShare真实数据">
              ✅ 真实数据
            </span>
            <button 
                onClick={() => setShowFavorites(true)} 
                style={{
                    marginLeft: '15px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #faad14',
                    background: '#fffbe6',
                    color: '#faad14',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                ⭐ 我的自选
            </button>
            <button 
                onClick={handleUpdateMargin} 
                disabled={isUpdatingMargin}
                style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    background: '#fff',
                    cursor: isUpdatingMargin ? 'not-allowed' : 'pointer'
                }}
            >
                {isUpdatingMargin ? '更新中...' : '🔄 刷新数据'}
            </button>
            <button 
                onClick={handleClearCache}
                style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #ff4d4f',
                    background: '#fff',
                    color: '#ff4d4f',
                    cursor: 'pointer'
                }}
                title="清除筛选结果缓存"
            >
                🗑️ 清除缓存
            </button>
            <button 
                onClick={handleToggleTheme}
                style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    background: '#fff',
                    cursor: 'pointer'
                }}
                title="切换深色/浅色模式"
            >
                {theme === 'light' ? '🌙 深色' : '☀️ 浅色'}
            </button>
          </div>
          <p className="tagline">基于量价分析的A股精选系统 v4.6.0 | 免费真实数据版</p>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="app-main">
        {/* 快捷筛选 */}
        <QuickFilters onApplyPreset={(config) => {
          setFilterConfig(prev => ({ ...prev, ...config }));
        }} />

        {/* 筛选条件说明 */}
        <section className="criteria-section">
          <div className="criteria-card screen-criteria">
            <div className="criteria-header">
              <span className="criteria-icon">🔍</span>
              <h3>第一步：初步筛选</h3>
            </div>
            
            <div className="mode-toggle" style={{ marginBottom: '15px', padding: '0 15px' }}>
              <div style={{ display: 'flex', gap: '10px', background: '#f5f5f5', padding: '4px', borderRadius: '6px' }}>
                 <button
                   onClick={() => {
                     setIsBandTradingMode(false);
                     setChangeMin(2); setChangeMax(6); setMarketCapMax(350);
                   }}
                   style={{
                     flex: 1,
                     padding: '6px',
                     border: 'none',
                     borderRadius: '4px',
                     background: !isBandTradingMode ? '#fff' : 'transparent',
                     boxShadow: !isBandTradingMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                     cursor: 'pointer',
                     fontWeight: !isBandTradingMode ? 'bold' : 'normal',
                     color: !isBandTradingMode ? '#1677ff' : '#666'
                   }}
                 >
                   默认模式
                 </button>
                 <button
                   onClick={() => {
                     setIsBandTradingMode(true);
                     setChangeMin(-2); setChangeMax(5); setMarketCapMax(160);
                   }}
                   style={{
                     flex: 1,
                     padding: '6px',
                     border: 'none',
                     borderRadius: '4px',
                     background: isBandTradingMode ? '#fff' : 'transparent',
                     boxShadow: isBandTradingMode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                     cursor: 'pointer',
                     fontWeight: isBandTradingMode ? 'bold' : 'normal',
                     color: isBandTradingMode ? '#1677ff' : '#666'
                   }}
                 >
                   波段交易
                 </button>
              </div>
            </div>

            <div className="criteria-list">
              <div className="criteria-item">
                <span className="label">涨幅范围</span>
                <span className="value">
                  <input
                    type="number"
                    className="criteria-input"
                    value={changeMin}
                    onChange={(e) => setChangeMin(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                  <span className="divider">%-</span>
                  <input
                    type="number"
                    className="criteria-input"
                    value={changeMax}
                    onChange={(e) => setChangeMax(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                  <span className="unit">%</span>
                </span>
              </div>
              <div className="criteria-item">
                <span className="label">量比范围</span>
                <span className="value">
                  <input
                    type="number"
                    step="0.1"
                    className="criteria-input"
                    value={volumeRatioMin}
                    onChange={(e) => setVolumeRatioMin(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                  <span className="divider">-</span>
                  <input
                    type="number"
                    step="0.1"
                    className="criteria-input"
                    value={volumeRatioMax}
                    onChange={(e) => setVolumeRatioMax(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                </span>
              </div>
              <div className="criteria-item">
                <span className="label">流通市值</span>
                <span className="value">
                  <input
                    type="number"
                    className="criteria-input"
                    value={marketCapMin}
                    onChange={(e) => setMarketCapMin(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering' || isBandTradingMode}
                  />
                  <span className="divider">-</span>
                  <input
                    type="number"
                    className="criteria-input"
                    value={marketCapMax}
                    onChange={(e) => setMarketCapMax(Number(e.target.value) || 0)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                  <span className="unit">亿</span>
                </span>
              </div>
              <div className="criteria-item toggle-item">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={includeKcbCyb}
                    onChange={(e) => setFilterConfigValue('includeKcbCyb', e.target.checked)}
                    disabled={state === 'screening' || state === 'filtering' || isBandTradingMode}
                  />
                  <span className="toggle-text">包含创业板（排除科创板）</span>
                </label>
              </div>
              
              <div className="criteria-item toggle-item">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={requireMargin}
                    onChange={(e) => setFilterConfigValue('requireMargin', e.target.checked)}
                    disabled={state === 'screening' || state === 'filtering' || isBandTradingMode}
                  />
                  <span className="toggle-text">要求融资融券标的</span>
                </label>
              </div>
              <div className="criteria-item toggle-item">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={preferTailInflow}
                    onChange={(e) => setPreferTailInflow(e.target.checked)}
                    disabled={state === 'screening' || state === 'filtering' || isBandTradingMode}
                  />
                  <span className="toggle-text">尾盘30分钟主力净流入为正（默认）</span>
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className={`action-btn screen-btn ${state === 'screening' ? 'loading' : ''}`}
                onClick={handleScreen}
                disabled={state === 'screening' || state === 'filtering'}
                style={{ flex: 1 }}
              >
                {state === 'screening' ? (
                  <>
                    <span className="spinner"></span>
                    {filterProgress || '筛选中...'}
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🎯</span>
                    开始筛选
                  </>
                )}
              </button>
              <button
                onClick={handleSavePreset}
                disabled={state === 'screening' || state === 'filtering'}
                style={{
                  padding: '10px 15px',
                  fontSize: '14px',
                  borderRadius: '6px',
                  border: '1px solid #52c41a',
                  background: '#fff',
                  color: '#52c41a',
                  cursor: state === 'screening' || state === 'filtering' ? 'not-allowed' : 'pointer',
                  opacity: state === 'screening' || state === 'filtering' ? 0.5 : 1
                }}
                title="保存当前筛选条件为预设"
              >
                💾 保存预设
              </button>
            </div>
            
            {/* 筛选进度提示 */}
            {state === 'screening' && filterProgress && (
              <div className="progress-tip loading-pulse" style={{ marginTop: '10px' }}>
                <span className="progress-icon">⏳</span>
                <span>{filterProgress}</span>
                <span className="progress-note">（预计 8-12 秒）</span>
              </div>
            )}
          </div>

          <div className="criteria-arrow">→</div>

          <div className={`criteria-card filter-criteria ${screenedStocks.length === 0 ? 'disabled' : ''}`}>
            <div className="criteria-header">
              <span className="criteria-icon">⚡</span>
              <h3>第二步：精选过滤</h3>
            </div>
            <div className="criteria-list">
              <div className="criteria-item">
                <span className="label">量价形态</span>
                <span className="value">阶梯式放量</span>
              </div>
              <div className="criteria-item">
                <span className="label">技术位置</span>
                <span className="value">站稳5日线+近期高点</span>
              </div>
              <div className="criteria-item">
                <span className="label">热门板块</span>
                <span className="value">优先数字经济（加分项）</span>
              </div>
              <div className="criteria-item toggle-item">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={strictRiskControl}
                    onChange={(e) => setStrictRiskControl(e.target.checked)}
                    disabled={state === 'screening' || state === 'filtering'}
                  />
                  <span className="toggle-text">阶段涨幅 + 集中度限制（默认）</span>
                </label>
              </div>
            </div>

            {/* 过滤按钮和取消按钮 */}
            <div className="action-buttons">
              <button
                className={`action-btn filter-btn ${state === 'filtering' ? 'loading' : ''}`}
                onClick={handleFilter}
                disabled={screenedStocks.length === 0 || state === 'filtering' || state === 'screening'}
              >
                {state === 'filtering' ? (
                  <>
                    <span className="spinner"></span>
                    分析中...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✨</span>
                    精选过滤
                  </>
                )}
              </button>

              {/* 取消按钮 */}
              {state === 'filtering' && (
                <button
                  className="action-btn cancel-btn"
                  onClick={handleCancelFilter}
                >
                  <span className="btn-icon">⏹</span>
                  取消分析
                </button>
              )}

              {/* 最终精选按钮 */}
              {finalPick && state === 'filtered' && (
                <button
                  className="action-btn final-pick-btn"
                  onClick={() => setShowFinalPick(true)}
                >
                  <span className="btn-icon">🏆</span>
                  最终精选一只标的
                </button>
              )}
            </div>

            {/* 进度提示 */}
            {filterProgress && (
              <div className="progress-tip loading-pulse">
                <span className="progress-icon">⏳</span>
                <span>{filterProgress}</span>
                <span className="progress-note">（预计需要 1-3 分钟，请耐心等待）</span>
              </div>
            )}
          </div>
        </section>

        {/* 市场环境分析 */}
        {marketEnv && (
          <MarketEnvironmentComponent data={marketEnv} />
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button 
              onClick={() => {
                setError(null);
                if (state === 'idle' || state === 'screened') {
                  handleScreen();
                }
              }} 
              className="retry-btn"
              style={{
                marginLeft: '10px',
                padding: '4px 12px',
                fontSize: '13px',
                borderRadius: '4px',
                border: '1px solid #1890ff',
                background: '#fff',
                color: '#1890ff',
                cursor: 'pointer'
              }}
            >
              🔄 重试
            </button>
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {/* 最终Top3精选候选 */}
        {showFinalPick && finalPicks.length > 0 && (
          <section className="results-section featured">
            <div className="section-header">
              <h2>
                <span className="section-icon">🎯</span>
                最终精选候选（T+1 短线）
                <span className="count-badge">Top {finalPicks.length}</span>
                {finalPicks.some(p => p.is_hot_industry) && (
                  <span className="hot-industry-note" title="包含主力资金抢筹热门行业股票">
                    🔥 含热门行业
                  </span>
                )}
              </h2>
              <button
                className="reset-btn"
                onClick={() => setShowFinalPick(false)}
              >
                收起
              </button>
            </div>

            {/* 候选切换按钮 */}
            {finalPicks.length > 1 && (
              <div className="pick-tabs">
                {finalPicks.map((pick, index) => (
                  <button
                    key={pick.code}
                    className={`pick-tab ${selectedPickIndex === index ? 'active' : ''} ${pick.is_hot_industry ? 'hot-tab' : ''}`}
                    onClick={() => setSelectedPickIndex(index)}
                  >
                    <span className="tab-rank">#{pick.rank || index + 1}</span>
                    <span className="tab-name">{pick.name}</span>
                    <span className="tab-score">评分 {pick.score}</span>
                    {pick.source_label && (
                      <span className={`tab-source ${pick.source === 'ai' ? 'tab-source-ai' : 'tab-source-technical'}`}>
                        {pick.source === 'ai' ? '🤖' : '📊'}
                      </span>
                    )}
                    {pick.is_hot_industry && (
                      <span className="tab-hot" title="主力资金抢筹热门行业">
                        🔥
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="featured-grid">
              <FinalPickCard pick={finalPicks[selectedPickIndex]} />
            </div>
          </section>
        )}

        {/* 筛选结果 */}
        {screenedStocks.length > 0 && (
          <section className="results-section">
            {/* 统计面板 */}
            {getStatistics() && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>📊 筛选结果统计</h3>
                  <span style={{ fontSize: '12px', opacity: 0.9 }}>共 {screenedStocks.length} 只股票</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>平均涨幅</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getStatistics()?.avgChange}%</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>平均量比</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getStatistics()?.avgRatio}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>平均市值</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getStatistics()?.avgCap}亿</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>资金净流入</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getStatistics()?.totalInflow}亿</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>资金流入率</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{getStatistics()?.inflowRate}%</div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="section-header">
              <h2>
                <span className="section-icon">📋</span>
                初步筛选结果
                <span className="count-badge">{getSortedStocks().length}只</span>
                {searchKeyword && <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>（已过滤）</span>}
              </h2>
              <div className="header-actions">
                {/* 搜索框 */}
                <input
                  type="text"
                  placeholder="🔍 搜索股票名称或代码..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    borderRadius: '4px',
                    border: '1px solid #d9d9d9',
                    outline: 'none',
                    width: '200px',
                    marginRight: '10px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1890ff'}
                  onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
                />
                
                {/* 排序按钮 */}
                <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
                  <button
                    onClick={() => handleSort('change')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: sortBy === 'change' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                      background: sortBy === 'change' ? '#e6f7ff' : '#fff',
                      color: sortBy === 'change' ? '#1890ff' : '#666',
                      cursor: 'pointer'
                    }}
                    title="按涨跌幅排序"
                  >
                    涨幅 {sortBy === 'change' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSort('ratio')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: sortBy === 'ratio' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                      background: sortBy === 'ratio' ? '#e6f7ff' : '#fff',
                      color: sortBy === 'ratio' ? '#1890ff' : '#666',
                      cursor: 'pointer'
                    }}
                    title="按量比排序"
                  >
                    量比 {sortBy === 'ratio' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSort('inflow')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: sortBy === 'inflow' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                      background: sortBy === 'inflow' ? '#e6f7ff' : '#fff',
                      color: sortBy === 'inflow' ? '#1890ff' : '#666',
                      cursor: 'pointer'
                    }}
                    title="按主力净流入排序"
                  >
                    资金 {sortBy === 'inflow' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button
                    onClick={() => handleSort('cap')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: sortBy === 'cap' ? '1px solid #1890ff' : '1px solid #d9d9d9',
                      background: sortBy === 'cap' ? '#e6f7ff' : '#fff',
                      color: sortBy === 'cap' ? '#1890ff' : '#666',
                      cursor: 'pointer'
                    }}
                    title="按市值排序"
                  >
                    市值 {sortBy === 'cap' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
                <button
                  className="collapse-btn"
                  onClick={() => setIsScreenedCollapsed(!isScreenedCollapsed)}
                  title={isScreenedCollapsed ? '展开列表' : '折叠列表'}
                >
                  {isScreenedCollapsed ? '📂 展开' : '📁 折叠'}
                </button>
                <button
                  className="export-btn"
                  onClick={() => {
                    import('./utils/exportData').then(({ exportToCSV }) => {
                      exportToCSV(screenedStocks, `波段交易筛选_${new Date().toLocaleDateString()}.csv`);
                    });
                  }}
                  title="导出为CSV"
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #1890ff',
                    background: '#fff',
                    color: '#1890ff',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  📥 导出CSV
                </button>
                <button
                  className="copy-btn"
                  onClick={() => {
                    import('./utils/exportData').then(({ copyStockCodes }) => {
                      copyStockCodes(screenedStocks);
                    });
                  }}
                  title="复制股票代码"
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    borderRadius: '4px',
                    border: '1px solid #52c41a',
                    background: '#fff',
                    color: '#52c41a',
                    cursor: 'pointer',
                    marginLeft: '8px'
                  }}
                >
                  📋 复制代码
                </button>
                {state !== 'idle' && (
                  <button className="reset-btn" onClick={handleReset}>
                    重新开始
                  </button>
                )}
              </div>
            </div>

            {isBandTradingMode ? (
              <div className="beginner-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px'}}>
                {getSortedStocks().map((stock) => (
                  <StockCard key={stock.code} stock={stock} />
                ))}
              </div>
            ) : (
            <div className={`stock-table ${isScreenedCollapsed ? 'collapsed' : ''}`}>
              <div className="table-header">
                <span className="col-index">#</span>
                <span className="col-name">股票名称</span>
                <span className="col-price">最新价</span>
                <span className="col-change">涨跌幅</span>
                <span className="col-ratio">量比</span>
                <span className="col-inflow">主力净流入(亿)</span>
                <span className="col-cap">流通市值</span>
                <span className="col-turnover">换手率</span>
                <span className="col-amount">成交额</span>
                <span className="col-risk">风险</span>
                <span className="col-action">建议</span>
              </div>
              <div className="table-body">
                {getSortedStocks().map((stock, index) => (
                  <div
                    key={stock.code}
                    className={`table-row ${analysisResults.find(a => a.code === stock.code)?.qualified ? 'qualified' : ''
                      }`}
                  >
                    <span className="col-index">{index + 1}</span>
                    <span className="col-name">
                      <span className="stock-name">{stock.name}</span>
                      <span className="stock-code">{stock.code}</span>
                    </span>
                    <span className="col-price">{stock.price.toFixed(2)}</span>
                    <span className="col-change up">+{stock.change_percent.toFixed(2)}%</span>
                    <span className="col-ratio">{stock.volume_ratio.toFixed(2)}</span>
                    <span className="col-inflow">{(stock.main_inflow ?? 0).toFixed(2)}</span>
                    <span className="col-cap">{stock.market_cap.toFixed(1)}亿</span>
                    <span className="col-turnover">{stock.turnover.toFixed(2)}%</span>
                    <span className="col-amount">{formatAmount(stock.amount)}</span>
                    <span className={`col-risk ${stock.operation_suggestion?.risk_level === '高' ? 'risk-high' : (stock.operation_suggestion?.risk_level === '低' ? 'risk-low' : 'risk-medium')}`}>
                        {stock.operation_suggestion?.risk_level || '-'}
                    </span>
                    <span className={`col-action ${stock.operation_suggestion?.action === '强烈推荐' ? 'action-strong' : 'action-normal'}`}>
                        {stock.operation_suggestion?.action || '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            )}
          </section>
        )}

        {/* 股票对比分析 */}
        {screenedStocks.length > 0 && screenedStocks.length <= 5 && (
          <StockComparison stocks={screenedStocks} />
        )}

        {/* 精选结果 */}
        {filteredStocks.length > 0 && (
          <section className="results-section featured">
            <div className="section-header">
              <h2>
                <span className="section-icon">🏆</span>
                精选股票
                <span className="count-badge gold">{filteredStocks.length}只</span>
              </h2>
            </div>

            <div className="featured-grid">
              {filteredStocks.map((stock, index) => (
                <div key={stock.code} className="featured-card">
                  <div className="card-rank">#{index + 1}</div>
                  <div className="card-header">
                    <div className="stock-info">
                      <span className="stock-name">{stock.name}</span>
                      <span className="stock-code">{stock.code}</span>
                      {/* 新增：来源标签 */}
                      {stock.source_label && (
                        <span
                          className={`source-tag ${stock.source === 'ai' ? 'source-ai' : 'source-technical'}`}
                          title={stock.source === 'ai' ? '基于12维度AI综合评分' : '基于技术指标筛选补充'}
                        >
                          {stock.source_label}
                        </span>
                      )}
                      {/* 新增：热门行业标识 */}
                      {stock.is_hot_industry && (
                        <span
                          className="hot-industry-tag"
                          title={`所属行业(${stock.concepts?.join('/')})近30分钟主力资金大幅抢筹`}
                        >
                          🔥
                        </span>
                      )}
                      {stock.board_type && (
                        <span
                          className="board-tag"
                          style={{ backgroundColor: stock.board_type.color }}
                          title={stock.board_type.risk_note}
                        >
                          {stock.board_type.name}
                        </span>
                      )}
                    </div>
                    <div className="stock-price">
                      <span className="price">{stock.price.toFixed(2)}</span>
                      <span className="change up">+{stock.change_percent.toFixed(2)}%</span>
                    </div>
                  </div>
                  {/* 新增：行业概念信息 */}
                  {stock.concepts && stock.concepts.length > 0 && (
                    <div className="card-concepts">
                      <span className="concepts-label">所属行业：</span>
                      <div className="concepts-tags">
                        {stock.concepts.map((concept, idx) => (
                          <span key={idx} className="concept-tag">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* 数据时间信息 */}
                  {stock.minute_volume && (
                    <div className="data-time-info">
                      <span className="time-icon">🕐</span>
                      <span className="time-label">数据时间:</span>
                      <span className="time-value">{stock.minute_volume.time_range}</span>
                      {stock.minute_volume.is_after_close && (
                        <span className="close-badge">已收盘</span>
                      )}
                      <span className="fetch-time">获取于 {stock.minute_volume.fetch_time}</span>
                    </div>
                  )}

                  <div className="card-metrics">
                    <div className="metric">
                      <span className="metric-label">量比</span>
                      <span className="metric-value">{stock.volume_ratio.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">市值</span>
                      <span className="metric-value">{stock.market_cap.toFixed(1)}亿</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">5日均线</span>
                      <span className="metric-value">{stock.ma5.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">支撑位</span>
                      <span className="metric-value">{stock.support_level.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="card-analysis">
                    <div className="analysis-item">
                      <span className={stock.analysis.volume_pattern.includes('✓') ? 'pass' : 'fail'}>
                        {stock.analysis.volume_pattern}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className={stock.analysis.price_position.includes('✓') ? 'pass' : 'fail'}>
                        {stock.analysis.price_position}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className={stock.analysis.sector.includes('✓') ? 'pass' : 'fail'}>
                        {stock.analysis.sector}
                      </span>
                    </div>
                  </div>

                  {/* 30分钟成交量趋势图 */}
                  {stock.minute_volume && stock.minute_volume.data && stock.minute_volume.data.length > 0 && (
                    <div className="volume-chart">
                      <div className="chart-header">
                        <span className="chart-title">📊 尾盘行情</span>
                        <span className="chart-time">
                          {stock.minute_volume.time_range}
                          {stock.minute_volume.is_after_close && (
                            <span className="fetch-time"> (已收盘，获取于 {stock.minute_volume.fetch_time})</span>
                          )}
                        </span>
                      </div>
                      {/* 价格区间显示 */}
                      {(() => {
                        const data = stock.minute_volume.data;
                        const prices = data.map(m => m.price);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const firstPrice = data[0].price;
                        const lastPrice = data[data.length - 1].price;
                        const priceChange = lastPrice - firstPrice;
                        return (
                          <div className="price-summary">
                            <span className="price-range">
                              价格区间: {minPrice.toFixed(2)} - {maxPrice.toFixed(2)}
                            </span>
                            <span className={`price-change ${priceChange >= 0 ? 'up' : 'down'}`}>
                              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                      {/* 价格折线 + 成交量柱状图 */}
                      <div className="chart-wrapper">
                        {(() => {
                          const data = stock.minute_volume.data;
                          const prices = data.map(m => m.price);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          const priceRange = maxPrice - minPrice || 1;
                          const maxVolume = Math.max(...data.map(m => m.volume));

                          // 生成价格折线的SVG路径
                          const points = data.map((m, idx) => {
                            const x = (idx / (data.length - 1)) * 100;
                            const y = 100 - ((m.price - minPrice) / priceRange) * 100;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <>
                              {/* 成交量柱状图 */}
                              <div className="chart-container">
                                {data.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className="volume-bar"
                                    style={{
                                      height: `${maxVolume > 0 ? (m.volume / maxVolume) * 100 : 0}%`,
                                      opacity: 0.3 + (idx / data.length) * 0.5
                                    }}
                                    title={`${m.time}\n价格: ${m.price.toFixed(2)}\n成交量: ${m.volume}手`}
                                  />
                                ))}
                              </div>
                              {/* 价格折线叠加 */}
                              <svg className="price-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke="var(--color-gold)"
                                  strokeWidth="2"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                            </>
                          );
                        })()}
                      </div>
                      <div className="chart-labels">
                        <span>{stock.minute_volume.data[0]?.time}</span>
                        <span className="chart-legend">
                          <span className="legend-volume">■ 成交量</span>
                          <span className="legend-price">— 价格</span>
                        </span>
                        <span>{stock.minute_volume.data[stock.minute_volume.data.length - 1]?.time}</span>
                      </div>
                    </div>
                  )}

                  {/* 利空消息提示 */}
                  {stock.negative_news && (
                    <div className={`news-alert ${stock.negative_news.risk_level}`}>
                      <div className="news-alert-header">
                        <span className="news-icon">
                          {stock.negative_news.has_negative_news ? '⚠️' : '✅'}
                        </span>
                        <span className="news-title">
                          {stock.negative_news.has_negative_news
                            ? `发现 ${stock.negative_news.negative_count} 条利空消息`
                            : '近3日无利空消息'}
                        </span>
                        <span className={`risk-badge ${stock.negative_news.risk_level}`}>
                          {stock.negative_news.risk_level === 'high' ? '高风险' :
                            stock.negative_news.risk_level === 'medium' ? '需关注' : '低风险'}
                        </span>
                      </div>
                      {stock.negative_news.negative_news.length > 0 && (
                        <div className="news-list">
                          {stock.negative_news.negative_news.slice(0, 3).map((news, idx) => (
                            <div key={idx} className="news-item">
                              <span className="news-date">{news.date}</span>
                              <span className="news-text">{news.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* AI精选股票 */}
        {aiSelectedStocks.length > 0 && (
          <section className="results-section ai-featured">
            <div className="section-header">
              <h2>
                <span className="section-icon">🤖</span>
                AI智能精选
                <span className="count-badge ai">{aiSelectedStocks.length}只</span>
              </h2>
              {marketEnv && (
                <div className={`market-status ${marketEnv.safe_to_buy ? 'safe' : 'caution'}`}>
                  <span className="market-icon">{marketEnv.safe_to_buy ? '🟢' : '🟡'}</span>
                  <span>上证 {marketEnv.index_change >= 0 ? '+' : ''}{marketEnv.index_change.toFixed(2)}%</span>
                  <span className="market-tag">
                    {marketEnv.market_sentiment === 'bullish' ? '多头市场' :
                      marketEnv.market_sentiment === 'bearish' ? '空头市场' : '震荡市场'}
                  </span>
                </div>
              )}
            </div>

            <div className="ai-grid">
              {aiSelectedStocks.map((stock, index) => (
                <div key={stock.code} className="ai-card">
                  <div className="ai-card-header">
                    <div className="ai-rank">
                      <span className="rank-icon">🏅</span>
                      <span className="rank-num">#{index + 1}</span>
                    </div>
                    <div className="ai-stock-info">
                      <span className="ai-stock-name">{stock.name}</span>
                      <span className="ai-stock-code">{stock.code}</span>
                      {stock.board_type && (
                        <span
                          className="board-tag"
                          style={{ backgroundColor: stock.board_type.color }}
                          title={stock.board_type.risk_note}
                        >
                          {stock.board_type.name}
                        </span>
                      )}
                    </div>
                    <div className="ai-score">
                      <span className="score-label">AI评分</span>
                      <span className={`score-value ${stock.score >= 60 ? 'high' : stock.score >= 40 ? 'medium' : 'low'}`}>
                        {stock.score}
                      </span>
                    </div>
                  </div>

                  {/* 数据时间信息 */}
                  {stock.minute_volume && (
                    <div className="data-time-info">
                      <span className="time-icon">🕐</span>
                      <span className="time-label">数据:</span>
                      <span className="time-value">{stock.minute_volume.time_range}</span>
                      {stock.minute_volume.is_after_close && (
                        <span className="close-badge">已收盘</span>
                      )}
                    </div>
                  )}

                  <div className="ai-price-row">
                    <span className="ai-price">{stock.price.toFixed(2)}</span>
                    <span className={`ai-change ${stock.change_percent >= 0 ? 'up' : 'down'}`}>
                      {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                    </span>
                  </div>

                  {/* T+1短线核心指标 */}
                  <div className="ai-indicators">
                    <div className="indicator wide">
                      <span className="ind-label">尾盘走势</span>
                      <span className={`ind-value ${stock.indicators.tail_trend.trend === 'strong_up' ? 'good' :
                        stock.indicators.tail_trend.trend === 'up' ? 'good' :
                          stock.indicators.tail_trend.trend === 'down' ? 'warn' : ''
                        }`}>
                        {stock.indicators.tail_trend.trend === 'strong_up' ? '🚀 强势拉升' :
                          stock.indicators.tail_trend.trend === 'up' ? '📈 温和上涨' :
                            stock.indicators.tail_trend.trend === 'down' ? '📉 回落' :
                              stock.indicators.tail_trend.trend === 'stable' ? '➡️ 平稳' : '—'}
                      </span>
                    </div>
                    <div className="indicator wide">
                      <span className="ind-label">距涨停空间</span>
                      <span className={`ind-value ${stock.indicators.upside_space.space >= 5 ? 'good' :
                        stock.indicators.upside_space.near_limit ? 'warn' : ''
                        }`}>
                        {stock.indicators.upside_space.space.toFixed(1)}%
                      </span>
                    </div>
                    <div className="indicator">
                      <span className="ind-label">主力资金</span>
                      <span className={`ind-value ${stock.indicators.capital_flow.is_inflow ? 'good' : 'warn'}`}>
                        {stock.indicators.capital_flow.is_inflow ? '+' : ''}{stock.indicators.capital_flow.main_inflow}亿
                      </span>
                    </div>
                    
                    {/* 融资融券信息 */}
                    {stock.indicators.margin_info && stock.indicators.margin_info.has_data && (
                      <div className="indicator">
                        <span className="ind-label">融资融券</span>
                        <span className={`ind-value ${stock.indicators.margin_info.margin_score >= 50 ? 'good' : 'warn'}`}>
                          评分{stock.indicators.margin_info.margin_score}
                          {stock.indicators.margin_info.net_flow > 0 && (
                            <span className="margin-flow">+{stock.indicators.margin_info.net_flow.toFixed(2)}亿</span>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="indicator">
                      <span className="ind-label">流通市值</span>
                      <span className="ind-value">
                        {stock.market_cap.toFixed(1)}亿
                      </span>
                    </div>
                    <div className="indicator">
                      <span className="ind-label">明日预判</span>
                      <span className={`ind-value ${stock.indicators.open_probability === 'high' ? 'good' :
                        stock.indicators.open_probability === 'low' ? 'warn' : ''
                        }`}>
                        {stock.indicators.open_probability === 'high' ? '🟢 高开' :
                          stock.indicators.open_probability === 'medium' ? '🟡 平开' : '🔴 低开'}
                      </span>
                    </div>
                  </div>

                  {/* AI评分雷达图：一眼看出强项 */}
                  <AIRadar stock={stock} />

                  {/* 选股理由 */}
                  {stock.reasons.length > 0 && (
                    <div className="ai-reasons">
                      <div className="reasons-title">✅ 选股理由</div>
                      <ul className="reasons-list">
                        {stock.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 风险提示 */}
                  {stock.warnings.length > 0 && (
                    <div className="ai-warnings">
                      <div className="warnings-title">⚠️ 风险提示</div>
                      <ul className="warnings-list">
                        {stock.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 利空消息 */}
                  {stock.negative_news && (
                    <div className={`ai-news-alert ${stock.negative_news.risk_level}`}>
                      <span className="news-icon">{stock.negative_news.has_negative_news ? '⚠️' : '✅'}</span>
                      <span>{stock.negative_news.has_negative_news
                        ? `${stock.negative_news.negative_count}条利空`
                        : '无利空消息'}</span>
                    </div>
                  )}

                  {/* 30分钟成交量趋势图 */}
                  {stock.minute_volume && stock.minute_volume.data && stock.minute_volume.data.length > 0 && (
                    <div className="volume-chart ai-chart">
                      <div className="chart-header">
                        <span className="chart-title">📊 尾盘行情</span>
                        <span className="chart-time">
                          {stock.minute_volume.time_range}
                          {stock.minute_volume.is_after_close && (
                            <span className="fetch-time"> (已收盘)</span>
                          )}
                        </span>
                      </div>
                      {/* 价格区间显示 */}
                      {(() => {
                        const data = stock.minute_volume.data;
                        const prices = data.map(m => m.price);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const firstPrice = data[0].price;
                        const lastPrice = data[data.length - 1].price;
                        const priceChange = lastPrice - firstPrice;
                        return (
                          <div className="price-summary">
                            <span className="price-range">
                              价格区间: {minPrice.toFixed(2)} - {maxPrice.toFixed(2)}
                            </span>
                            <span className={`price-change ${priceChange >= 0 ? 'up' : 'down'}`}>
                              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
                            </span>
                          </div>
                        );
                      })()}
                      {/* 价格折线 + 成交量柱状图 */}
                      <div className="chart-wrapper">
                        {(() => {
                          const data = stock.minute_volume.data;
                          const prices = data.map(m => m.price);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          const priceRange = maxPrice - minPrice || 1;
                          const maxVolume = Math.max(...data.map(m => m.volume));

                          const points = data.map((m, idx) => {
                            const x = (idx / (data.length - 1)) * 100;
                            const y = 100 - ((m.price - minPrice) / priceRange) * 100;
                            return `${x},${y}`;
                          }).join(' ');

                          return (
                            <>
                              <div className="chart-container">
                                {data.map((m, idx) => (
                                  <div
                                    key={idx}
                                    className="volume-bar"
                                    style={{
                                      height: `${(m.volume / maxVolume) * 100}%`,
                                      width: `${100 / data.length - 0.5}%`,
                                      opacity: 0.3 + (idx / data.length) * 0.5
                                    }}
                                    title={`${m.time}\n价格: ${m.price.toFixed(2)}\n成交量: ${m.volume}手`}
                                  />
                                ))}
                                <svg className="price-line-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                  <polyline
                                    points={points}
                                    fill="none"
                                    stroke="#ffd93d"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                  />
                                </svg>
                              </div>
                              <div className="chart-legend">
                                <span className="legend-volume">■ 成交量</span>
                                <span className="legend-price">— 价格</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 分析详情 */}
        {analysisResults.length > 0 && (
          <section className="results-section analysis">
            <div className="section-header">
              <h2>
                <span className="section-icon">📊</span>
                分析详情
              </h2>
            </div>

            <div className="analysis-table">
              <div className="table-header">
                <span className="col-name">股票</span>
                <span className="col-check">阶梯放量</span>
                <span className="col-check">站稳5日线</span>
                <span className="col-check">数字经济</span>
                <span className="col-ma5">5日均线</span>
                <span className="col-support">支撑位</span>
                <span className="col-result">结果</span>
              </div>
              <div className="table-body">
                {analysisResults.map((result) => (
                  <div key={result.code} className={`table-row ${result.qualified ? 'qualified' : ''}`}>
                    <span className="col-name">
                      <span className="stock-name">{result.name}</span>
                      <span className="stock-code">{result.code}</span>
                    </span>
                    <span className="col-check">
                      {result.has_volume_pattern ? '✅' : '❌'}
                    </span>
                    <span className="col-check">
                      {result.above_ma5_high ? '✅' : '❌'}
                    </span>
                    <span className="col-check">
                      {result.is_digital_economy ? '✅' : '❌'}
                    </span>
                    <span className="col-ma5">{result.ma5.toFixed(2)}</span>
                    <span className="col-support">{result.support_level.toFixed(2)}</span>
                    <span className="col-result">
                      {result.qualified ? (
                        <span className="result-pass">通过</span>
                      ) : (
                        <span className="result-fail">未通过</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 空状态 */}
        {state === 'idle' && (
          <section className="empty-state">
            <div className="empty-content">
              <span className="empty-icon">🚀</span>
              <h2>开始智能选股</h2>
              <p>点击上方「开始筛选」按钮，系统将自动筛选符合条件的股票</p>
            </div>
          </section>
        )}
      </main>

      {/* 底部 */}
      <footer className="app-footer">
        <p>数据来源：东方财富 | 仅供参考，不构成投资建议 | v4.4.0</p>
      </footer>

      {/* 自选股面板 */}
      {showFavorites && (
        <FavoritesPanel 
          onClose={() => setShowFavorites(false)}
          onSelectStock={(code) => {
            console.log('Selected stock:', code);
            setShowFavorites(false);
          }}
        />
      )}

      {/* 快捷键提示 */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.75)',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 999
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>⌨️ 快捷键</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>Ctrl+Enter</kbd> 开始筛选</div>
          <div><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>Ctrl+F</kbd> 精选过滤</div>
          <div><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>Ctrl+R</kbd> 重置</div>
          <div><kbd style={{ background: '#333', padding: '2px 6px', borderRadius: '3px', marginRight: '8px' }}>Esc</kbd> 取消分析</div>
        </div>
      </div>
    </div>
  );
}

export default App;
