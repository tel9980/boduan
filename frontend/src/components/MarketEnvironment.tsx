import React from 'react';

interface MarketEnvData {
  status?: string;
  description?: string;
  advice?: string;
  statistics?: {
    total_stocks: number;
    up_count: number;
    down_count: number;
    up_ratio: number;
    avg_change: number;
    avg_volume_ratio: number;
  };
  timestamp?: string;
  // 兼容旧版本
  index_code?: string;
  index_name?: string;
  index_price?: number;
  index_change?: number;
  above_ma5?: boolean;
  market_sentiment?: 'bullish' | 'bearish' | 'neutral' | 'unknown';
  safe_to_buy?: boolean;
}

interface MarketEnvironmentProps {
  data: MarketEnvData | null;
}

const MarketEnvironment: React.FC<MarketEnvironmentProps> = ({ data }) => {
  if (!data) return null;

  // 如果是新版本数据（有status字段）
  if (data.status && data.statistics) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'strong_bull':
          return { bg: '#f6ffed', border: '#52c41a', icon: '🚀', text: '#389e0d' };
        case 'weak_bull':
          return { bg: '#e6f7ff', border: '#1890ff', icon: '📈', text: '#0050b3' };
        case 'sideways':
          return { bg: '#fffbe6', border: '#faad14', icon: '➡️', text: '#d46b08' };
        case 'weak_bear':
          return { bg: '#fff1f0', border: '#ff7875', icon: '📉', text: '#cf1322' };
        case 'strong_bear':
          return { bg: '#fff0f0', border: '#ff4d4f', icon: '⚠️', text: '#a8071a' };
        default:
          return { bg: '#f5f5f5', border: '#d9d9d9', icon: '❓', text: '#595959' };
      }
    };

    const colors = getStatusColor(data.status);

    return (
      <div style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px' }}>{colors.icon}</span>
              <h3 style={{ margin: 0, color: colors.text, fontSize: '18px', fontWeight: 'bold' }}>
                市场环境：{data.description}
              </h3>
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              💡 操作建议：{data.advice}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
            {data.timestamp}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>涨跌比</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.text }}>
              {data.statistics.up_count} / {data.statistics.down_count}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              ({data.statistics.up_ratio}%上涨)
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>平均涨幅</div>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: data.statistics.avg_change >= 0 ? '#f5222d' : '#52c41a' 
            }}>
              {data.statistics.avg_change >= 0 ? '+' : ''}{data.statistics.avg_change}%
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>平均量比</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
              {data.statistics.avg_volume_ratio}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>样本数量</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
              {data.statistics.total_stocks}只
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 兼容旧版本数据
  return null;
};

export default MarketEnvironment;
