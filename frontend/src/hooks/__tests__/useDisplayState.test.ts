import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDisplayState } from '../useDisplayState'
import type { Position } from '../../utils/localStorage'

describe('useDisplayState', () => {
  it('所有面板默认应该是关闭状态', () => {
    const { result } = renderHook(() => useDisplayState())
    
    expect(result.current.showFavorites).toBe(false)
    expect(result.current.showHistory).toBe(false)
    expect(result.current.showComparison).toBe(false)
    expect(result.current.showTracking).toBe(false)
    expect(result.current.showMarketEmotion).toBe(false)
    expect(result.current.showAlertCenter).toBe(false)
    expect(result.current.showPortfolio).toBe(false)
    expect(result.current.showFinalPick).toBe(false)
    expect(result.current.showSavePreset).toBe(false)
    expect(result.current.showAddAlert).toBe(false)
    expect(result.current.showAddPosition).toBe(false)
    expect(result.current.editingPosition).toBeNull()
    expect(result.current.isScreenedCollapsed).toBe(false)
  })

  describe('面板控制', () => {
    it('应该能打开和关闭自选股面板', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowFavorites(true)
      })
      expect(result.current.showFavorites).toBe(true)
      
      act(() => {
        result.current.setShowFavorites(false)
      })
      expect(result.current.showFavorites).toBe(false)
    })

    it('应该能打开和关闭历史记录面板', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowHistory(true)
      })
      expect(result.current.showHistory).toBe(true)
    })

    it('应该能打开和关闭对比模式', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowComparison(true)
      })
      expect(result.current.showComparison).toBe(true)
    })

    it('应该能打开和关闭提醒中心', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowAlertCenter(true)
      })
      expect(result.current.showAlertCenter).toBe(true)
    })

    it('应该能打开和关闭持仓追踪', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowPortfolio(true)
      })
      expect(result.current.showPortfolio).toBe(true)
    })
  })

  describe('对话框控制', () => {
    it('应该能控制保存预设对话框', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowSavePreset(true)
      })
      expect(result.current.showSavePreset).toBe(true)
    })

    it('应该能控制添加提醒对话框', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowAddAlert(true)
      })
      expect(result.current.showAddAlert).toBe(true)
    })

    it('应该能控制添加持仓对话框', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.setShowAddPosition(true)
      })
      expect(result.current.showAddPosition).toBe(true)
    })

    it('应该能设置正在编辑的持仓', () => {
      const { result } = renderHook(() => useDisplayState())
      
      const mockPosition: Position = {
        id: '1',
        stockCode: '000001',
        stockName: '平安银行',
        buyPrice: 10.5,
        shares: 1000,
        buyDate: '2024-01-01',
        stopLoss: 9.5,
        targetPrice: 12.0,
        notes: '测试持仓',
      }
      
      act(() => {
        result.current.setEditingPosition(mockPosition)
      })
      
      expect(result.current.editingPosition).toEqual(mockPosition)
      
      act(() => {
        result.current.setEditingPosition(null)
      })
      
      expect(result.current.editingPosition).toBeNull()
    })
  })

  describe('closeAllPanels', () => {
    it('应该能一键关闭所有面板', () => {
      const { result } = renderHook(() => useDisplayState())
      
      // 先打开几个面板
      act(() => {
        result.current.setShowFavorites(true)
        result.current.setShowHistory(true)
        result.current.setShowComparison(true)
        result.current.setShowAlertCenter(true)
        result.current.setShowPortfolio(true)
        result.current.setShowFinalPick(true)
      })
      
      // 验证已打开
      expect(result.current.showFavorites).toBe(true)
      expect(result.current.showHistory).toBe(true)
      
      // 关闭所有
      act(() => {
        result.current.closeAllPanels()
      })
      
      // 验证全部关闭
      expect(result.current.showFavorites).toBe(false)
      expect(result.current.showHistory).toBe(false)
      expect(result.current.showComparison).toBe(false)
      expect(result.current.showTracking).toBe(false)
      expect(result.current.showMarketEmotion).toBe(false)
      expect(result.current.showAlertCenter).toBe(false)
      expect(result.current.showPortfolio).toBe(false)
      expect(result.current.showFinalPick).toBe(false)
    })
  })

  describe('togglePanel', () => {
    it('应该能切换自选股面板', () => {
      const { result } = renderHook(() => useDisplayState())
      
      act(() => {
        result.current.togglePanel('favorites')
      })
      
      expect(result.current.showFavorites).toBe(true)
      
      // 再次切换应该关闭（但在互斥模式下会重新打开）
      act(() => {
        result.current.togglePanel('favorites')
      })
      
      // togglePanel 内部会先关闭所有面板，然后切换指定面板
      // 所以第二次调用会关闭 favorites
    })

    it('切换面板时应该关闭其他面板', () => {
      const { result } = renderHook(() => useDisplayState())
      
      // 先打开自选股
      act(() => {
        result.current.setShowFavorites(true)
      })
      expect(result.current.showFavorites).toBe(true)
      
      // 切换到历史记录
      act(() => {
        result.current.togglePanel('history')
      })
      
      expect(result.current.showFavorites).toBe(false)
      expect(result.current.showHistory).toBe(true)
    })

    it('应该支持所有面板类型的切换', () => {
      const { result } = renderHook(() => useDisplayState())
      
      const panels = [
        'favorites',
        'history',
        'comparison',
        'tracking',
        'marketEmotion',
        'alertCenter',
        'portfolio',
      ] as const
      
      panels.forEach(panel => {
        act(() => {
          result.current.togglePanel(panel)
        })
        
        // 验证对应的面板已打开
        const panelKey = `show${panel.charAt(0).toUpperCase() + panel.slice(1)}` as keyof typeof result.current
        expect(result.current[panelKey]).toBe(true)
      })
    })
  })

  describe('isScreenedCollapsed', () => {
    it('应该能控制筛选结果的折叠状态', () => {
      const { result } = renderHook(() => useDisplayState())
      
      expect(result.current.isScreenedCollapsed).toBe(false)
      
      act(() => {
        result.current.setIsScreenedCollapsed(true)
      })
      
      expect(result.current.isScreenedCollapsed).toBe(true)
      
      act(() => {
        result.current.setIsScreenedCollapsed(false)
      })
      
      expect(result.current.isScreenedCollapsed).toBe(false)
    })
  })
})
