import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUIState } from '../useUIState'
import * as localStorageUtils from '../../utils/localStorage'

// 模拟 localStorage 工具函数
vi.mock('../../utils/localStorage', () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  toggleTheme: vi.fn(),
}))

describe('useUIState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // 设置默认返回值
    vi.mocked(localStorageUtils.getSettings).mockReturnValue({
      theme: 'light',
      fontSize: 'medium',
      tableDensity: 'standard',
      cacheExpiry: 5,
    })
  })

  it('应该使用 localStorage 中的设置初始化', () => {
    const { result } = renderHook(() => useUIState())
    
    expect(result.current.theme).toBe('light')
    expect(result.current.fontSize).toBe('medium')
    expect(result.current.tableDensity).toBe('standard')
    expect(result.current.cacheExpiry).toBe(5)
    expect(result.current.showSettings).toBe(false)
  })

  it('应该能设置主题', () => {
    const { result } = renderHook(() => useUIState())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(result.current.theme).toBe('dark')
    expect(localStorageUtils.updateSettings).toHaveBeenCalledWith({ theme: 'dark' })
  })

  it('应该能切换主题', () => {
    vi.mocked(localStorageUtils.toggleTheme).mockReturnValue('dark')
    
    const { result } = renderHook(() => useUIState())
    
    act(() => {
      result.current.toggleThemeMode()
    })
    
    expect(result.current.theme).toBe('dark')
    expect(localStorageUtils.toggleTheme).toHaveBeenCalled()
  })

  it('应该能设置字体大小', () => {
    const { result } = renderHook(() => useUIState())
    
    act(() => {
      result.current.setFontSize('large')
    })
    
    expect(result.current.fontSize).toBe('large')
    expect(localStorageUtils.updateSettings).toHaveBeenCalledWith({ fontSize: 'large' })
  })

  it('应该能设置表格密度', () => {
    const { result } = renderHook(() => useUIState())
    
    act(() => {
      result.current.setTableDensity('compact')
    })
    
    expect(result.current.tableDensity).toBe('compact')
    expect(localStorageUtils.updateSettings).toHaveBeenCalledWith({ tableDensity: 'compact' })
  })

  it('应该能设置缓存过期时间', () => {
    const { result } = renderHook(() => useUIState())
    
    act(() => {
      result.current.setCacheExpiry(10)
    })
    
    expect(result.current.cacheExpiry).toBe(10)
    expect(localStorageUtils.updateSettings).toHaveBeenCalledWith({ cacheExpiry: 10 })
  })

  it('应该能控制设置面板的显示', () => {
    const { result } = renderHook(() => useUIState())
    
    expect(result.current.showSettings).toBe(false)
    
    act(() => {
      result.current.setShowSettings(true)
    })
    
    expect(result.current.showSettings).toBe(true)
    
    act(() => {
      result.current.setShowSettings(false)
    })
    
    expect(result.current.showSettings).toBe(false)
  })

  it('应该支持 dark 主题初始化', () => {
    vi.mocked(localStorageUtils.getSettings).mockReturnValue({
      theme: 'dark',
      fontSize: 'small',
      tableDensity: 'comfortable',
      cacheExpiry: 15,
    })
    
    const { result } = renderHook(() => useUIState())
    
    expect(result.current.theme).toBe('dark')
    expect(result.current.fontSize).toBe('small')
    expect(result.current.tableDensity).toBe('comfortable')
    expect(result.current.cacheExpiry).toBe(15)
  })
})
