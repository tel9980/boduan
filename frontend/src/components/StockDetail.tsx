import React, { useState, useEffect } from 'react';
import type { ScreenedStock } from '../api/stock';
import { addFavorite, removeFavorite, isFavorite } from '../utils/localStorage';

interface StockDetailProps {
  stock: ScreenedStock;
  onClose: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ stock, onClose }) => {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    setIsFav(isFavorite(stock.code));
  }, [stock.code]);

  const handleToggleFavorite = () => {
    if (isFav) {
      if (removeFavorite(stock.code)) {
        setIsFav(false);
        alert('已从自选股中移除');
      }
    } else {
      if (addFavorite({ code: stock.code, name: stock.name })) {
        setIsFav(true);
        alert('已添加到自选股');
      } else {
        alert('该股票已在自选股中');
      }
    }
  };

  return (
    <div style={{
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
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}
      onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#fff',
          zIndex: 1
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              {stock.name}
              <span style={{ fontSize: '16px', color: '#999', marginLeft: '12px' }}>
                {stock.code}
              </span>
            </h2>
            {stock.board_type && (
              <span style={{
                display: 'inline-block',
                marginTop: '8px',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                background: stock.board_type.color,
                color: '#fff'
              }}>
                {stock.board_type.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleToggleFavorite}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: isFav ? '1px solid #faad14' : '1px solid #d9d9d9',
                background: isFav ? '#fffbe6' : '#fff',
                color: isFav ? '#faad14' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isFav ? '⭐ 已自选' : '☆ 加自选'}
            </button>
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
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.color = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#999';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div style={{ padding: '20px' }}>
          {/* 价格信息 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>最新价</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f5222d' }}>
                ¥{stock.price.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>涨跌幅</div>
              <div style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: stock.change_percent >= 0 ? '#f5222d' : '#52c41a'
              }}>
                {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>量比</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                {stock.volume_ratio.toFixed(2)}
              </div>
            </div>
          </div>

          {/* 详细数据 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
              <span style={{ color: '#999', fontSize: '14px' }}>流通市值：</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{stock.market_cap.toFixed(1)}亿</span>
            </div>
            <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
              <span style={{ color: '#999', fontSize: '14px' }}>换手率：</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{stock.turnover.toFixed(2)}%</span>
            </div>
            <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
              <span style={{ color: '#999', fontSize: '14px' }}>成交额：</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {(stock.amount / 100000000).toFixed(2)}亿
              </span>
            </div>
            <div style={{ padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
              <span style={{ color: '#999', fontSize: '14px' }}>成交量：</span>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                {(stock.volume / 10000).toFixed(0)}万手
              </span>
            </div>
          </div>

          {/* 融资融券信息 */}
          {stock.margin_info && stock.margin_info.is_margin_eligible && (
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#e6f7ff',
              border: '2px solid #91d5ff',
              borderRadius: '8px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#0050b3', fontSize: '16px' }}>
                💎 融资融券信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>融资余额</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0050b3' }}>
                    {stock.margin_info.margin_balance}亿
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>融资净流入</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: stock.margin_info.net_flow >= 0 ? '#52c41a' : '#ff4d4f'
                  }}>
                    {stock.margin_info.net_flow >= 0 ? '+' : ''}{stock.margin_info.net_flow}亿
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>融资占比</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0050b3' }}>
                    {stock.margin_info.margin_ratio}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>综合评分</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0050b3' }}>
                    {stock.margin_info.margin_score}分
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 推荐理由 */}
          {stock.reasons && stock.reasons.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
                ✨ 推荐理由
              </h3>
              {stock.reasons.map((reason, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: '6px',
                  color: '#52c41a',
                  fontSize: '14px'
                }}>
                  {reason}
                </div>
              ))}
            </div>
          )}

          {/* 风险提示 */}
          {stock.warnings && stock.warnings.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#333' }}>
                ⚠️ 风险提示
              </h3>
              {stock.warnings.map((warning, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  marginBottom: '8px',
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: '6px',
                  color: '#ff4d4f',
                  fontSize: '14px'
                }}>
                  {warning}
                </div>
              ))}
            </div>
          )}

          {/* 操作建议 */}
          {stock.operation_suggestion && (
            <div style={{
              padding: '16px',
              background: stock.operation_suggestion.action === '强烈推荐' ? '#f6ffed' : '#fffbe6',
              border: '2px solid',
              borderColor: stock.operation_suggestion.action === '强烈推荐' ? '#52c41a' : '#faad14',
              borderRadius: '8px'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '18px',
                color: stock.operation_suggestion.action === '强烈推荐' ? '#52c41a' : '#fa8c16'
              }}>
                {stock.operation_suggestion.action}
              </h3>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                {stock.operation_suggestion.reason}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                <div style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>参考买点</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {stock.operation_suggestion.buy_point > 0 ? stock.operation_suggestion.buy_point.toFixed(2) : '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>止损价</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {stock.operation_suggestion.stop_loss > 0 ? stock.operation_suggestion.stop_loss.toFixed(2) : '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'center', padding: '12px', background: '#fff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>风险等级</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: stock.operation_suggestion.risk_level === '高' ? '#ff4d4f' : 
                           stock.operation_suggestion.risk_level === '低' ? '#52c41a' : '#faad14'
                  }}>
                    {stock.operation_suggestion.risk_level}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
