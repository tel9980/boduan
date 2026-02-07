/**
 * 股票筛选状态管理 Hook
 * 管理筛选过程、结果、错误等状态
 */
import { useState, useCallback, useRef } from 'react';
import type { ScreenedStock, FilteredStock, AnalysisResult, AISelectedStock, MarketEnvironment, FinalPick } from '../api/stock';
import { screenStocks, screenBandTradingStocks } from '../api/stock';
import { getCachedScreenResult, setCachedScreenResult } from '../utils/localStorage';
import type { FilterConfig } from '../components/FilterPanel';

type ScreenState = 'idle' | 'screening' | 'screened' | 'filtering' | 'filtered';

interface UseStockScreeningOptions {
  cacheExpiry: number;
}

export function useStockScreening(options: UseStockScreeningOptions) {
  const { cacheExpiry } = options;
  
  // 筛选状态
  const [state, setState] = useState<ScreenState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  // 数据状态
  const [screenedStocks, setScreenedStocks] = useState<ScreenedStock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<FilteredStock[]>([]);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [aiSelectedStocks, setAiSelectedStocks] = useState<AISelectedStock[]>([]);
  const [marketEnv, setMarketEnv] = useState<MarketEnvironment | null>(null);
  
  // 精选结果
  const [finalPick, setFinalPick] = useState<FinalPick | null>(null);
  const [finalPicks, setFinalPicks] = useState<FinalPick[]>([]);
  const [selectedPickIndex, setSelectedPickIndex] = useState<number>(0);
  
  // 取消请求的控制器
  const cancelTokenSource = useRef<any>(null);

  // 执行筛选
  const handleScreen = useCallback(async (filterConfig: FilterConfig) => {
    setState('screening');
    setError(null);
    setFilteredStocks([]);
    setAnalysisResults([]);
    setMarketEnv(null);
    setProgress('正在获取全市场数据...');

    const {
      isBandTradingMode,
      changeMin,
      changeMax,
      volumeRatioMin,
      volumeRatioMax,
      marketCapMax,
      marketCapMin,
      includeKcbCyb,
      requireMargin,
    } = filterConfig;

    // 检查缓存
    const cached = getCachedScreenResult(filterConfig, cacheExpiry);
    if (cached) {
      console.log('✅ 使用缓存数据');
      setProgress('');
      setScreenedStocks(cached.stocks);
      if (cached.marketEnv) {
        setMarketEnv(cached.marketEnv as MarketEnvironment);
      }
      setState('screened');
      return;
    }

    try {
      let result;
      if (isBandTradingMode) {
        // 判断策略类型
        let strategyType = 'balanced';
        if (changeMin >= 2 && changeMax >= 6) {
          strategyType = 'aggressive';
        } else if (changeMax <= 2 && changeMin <= 0) {
          strategyType = 'conservative';
        }

        result = await screenBandTradingStocks({
          change_min: changeMin,
          change_max: changeMax,
          volume_ratio_min: volumeRatioMin,
          volume_ratio_max: volumeRatioMax,
          market_cap_max: marketCapMax,
          limit: 3,
          strategy_type: strategyType,
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
      
      setProgress('');
      setScreenedStocks(result.data);
      if (result.market_environment) {
        setMarketEnv(result.market_environment);
      }
      
      // 缓存结果
      setCachedScreenResult(filterConfig, {
        stocks: result.data,
        marketEnv: result.market_environment,
      });
      
      setState('screened');
    } catch (err: any) {
      console.error('筛选失败:', err);
      setError(err.message || '筛选失败');
      setState('idle');
    }
  }, [cacheExpiry]);

  // 清除结果
  const clearResults = useCallback(() => {
    setScreenedStocks([]);
    setFilteredStocks([]);
    setAnalysisResults([]);
    setAiSelectedStocks([]);
    setMarketEnv(null);
    setFinalPick(null);
    setFinalPicks([]);
    setSelectedPickIndex(0);
    setError(null);
    setState('idle');
  }, []);

  // 选择精选股票
  const selectFinalPick = useCallback((index: number) => {
    if (index >= 0 && index < finalPicks.length) {
      setSelectedPickIndex(index);
      setFinalPick(finalPicks[index]);
    }
  }, [finalPicks]);

  return {
    // 状态
    state,
    error,
    progress,
    setProgress,
    
    // 数据
    screenedStocks,
    filteredStocks,
    analysisResults,
    aiSelectedStocks,
    marketEnv,
    finalPick,
    finalPicks,
    selectedPickIndex,
    
    // Setters
    setScreenedStocks,
    setFilteredStocks,
    setAnalysisResults,
    setAiSelectedStocks,
    setMarketEnv,
    setFinalPick,
    setFinalPicks,
    setSelectedPickIndex,
    setError,
    
    // 操作
    handleScreen,
    clearResults,
    selectFinalPick,
    cancelTokenSource,
  };
}
