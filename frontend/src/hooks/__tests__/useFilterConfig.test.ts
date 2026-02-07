import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilterConfig } from '../useFilterConfig'

describe('useFilterConfig', () => {
  it('应该使用默认配置初始化', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig).toEqual({
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
    })
  })

  it('应该能更新 changeMin', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setChangeMin(-5)
    })
    
    expect(result.current.filterConfig.changeMin).toBe(-5)
    expect(result.current.filterConfig.changeMax).toBe(5) // 其他值不变
  })

  it('应该能更新 changeMax', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setChangeMax(10)
    })
    
    expect(result.current.filterConfig.changeMax).toBe(10)
  })

  it('应该能更新 volumeRatioMin', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setVolumeRatioMin(2)
    })
    
    expect(result.current.filterConfig.volumeRatioMin).toBe(2)
  })

  it('应该能更新 volumeRatioMax', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setVolumeRatioMax(5)
    })
    
    expect(result.current.filterConfig.volumeRatioMax).toBe(5)
  })

  it('应该能更新 marketCapMin', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setMarketCapMin(30)
    })
    
    expect(result.current.filterConfig.marketCapMin).toBe(30)
  })

  it('应该能更新 marketCapMax', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setMarketCapMax(200)
    })
    
    expect(result.current.filterConfig.marketCapMax).toBe(200)
  })

  it('应该能切换 isBandTradingMode', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig.isBandTradingMode).toBe(true)
    
    act(() => {
      result.current.setIsBandTradingMode(false)
    })
    
    expect(result.current.filterConfig.isBandTradingMode).toBe(false)
  })

  it('应该能切换 includeKcbCyb', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig.includeKcbCyb).toBe(true)
    
    act(() => {
      result.current.setIncludeKcbCyb(false)
    })
    
    expect(result.current.filterConfig.includeKcbCyb).toBe(false)
  })

  it('应该能切换 preferTailInflow', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig.preferTailInflow).toBe(true)
    
    act(() => {
      result.current.setPreferTailInflow(false)
    })
    
    expect(result.current.filterConfig.preferTailInflow).toBe(false)
  })

  it('应该能切换 strictRiskControl', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    expect(result.current.filterConfig.strictRiskControl).toBe(true)
    
    act(() => {
      result.current.setStrictRiskControl(false)
    })
    
    expect(result.current.filterConfig.strictRiskControl).toBe(false)
  })

  it('应该能重置配置', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    // 修改一些值
    act(() => {
      result.current.setChangeMin(-10)
      result.current.setChangeMax(20)
      result.current.setMarketCapMax(300)
    })
    
    // 验证已修改
    expect(result.current.filterConfig.changeMin).toBe(-10)
    expect(result.current.filterConfig.changeMax).toBe(20)
    expect(result.current.filterConfig.marketCapMax).toBe(300)
    
    // 重置
    act(() => {
      result.current.resetFilterConfig()
    })
    
    // 验证已恢复默认值
    expect(result.current.filterConfig.changeMin).toBe(-2)
    expect(result.current.filterConfig.changeMax).toBe(5)
    expect(result.current.filterConfig.marketCapMax).toBe(160)
  })

  it('应该能使用通用的 setFilterConfigValue', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    act(() => {
      result.current.setFilterConfigValue('changeMin', -3)
    })
    
    expect(result.current.filterConfig.changeMin).toBe(-3)
  })

  it('应该能使用 setFilterConfig 直接设置整个配置', () => {
    const { result } = renderHook(() => useFilterConfig())
    
    const newConfig = {
      changeMin: 0,
      changeMax: 10,
      volumeRatioMin: 2,
      volumeRatioMax: 4,
      marketCapMin: 100,
      marketCapMax: 500,
      includeKcbCyb: false,
      requireMargin: false,
      preferTailInflow: false,
      strictRiskControl: false,
      isBandTradingMode: false,
    }
    
    act(() => {
      result.current.setFilterConfig(newConfig)
    })
    
    expect(result.current.filterConfig).toEqual(newConfig)
  })
})
