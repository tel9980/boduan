/**
 * 持仓追踪组件
 * 显示持仓列表、统计信息、风险评估
 */

import React, { useState, useEffect } from 'react';
import { PortfolioManager, type PortfolioStatistics, type RiskAssessment } from '../services/PortfolioManager';
import { type Position } from '../utils/localStorage';

interface PortfolioTrackerProps {
  portfolioManager: PortfolioManager;
  onClose: () => void;
  onAddPosition?: () => void;
  onEditPosition?: (position: Position) => void;
}

const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  portfolioManager,
  onClose,
  onAddPosition,
  onEditPosition
}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [statistics, setStatistics] = useState<PortfolioStatistics | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    
    // 每30秒刷新一次数据
    const interval = setInterval(() => {
      loadData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setPositions(portfolioManager.getPositions());
    setStatistics(portfolioManager.getStatistics());
    setRiskAssessment(portfolioManager.assessRisk());
  };

  const handleDeletePosition = (positionId: string) => {
    if (confirm('确定要删除这个持仓吗？')) {
      portfolioManager.removePosition(positionId);
      loadData();
    }
  };

  const formatCurrency = (amount: number): string => {
    return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number): string => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };

  const getHoldDays = (buyDate: string): number => {
    const now = new Date();
    const buy = new Date(buyDate);
    return Math.floor((now.getTime() - buy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'low': return '#52c41a';
      case 'medium': return '#faad14';
      case 'high': return '#ff4d4f';
      default: return '#999';
    }
  };

  const getRiskLevelLabel = (level: string): string => {
    switch (level) {
      case 'low': return '低风险';
      case 'medium': return '中等风险';
      case 'high': return '高风险';
      default: return '未知';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          maxWidth: '1000px',
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            📊 我的持仓
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {onAddPosition && (
              <button
                onClick={onAddPosition}
                style={{
                  padding: '8px 16px',
                  background: '#1890ff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                + 添加持仓
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#999',
                padding: '0',
                width: '32px',
                height: '32px'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {positions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
              <div style={{ fontSize: '16px', marginBottom: '12px' }}>暂无持仓记录</div>
              <div style={{ fontSize: '14px', marginBottom: '24px' }}>添加您的第一个持仓，开始追踪盈亏</div>
              {onAddPosition && (
                <button
                  onClick={onAddPosition}
                  style={{
                    padding: '10px 24px',
                    background: '#1890ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  添加第一个持仓
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 统计面板 */}
              {statistics && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}
                >
                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>总市值</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {formatCurrency(statistics.totalValue)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      background: statistics.totalPnL >= 0
                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                        : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>总盈亏</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {formatCurrency(statistics.totalPnL)}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '4px' }}>
                      {formatPercent(statistics.totalPnLPercent)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  >
                    <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>持仓数量</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {statistics.totalPositions}只
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
                      平均持仓 {statistics.avgHoldDays} 天
                    </div>
                  </div>

                  {riskAssessment && (
                    <div
                      style={{
                        padding: '16px',
                        background: `linear-gradient(135deg, ${getRiskLevelColor(riskAssessment.riskLevel)} 0%, ${getRiskLevelColor(riskAssessment.riskLevel)}dd 100%)`,
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    >
                      <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '8px' }}>风险等级</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {getRiskLevelLabel(riskAssessment.riskLevel)}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>
                        集中度 {(riskAssessment.concentration * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 风险评估建议 */}
              {riskAssessment && riskAssessment.suggestions.length > 0 && (
                <div
                  style={{
                    padding: '16px',
                    background: '#f0f0f0',
                    borderRadius: '8px',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                    💡 优化建议
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                    {riskAssessment.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 持仓列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {positions.map((position) => {
                  const pnl = portfolioManager.calculatePnL(position);
                  const holdDays = getHoldDays(position.buyDate);
                  
                  return (
                    <div
                      key={position.id}
                      style={{
                        padding: '16px',
                        background: '#fff',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          {/* 股票信息 */}
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                              {position.stockName}
                            </span>
                            <span style={{ fontSize: '14px', color: '#999', marginLeft: '8px' }}>
                              ({position.stockCode})
                            </span>
                            {position.board && (
                              <span style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                background: '#e6f7ff',
                                color: '#1890ff',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {position.board}
                              </span>
                            )}
                          </div>

                          {/* 买入信息 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              买入价: <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(position.buyPrice)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              数量: <span style={{ fontWeight: 'bold', color: '#333' }}>{position.quantity}股</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              成本: <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(pnl.cost)}</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              持仓: <span style={{ fontWeight: 'bold', color: '#333' }}>{holdDays}天</span>
                            </div>
                          </div>

                          {/* 当前信息 */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              当前价: <span style={{ fontWeight: 'bold', color: '#333' }}>
                                {formatCurrency(position.currentPrice || position.buyPrice)}
                              </span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#666' }}>
                              市值: <span style={{ fontWeight: 'bold', color: '#333' }}>{formatCurrency(pnl.currentValue)}</span>
                            </div>
                          </div>

                          {/* 盈亏信息 */}
                          <div
                            style={{
                              padding: '12px',
                              background: pnl.status === 'profit' ? '#f6ffed' : pnl.status === 'loss' ? '#fff1f0' : '#f5f5f5',
                              borderRadius: '6px',
                              marginBottom: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '14px', color: '#666' }}>盈亏</span>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{
                                  fontSize: '18px',
                                  fontWeight: 'bold',
                                  color: pnl.status === 'profit' ? '#52c41a' : pnl.status === 'loss' ? '#ff4d4f' : '#999'
                                }}>
                                  {formatCurrency(pnl.pnlAmount)}
                                </div>
                                <div style={{
                                  fontSize: '14px',
                                  color: pnl.status === 'profit' ? '#52c41a' : pnl.status === 'loss' ? '#ff4d4f' : '#999'
                                }}>
                                  {formatPercent(pnl.pnlPercent)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 止损止盈 */}
                          {(position.stopLoss || position.takeProfit) && (
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                              {position.stopLoss && (
                                <div>
                                  止损: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                                    {formatCurrency(position.stopLoss)}
                                  </span>
                                </div>
                              )}
                              {position.takeProfit && (
                                <div>
                                  止盈: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                                    {formatCurrency(position.takeProfit)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 备注 */}
                          {position.notes && (
                            <div style={{
                              marginTop: '12px',
                              padding: '10px',
                              background: '#fffbe6',
                              border: '1px solid #ffe58f',
                              borderRadius: '6px',
                              fontSize: '12px',
                              color: '#666',
                              lineHeight: '1.6'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#faad14' }}>
                                📝 备注
                              </div>
                              <div>{position.notes}</div>
                            </div>
                          )}
                        </div>

                        {/* 操作按钮 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                          {onEditPosition && (
                            <button
                              onClick={() => onEditPosition(position)}
                              style={{
                                padding: '6px 12px',
                                background: '#fff',
                                color: '#1890ff',
                                border: '1px solid #1890ff',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              编辑
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePosition(position.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#fff',
                              color: '#ff4d4f',
                              border: '1px solid #ff4d4f',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 最佳/最差持仓 */}
              {statistics && (statistics.bestPosition || statistics.worstPosition) && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#f0f0f0',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
                    📈 持仓表现
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {statistics.bestPosition && (
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        最佳: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                          {statistics.bestPosition.name} {formatPercent(statistics.bestPosition.pnlPercent)}
                        </span>
                      </div>
                    )}
                    {statistics.worstPosition && (
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        最差: <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                          {statistics.worstPosition.name} {formatPercent(statistics.worstPosition.pnlPercent)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioTracker;
