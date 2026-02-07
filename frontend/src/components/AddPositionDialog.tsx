/**
 * 添加持仓对话框
 * 用于添加新的持仓记录
 */

import React, { useState, useEffect } from 'react';
import { PortfolioManager } from '../services/PortfolioManager';

interface AddPositionDialogProps {
  portfolioManager: PortfolioManager;
  onClose: () => void;
  onSuccess?: () => void;
  defaultStock?: { code: string; name: string; price?: number };
}

const AddPositionDialog: React.FC<AddPositionDialogProps> = ({
  portfolioManager,
  onClose,
  onSuccess,
  defaultStock
}) => {
  const [stockCode, setStockCode] = useState(defaultStock?.code || '');
  const [stockName, setStockName] = useState(defaultStock?.name || '');
  const [currentPrice, setCurrentPrice] = useState(defaultStock?.price?.toString() || '');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [notes, setNotes] = useState('');

  // 自动计算止损止盈
  useEffect(() => {
    if (autoCalculate && buyPrice) {
      const price = parseFloat(buyPrice);
      if (!isNaN(price)) {
        // 止损：-5%
        setStopLoss((price * 0.95).toFixed(2));
        // 止盈：+15%
        setTakeProfit((price * 1.15).toFixed(2));
      }
    }
  }, [buyPrice, autoCalculate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode || !stockName || !buyPrice || !quantity) {
      alert('请填写所有必填项');
      return;
    }

    const buyPriceNum = parseFloat(buyPrice);
    const quantityNum = parseInt(quantity);
    const currentPriceNum = currentPrice ? parseFloat(currentPrice) : buyPriceNum;

    if (isNaN(buyPriceNum) || buyPriceNum <= 0) {
      alert('请输入有效的买入价格');
      return;
    }

    if (isNaN(quantityNum) || quantityNum <= 0) {
      alert('请输入有效的数量');
      return;
    }

    const position = {
      stockCode: stockCode.trim(),
      stockName: stockName.trim(),
      buyPrice: buyPriceNum,
      quantity: quantityNum,
      buyDate,
      currentPrice: currentPriceNum,
      stopLoss: stopLoss ? parseFloat(stopLoss) : buyPriceNum * 0.95,
      takeProfit: takeProfit ? parseFloat(takeProfit) : buyPriceNum * 1.15,
      notes: notes.trim() || undefined
    };

    portfolioManager.addPosition(position);

    if (onSuccess) {
      onSuccess();
    }

    onClose();
  };

  const getTotalCost = (): string => {
    const price = parseFloat(buyPrice);
    const qty = parseInt(quantity);
    if (!isNaN(price) && !isNaN(qty)) {
      return (price * qty).toFixed(2);
    }
    return '0.00';
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
        zIndex: 1002,
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
          maxHeight: '85vh',
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
            ➕ 添加持仓
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
          {/* 股票信息 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              股票代码 <span style={{ color: '#ff4d4f' }}>*</span>
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
              股票名称 <span style={{ color: '#ff4d4f' }}>*</span>
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              当前价格（元）
            </label>
            <input
              type="number"
              step="0.01"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(e.target.value)}
              placeholder="例如：15.00"
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
              留空则使用买入价格
            </div>
          </div>

          {/* 买入信息 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              买入价格（元）<span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={buyPrice}
              onChange={(e) => setBuyPrice(e.target.value)}
              placeholder="例如：14.50"
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
              数量（股）<span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="number"
              step="100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="例如：1000"
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
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              A股最小交易单位为100股
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              买入日期 <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input
              type="date"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
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

          {/* 总成本显示 */}
          <div
            style={{
              padding: '12px',
              background: '#f0f0f0',
              borderRadius: '6px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>总成本</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                ¥{getTotalCost()}
              </span>
            </div>
          </div>

          {/* 止损止盈设置 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                自动计算止损止盈（建议开启）
              </span>
            </label>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              止损价格（元）
            </label>
            <input
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => {
                setStopLoss(e.target.value);
                setAutoCalculate(false);
              }}
              placeholder="例如：13.78"
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
              建议设置为买入价的95%（-5%）
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              止盈价格（元）
            </label>
            <input
              type="number"
              step="0.01"
              value={takeProfit}
              onChange={(e) => {
                setTakeProfit(e.target.value);
                setAutoCalculate(false);
              }}
              placeholder="例如：16.68"
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
              建议设置为买入价的115%（+15%）
            </div>
          </div>

          {/* 提示信息 */}
          <div
            style={{
              padding: '12px',
              background: '#e6f7ff',
              border: '1px solid #91d5ff',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#0050b3',
              lineHeight: '1.6'
            }}
          >
            💡 设置止损止盈后，系统会自动创建价格提醒，当股价触及目标价时会通知您
          </div>

          {/* 备注 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
              备注
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录买入理由、操作计划等..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
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
              添加持仓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPositionDialog;
