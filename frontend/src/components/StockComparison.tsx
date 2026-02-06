/**
 * 股票对比表格组件
 */
import React from 'react';
import type { ScreenedStock } from '../api/stock';

interface StockComparisonProps {
  stocks: ScreenedStock[];
}

const StockComparison: React.FC<StockComparisonProps> = ({ stocks }) => {
  if (!stocks || stocks.length === 0) return null;

  return (
    <div style={{
      marginTop: '20px',
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#333',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>📊</span>
        横向对比分析
      </h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={headerStyle}>指标</th>
              {stocks.map((stock, index) => (
                <th key={stock.code} style={headerStyle}>
                  {stock.name}
                  <div style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                    {stock.code}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cellStyle}>综合评分</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: stock.score >= 80 ? '#52c41a' : stock.score >= 60 ? '#faad14' : '#ff4d4f'
                  }}>
                    {stock.score?.toFixed(1) || '-'}
                  </span>
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={cellStyle}>板块/行业</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <div>{stock.board_type?.name || '-'}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {stock.industry || '-'}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellStyle}>当前价</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{ fontWeight: 'bold' }}>
                    ¥{stock.price.toFixed(2)}
                  </span>
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={cellStyle}>涨跌幅</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{
                    color: stock.change_percent >= 0 ? '#ef4444' : '#22c55e',
                    fontWeight: 'bold'
                  }}>
                    {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellStyle}>量比</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  {stock.volume_ratio.toFixed(2)}
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={cellStyle}>换手率</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  {stock.turnover.toFixed(2)}%
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellStyle}>流通市值</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  {stock.market_cap.toFixed(1)}亿
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={cellStyle}>融资融券</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  {stock.margin_info?.is_margin_eligible ? (
                    <span style={{ color: '#52c41a' }}>
                      ✓ 评分{stock.margin_info.margin_score}
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellStyle}>资金流向</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  {stock.capital_flow?.has_data ? (
                    <span style={{
                      color: stock.capital_flow.is_inflow ? '#ef4444' : '#22c55e'
                    }}>
                      {stock.capital_flow.is_inflow ? '流入' : '流出'}
                      {Math.abs(stock.capital_flow.main_inflow).toFixed(2)}亿
                    </span>
                  ) : '-'}
                </td>
              ))}
            </tr>
            <tr style={{ background: '#e6f7ff', fontWeight: 'bold' }}>
              <td style={cellStyle}>建议买入价</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{ color: '#1890ff', fontSize: '15px' }}>
                    ¥{stock.trade_points?.buy_price?.toFixed(2) || '-'}
                  </span>
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fff1f0' }}>
              <td style={cellStyle}>止损价</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{ color: '#ff4d4f' }}>
                    ¥{stock.trade_points?.stop_loss?.toFixed(2) || '-'}
                  </span>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    ({stock.trade_points?.stop_loss_percent?.toFixed(1)}%)
                  </div>
                </td>
              ))}
            </tr>
            <tr style={{ background: '#f6ffed' }}>
              <td style={cellStyle}>目标价</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{ color: '#52c41a' }}>
                    ¥{stock.trade_points?.target_price?.toFixed(2) || '-'}
                  </span>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    (+{stock.trade_points?.target_percent?.toFixed(1)}%)
                  </div>
                </td>
              ))}
            </tr>
            <tr style={{ background: '#fafafa' }}>
              <td style={cellStyle}>盈亏比</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{
                    fontWeight: 'bold',
                    color: stock.trade_points?.risk_reward_ratio >= 1.5 ? '#52c41a' : '#faad14'
                  }}>
                    1:{stock.trade_points?.risk_reward_ratio?.toFixed(2) || '-'}
                  </span>
                </td>
              ))}
            </tr>
            <tr>
              <td style={cellStyle}>买入时机</td>
              {stocks.map(stock => (
                <td key={stock.code} style={cellStyle}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: stock.trade_points?.buy_timing === '立即买入' ? '#e6f7ff' : '#fffbe6',
                    color: stock.trade_points?.buy_timing === '立即买入' ? '#1890ff' : '#faad14'
                  }}>
                    {stock.trade_points?.buy_timing || '-'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#e6f7ff',
        borderRadius: '6px',
        fontSize: '13px',
        color: '#0050b3'
      }}>
        💡 <strong>对比说明：</strong>
        综合评分越高越好 | 盈亏比≥1.5为优秀 | 建议分散投资，不要集中单一板块或行业
      </div>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'center',
  fontWeight: 'bold',
  borderBottom: '2px solid #e8e8e8',
  color: '#333'
};

const cellStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'center',
  borderBottom: '1px solid #f0f0f0'
};

export default StockComparison;
