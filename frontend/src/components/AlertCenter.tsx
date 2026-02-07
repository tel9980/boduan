import React, { useState, useEffect } from 'react';
import {
  type AlertRule,
  getAlertRules,
  removeAlertRule,
  updateAlertRule,
  getAlertHistory,
  clearAlertHistory,
  markAllAlertsAsRead,
  type AlertHistoryItem
} from '../utils/localStorage';

interface AlertCenterProps {
  onClose: () => void;
  onAddAlert?: () => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ onClose, onAddAlert }) => {
  const [activeTab, setActiveTab] = useState<'price' | 'position' | 'abnormal' | 'history'>('price');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistoryItem[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRules(getAlertRules());
    setHistory(getAlertHistory(50));
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    updateAlertRule(ruleId, { isActive });
    loadData();
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('确定要删除这条提醒规则吗？')) {
      removeAlertRule(ruleId);
      loadData();
    }
  };

  const handleClearHistory = () => {
    if (confirm('确定要清空所有提醒历史吗？')) {
      clearAlertHistory();
      loadData();
    }
  };

  const handleMarkAllRead = () => {
    markAllAlertsAsRead();
    loadData();
  };

  const getRulesByType = (type: string) => {
    if (type === 'position') {
      return rules.filter(r => r.type === 'stop_loss' || r.type === 'take_profit');
    }
    return rules.filter(r => r.type === type || (type === 'abnormal' && (r.type === 'abnormal' || r.type === 'signal')));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      price: '价格提醒',
      stop_loss: '止损提醒',
      take_profit: '止盈提醒',
      abnormal: '异动提醒',
      signal: '买入信号'
    };
    return labels[type] || type;
  };

  const renderRuleCard = (rule: AlertRule) => (
    <div
      key={rule.id}
      style={{
        padding: '16px',
        background: rule.isActive ? '#fff' : '#f5f5f5',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        marginBottom: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: rule.isActive ? '#333' : '#999'
            }}>
              {rule.stockName} ({rule.stockCode})
            </span>
            <span style={{
              marginLeft: '8px',
              padding: '2px 8px',
              background: rule.isActive ? '#e6f7ff' : '#f0f0f0',
              color: rule.isActive ? '#1890ff' : '#999',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              {getRuleTypeLabel(rule.type)}
            </span>
          </div>
          
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {rule.type === 'price' && (
              <>
                目标价: ¥{rule.conditions.targetPrice?.toFixed(2)} 
                ({rule.conditions.direction === 'up' ? '上涨到' : '下跌到'})
              </>
            )}
            {(rule.type === 'stop_loss' || rule.type === 'take_profit') && (
              <>
                {rule.type === 'stop_loss' ? '止损价' : '目标价'}: ¥{rule.conditions.targetPrice?.toFixed(2)}
              </>
            )}
            {rule.type === 'abnormal' && (
              <>
                涨跌幅 &gt; {rule.conditions.changePercent || 5}% 或 量比 &gt; {rule.conditions.volumeRatio || 3}
              </>
            )}
            {rule.type === 'signal' && (
              <>符合波段交易策略</>
            )}
          </div>
          
          <div style={{ fontSize: '12px', color: '#999' }}>
            创建于 {formatDate(rule.createdAt)}
            {rule.lastTriggeredAt && ` · 最后触发 ${formatDate(rule.lastTriggeredAt)}`}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
          <button
            onClick={() => handleToggleRule(rule.id, !rule.isActive)}
            style={{
              padding: '6px 12px',
              background: rule.isActive ? '#fff' : '#1890ff',
              color: rule.isActive ? '#666' : '#fff',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            {rule.isActive ? '暂停' : '启用'}
          </button>
          <button
            onClick={() => handleDeleteRule(rule.id)}
            style={{
              padding: '6px 12px',
              background: '#fff',
              color: '#ff4d4f',
              border: '1px solid #ff4d4f',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistoryItem = (item: AlertHistoryItem) => (
    <div
      key={item.id}
      style={{
        padding: '12px',
        background: item.read ? '#fff' : '#e6f7ff',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        marginBottom: '8px'
      }}
    >
      <div style={{ fontSize: '14px', color: '#333', marginBottom: '4px' }}>
        {item.message}
      </div>
      <div style={{ fontSize: '12px', color: '#999' }}>
        {formatDate(item.triggeredAt)}
      </div>
    </div>
  );

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: '80vh',
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
            📢 提醒中心
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {onAddAlert && (
              <button
                onClick={onAddAlert}
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
                + 添加提醒
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

        {/* 标签页 */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 20px'
          }}
        >
          {[
            { key: 'price', label: '价格提醒', icon: '💰' },
            { key: 'position', label: '止损止盈', icon: '🎯' },
            { key: 'abnormal', label: '异动提醒', icon: '📊' },
            { key: 'history', label: '提醒历史', icon: '📜' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #1890ff' : '2px solid transparent',
                color: activeTab === tab.key ? '#1890ff' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {activeTab === 'history' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  共 {history.length} 条记录
                  {history.filter(h => !h.read).length > 0 && (
                    <span style={{ color: '#1890ff', marginLeft: '8px' }}>
                      ({history.filter(h => !h.read).length} 条未读)
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {history.filter(h => !h.read).length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        padding: '4px 12px',
                        background: '#fff',
                        color: '#1890ff',
                        border: '1px solid #1890ff',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      全部已读
                    </button>
                  )}
                  <button
                    onClick={handleClearHistory}
                    style={{
                      padding: '4px 12px',
                      background: '#fff',
                      color: '#ff4d4f',
                      border: '1px solid #ff4d4f',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    清空历史
                  </button>
                </div>
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  暂无提醒历史
                </div>
              ) : (
                history.map(renderHistoryItem)
              )}
            </>
          ) : (
            <>
              {getRulesByType(activeTab).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                  <div>暂无{activeTab === 'price' ? '价格' : activeTab === 'position' ? '止损止盈' : '异动'}提醒</div>
                  {onAddAlert && (
                    <button
                      onClick={onAddAlert}
                      style={{
                        marginTop: '16px',
                        padding: '8px 24px',
                        background: '#1890ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      添加第一条提醒
                    </button>
                  )}
                </div>
              ) : (
                getRulesByType(activeTab).map(renderRuleCard)
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCenter;
