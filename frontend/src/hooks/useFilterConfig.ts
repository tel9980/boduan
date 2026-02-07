/**
 * 筛选配置管理 Hook
 * 管理所有筛选相关的配置状态
 */
import { useState, useCallback } from 'react';
import type { FilterConfig } from '../components/FilterPanel';

const DEFAULT_FILTER_CONFIG: FilterConfig = {
  changeMin: -2,
  changeMax: 5,
  volumeRatioMin: 1.5,
  volumeRatioMax: 3,
  marketCapMin: 50,
  marketCapMax: 160,
  includeKcbCyb: true,
  requireMargin: true,
  preferTailInflow: true,
  strictRiskControl: true,
  isBandTradingMode: true,
};

export function useFilterConfig() {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);

  const setFilterConfigValue = useCallback(<K extends keyof FilterConfig>(
    key: K,
    value: FilterConfig[K]
  ) => {
    setFilterConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  // 便捷的setter函数
  const setIsBandTradingMode = useCallback((val: boolean) => 
    setFilterConfigValue('isBandTradingMode', val), [setFilterConfigValue]);
  const setChangeMin = useCallback((val: number) => 
    setFilterConfigValue('changeMin', val), [setFilterConfigValue]);
  const setChangeMax = useCallback((val: number) => 
    setFilterConfigValue('changeMax', val), [setFilterConfigValue]);
  const setVolumeRatioMin = useCallback((val: number) => 
    setFilterConfigValue('volumeRatioMin', val), [setFilterConfigValue]);
  const setVolumeRatioMax = useCallback((val: number) => 
    setFilterConfigValue('volumeRatioMax', val), [setFilterConfigValue]);
  const setMarketCapMin = useCallback((val: number) => 
    setFilterConfigValue('marketCapMin', val), [setFilterConfigValue]);
  const setMarketCapMax = useCallback((val: number) => 
    setFilterConfigValue('marketCapMax', val), [setFilterConfigValue]);
  const setIncludeKcbCyb = useCallback((val: boolean) => 
    setFilterConfigValue('includeKcbCyb', val), [setFilterConfigValue]);
  const setPreferTailInflow = useCallback((val: boolean) => 
    setFilterConfigValue('preferTailInflow', val), [setFilterConfigValue]);
  const setStrictRiskControl = useCallback((val: boolean) => 
    setFilterConfigValue('strictRiskControl', val), [setFilterConfigValue]);

  const resetFilterConfig = useCallback(() => {
    setFilterConfig(DEFAULT_FILTER_CONFIG);
  }, []);

  return {
    filterConfig,
    setFilterConfig,
    setFilterConfigValue,
    setIsBandTradingMode,
    setChangeMin,
    setChangeMax,
    setVolumeRatioMin,
    setVolumeRatioMax,
    setMarketCapMin,
    setMarketCapMax,
    setIncludeKcbCyb,
    setPreferTailInflow,
    setStrictRiskControl,
    resetFilterConfig,
  };
}
