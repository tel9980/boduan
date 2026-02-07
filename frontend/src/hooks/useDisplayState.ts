/**
 * 显示状态管理 Hook
 * 管理各种面板、对话框的显示状态
 */
import { useState, useCallback } from 'react';
import type { Position } from '../utils/localStorage';

export function useDisplayState() {
  // 面板显示状态
  const [showFavorites, setShowFavorites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [showMarketEmotion, setShowMarketEmotion] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showFinalPick, setShowFinalPick] = useState(false);
  const [isScreenedCollapsed, setIsScreenedCollapsed] = useState(false);

  // 对话框状态
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  // 关闭所有面板
  const closeAllPanels = useCallback(() => {
    setShowFavorites(false);
    setShowHistory(false);
    setShowComparison(false);
    setShowTracking(false);
    setShowMarketEmotion(false);
    setShowAlertCenter(false);
    setShowPortfolio(false);
    setShowFinalPick(false);
  }, []);

  // 切换面板（互斥）
  const togglePanel = useCallback((panelName: string) => {
    closeAllPanels();
    switch (panelName) {
      case 'favorites':
        setShowFavorites(prev => !prev);
        break;
      case 'history':
        setShowHistory(prev => !prev);
        break;
      case 'comparison':
        setShowComparison(prev => !prev);
        break;
      case 'tracking':
        setShowTracking(prev => !prev);
        break;
      case 'marketEmotion':
        setShowMarketEmotion(prev => !prev);
        break;
      case 'alertCenter':
        setShowAlertCenter(prev => !prev);
        break;
      case 'portfolio':
        setShowPortfolio(prev => !prev);
        break;
    }
  }, [closeAllPanels]);

  return {
    // 面板状态
    showFavorites,
    setShowFavorites,
    showHistory,
    setShowHistory,
    showComparison,
    setShowComparison,
    showTracking,
    setShowTracking,
    showMarketEmotion,
    setShowMarketEmotion,
    showAlertCenter,
    setShowAlertCenter,
    showPortfolio,
    setShowPortfolio,
    showFinalPick,
    setShowFinalPick,
    isScreenedCollapsed,
    setIsScreenedCollapsed,
    
    // 对话框状态
    showSavePreset,
    setShowSavePreset,
    showAddAlert,
    setShowAddAlert,
    showAddPosition,
    setShowAddPosition,
    editingPosition,
    setEditingPosition,
    
    // 操作函数
    closeAllPanels,
    togglePanel,
  };
}
