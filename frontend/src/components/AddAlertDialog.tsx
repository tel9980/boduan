import React, { useState } from 'react';
import { addAlertRule } from '../utils/localStorage';

interface AddAlertDialogProps {
  onClose: () => void;
  onSuccess?: () => void;
  defaultStock?: { code: string; name: string; price?: number };
}

const AddAlertDialog: React.FC<AddAlertDialogProps> = ({ onClose, onSuccess, defaultStock }) => {
  const [alertType, setAlertType] = useState<'price' | 'abnormal'>('price');
  const [stockCode, setStockCode] = useState(defaultStock?.code || '');
  const [stockName, setStockName] = useState(defaultStock?.name || '');
  const [targetPrice, setTargetPrice] = useState(defaultStock?.price?.toString() || '');
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [changePercent, setChangePercent] = useState('5');
  const [volumeRatio, setVolumeRatio] = useState('3');
  const [expiryDays, setExpiryDays] = useState('30');
  const [channels, setChannels] = useState<('browser' | 'sound' | 'internal')[]>(['browser', 'sound']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode || !stockName) {
      alert('请输入股票代码和名称');
      return;
    }

    if (alertType === 'price' && !targetPrice) {
      alert('请输入目标价格');
      return;
    }

    const expiresAt = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString();

    const rule = {
      type: alertType,
      stockCode: stockCode.trim(),
      stockName: stockName.trim(),
      conditions: alertType === 'price' 
        ? {
            targetPrice: parseFloat(targetPrice),
            direction
          }
        : {
            changePercent: parseFloat(changePercent),
            volumeRatio: parseFloat(volumeRatio)
          },
      isActive: true,
      expiresAt,
      notificationChannels: channels
    };

    addAlertRule(rule);
    
    if (onSuccess) {
      onSuccess();
    }
    
    onClose();
  };

  const toggleChannel = (channel: 'browser' | 'sound' | 'internal') => {
    if (channels.includes(channel)) {
      setChannels(channels.filter(c => c !== channel));
    } else {
      setChannels([...channels, channel]);
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
        zIndex: 1001,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
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
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 1
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
            ➕ 添加提醒
          </h2>
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

        {/* 表单 */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {/* 提醒类型 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              提醒类型
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAlertType('price')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: alertType === 'price' ? '#1890ff' : '#fff',
                  color: alertType === 'price' ? '#fff' : '#666',
                  border: `1px solid ${alertType === 'price' ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                💰 价格提醒
              </button>
              <button
                type="button"
                onClick={() => setAlertType('abnormal')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: alertType === 'abnormal' ? '#1890ff' : '#fff',
                  color: alertType === 'abnormal' ? '#fff' : '#666',
                  border: `1px solid ${alertType === 'abnormal' ? '#1890ff' : '#d9d9d9'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📊 异动提醒
              </button>
            </div>
          </div>

          {/* 股票信息 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              股票代码
            </label>
            <input
              type="text"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              placeholder="例如：000001"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              股票名称
            </label>
            <input
              type="text"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="例如：平安银行"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              required
            />
          </div>

          {/* 价格提醒条件 */}
          {alertType === 'price' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  目标价格（元）
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="例如：15.00"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  触发方向
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDirection('up')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: direction === 'up' ? '#52c41a' : '#fff',
                      color: direction === 'up' ? '#fff' : '#666',
                      border: `1px solid ${direction === 'up' ? '#52c41a' : '#d9d9d9'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📈 上涨到
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('down')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: direction === 'down' ? '#ff4d4f' : '#fff',
                      color: direction === 'down' ? '#fff' : '#666',
                      border: `1px solid ${direction === 'down' ? '#ff4d4f' : '#d9d9d9'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    📉 下跌到
                  </button>
                </div>
              </div>
            </>
          )}

          {/* 异动提醒条件 */}
          {alertType === 'abnormal' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  涨跌幅阈值（%）
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={changePercent}
                  onChange={(e) => setChangePercent(e.target.value)}
                  placeholder="例如：5"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  当涨跌幅超过此值时触发提醒
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  量比阈值
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={volumeRatio}
                  onChange={(e) => setVolumeRatio(e.target.value)}
                  placeholder="例如：3"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  当量比超过此值时触发提醒
                </div>
              </div>
            </>
          )}

          {/* 有效期 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              有效期（天）
            </label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="7">7天</option>
              <option value="15">15天</option>
              <option value="30">30天</option>
              <option value="60">60天</option>
              <option value="90">90天</option>
            </select>
          </div>

          {/* 通知渠道 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              通知方式
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'browser' as const, label: '🔔 浏览器通知', desc: '桌面通知提醒' },
                { key: 'sound' as const, label: '🔊 音效提醒', desc: '播放提示音' },
                { key: 'internal' as const, label: '💬 系统消息', desc: '页面内消息' }
              ].map(channel => (
                <label
                  key={channel.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    background: channels.includes(channel.key) ? '#e6f7ff' : '#fafafa',
                    border: `1px solid ${channels.includes(channel.key) ? '#1890ff' : '#d9d9d9'}`,
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={channels.includes(channel.key)}
                    onChange={() => toggleChannel(channel.key)}
                    style={{ marginRight: '12px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#333' }}>{channel.label}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{channel.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#fff',
                color: '#666',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                background: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              创建提醒
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAlertDialog;
