import React, { useState } from 'react';
import type { ScreenedStock } from '../api/stock';
import StockMiniChart from './StockMiniChart';
import StockDetail from './StockDetail';
import MiniKLine from './MiniKLine';

interface StockCardProps {
  stock: ScreenedStock;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  const [showDetail, setShowDetail] = useState(false);

  // 根据评分确定卡片边框颜色
  const getBorderColor = (score: number) => {
    if (score >= 80) return '#52c41a';  // 绿色 - 优质
    if (score >= 70) return '#1890ff';  // 蓝色 - 良好
    if (score >= 60) return '#fa8c16';  // 橙色 - 一般
    return '#ff4d4f';  // 红色 - 较差
  };

  const score = stock.score || stock.beginner_score || 60;
  const borderColor = getBorderColor(score);

  return (
    <>
      <div style={{
        background: '#fff', 
        padding: '15px', 
        borderRadius: '8px', 
        border: `2px solid ${borderColor}`, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={() => setShowDetail(true)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
      }}
      >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
         <div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '4px'}}>{stock.name}</div>
            <div style={{fontSize: '13px', color: '#999'}}>{stock.code}</div>
            <div style={{display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap'}}>
              {stock.board_type && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: stock.board_type.color,
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {stock.board_type.name}
                </span>
              )}
              {stock.industry && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: '#f0f0f0',
                  color: '#666',
                  border: '1px solid #d9d9d9'
                }}>
                  🏭 {stock.industry}
                </span>
              )}
            </div>
         </div>
         <div style={{textAlign: 'right'}}>
            <div style={{
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: borderColor,
              marginBottom: '2px'
            }}>
               {score}分
            </div>
            <div style={{fontSize: '11px', color: '#999'}}>
              {score >= 80 ? '🏆 优质' : score >= 70 ? '💎 良好' : score >= 60 ? '⚡ 一般' : '⚠️ 较差'}
            </div>
         </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '10px', background: '#fafafa', borderRadius: '6px'}}>
          <div style={{textAlign: 'center', flex: 1}}>
             <div style={{fontSize: '11px', color: '#999', marginBottom: '4px'}}>最新价</div>
             <div style={{fontSize: '16px', fontWeight: 'bold', color: '#f5222d'}}>¥{stock.price.toFixed(2)}</div>
          </div>
          <div style={{textAlign: 'center', flex: 1, borderLeft: '1px solid #e8e8e8', borderRight: '1px solid #e8e8e8'}}>
             <div style={{fontSize: '11px', color: '#999', marginBottom: '4px'}}>涨幅</div>
             <div style={{
               fontSize: '16px',
               color: stock.change_percent >= 0 ? '#f5222d' : '#52c41a', 
               fontWeight: 'bold'
             }}>
               {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
             </div>
          </div>
          <div style={{textAlign: 'center', flex: 1}}>
             <div style={{fontSize: '11px', color: '#999', marginBottom: '4px'}}>量比</div>
             <div style={{fontSize: '16px', fontWeight: 'bold', color: '#333'}}>{stock.volume_ratio.toFixed(2)}</div>
          </div>
      </div>

      {/* 融资融券信息 */}
      {stock.margin_info && stock.margin_info.is_margin_eligible && (
        <div style={{
          marginBottom: '10px', 
          padding: '8px', 
          background: '#e6f7ff', 
          border: '1px solid #91d5ff',
          borderRadius: '4px'
        }}>
          <div style={{fontSize: '12px', color: '#0050b3', fontWeight: 'bold', marginBottom: '4px'}}>
            💎 融资融券标的 (评分: {stock.margin_info.margin_score})
          </div>
          <div style={{fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between'}}>
            <span>余额: {stock.margin_info.margin_balance}亿</span>
            <span>净流: {stock.margin_info.net_flow >= 0 ? '+' : ''}{stock.margin_info.net_flow}亿</span>
            <span>占比: {stock.margin_info.margin_ratio}%</span>
          </div>
        </div>
      )}

      {/* 推荐理由 */}
      {stock.reasons && stock.reasons.length > 0 && (
        <div style={{marginBottom: '10px'}}>
          {stock.reasons.slice(0, 3).map((reason, idx) => (
            <div key={idx} style={{
              fontSize: '12px', 
              color: '#52c41a', 
              marginBottom: '4px',
              padding: '4px 8px',
              background: '#f6ffed',
              borderRadius: '4px',
              border: '1px solid #b7eb8f'
            }}>
              {reason}
            </div>
          ))}
        </div>
      )}

      {/* 迷你K线图 */}
      {stock.kline && stock.kline.length > 0 && (
        <div style={{
          marginBottom: '12px',
          padding: '10px',
          background: '#fafafa',
          borderRadius: '6px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{fontSize: '12px', color: '#999', marginBottom: '6px'}}>近期走势</div>
          <MiniKLine data={stock.kline} width={250} height={60} />
        </div>
      )}

      {/* 买卖点建议 */}
      {stock.trade_points && (
        <div style={{
          marginBottom: '10px',
          padding: '10px',
          background: '#e6f7ff',
          borderRadius: '6px',
          border: '1px solid #91d5ff'
        }}>
          <div style={{fontSize: '12px', fontWeight: 'bold', color: '#0050b3', marginBottom: '8px'}}>
            📍 交易建议
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px'}}>
            <div>
              <div style={{color: '#999', marginBottom: '2px'}}>买入价</div>
              <div style={{fontWeight: 'bold', color: '#1890ff'}}>
                ¥{stock.trade_points.buy_price?.toFixed(2)}
              </div>
              <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                {stock.trade_points.buy_timing}
              </div>
            </div>
            <div>
              <div style={{color: '#999', marginBottom: '2px'}}>止损价</div>
              <div style={{fontWeight: 'bold', color: '#ff4d4f'}}>
                ¥{stock.trade_points.stop_loss?.toFixed(2)}
              </div>
              <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                {stock.trade_points.stop_loss_percent?.toFixed(1)}%
              </div>
            </div>
            <div>
              <div style={{color: '#999', marginBottom: '2px'}}>目标价</div>
              <div style={{fontWeight: 'bold', color: '#52c41a'}}>
                ¥{stock.trade_points.target_price?.toFixed(2)}
              </div>
              <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                +{stock.trade_points.target_percent?.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px dashed #91d5ff',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            盈亏比 1:{stock.trade_points.risk_reward_ratio?.toFixed(2)}
          </div>
        </div>
      )}

      {/* AI 智能分析 */}
      {stock.ai_analysis && (
        <div style={{
          marginTop: '12px',
          marginBottom: '12px',
          padding: '12px',
          background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
          borderRadius: '8px',
          color: 'white',
          boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: 0.95
          }}>
            <span style={{fontSize: '16px'}}>🤖</span>
            <span>AI 智能分析</span>
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px',
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '3px'
            }}>
              GLM-4-Flash
            </span>
          </div>
          <div style={{
            fontSize: '13px',
            lineHeight: '1.7',
            opacity: 0.95,
            whiteSpace: 'pre-wrap'
          }}>
            {stock.ai_analysis}
          </div>
        </div>
      )}

      {/* 风险提示 */}
      {stock.warnings && stock.warnings.length > 0 && (
        <div style={{marginBottom: '10px'}}>
          {stock.warnings.slice(0, 2).map((warning, idx) => (
            <div key={idx} style={{
              fontSize: '12px', 
              color: '#ff4d4f', 
              marginBottom: '4px',
              padding: '4px 8px',
              background: '#fff1f0',
              borderRadius: '4px',
              border: '1px solid #ffa39e'
            }}>
              {warning}
            </div>
          ))}
        </div>
      )}

      {stock.operation_suggestion && (
         <div style={{
           marginBottom: '10px', 
           padding: '10px', 
           background: stock.operation_suggestion.action === '强烈推荐' ? '#f6ffed' : '#fffbe6', 
           border: '1px solid', 
           borderColor: stock.operation_suggestion.action === '强烈推荐' ? '#b7eb8f' : '#ffe58f', 
           borderRadius: '6px'
         }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
               <strong style={{color: stock.operation_suggestion.action === '强烈推荐' ? '#52c41a' : '#fa8c16', fontSize: '14px'}}>
                  {stock.operation_suggestion.action}
               </strong>
               <span style={{
                   padding: '2px 6px', 
                   borderRadius: '3px', 
                   fontSize: '11px',
                   background: stock.operation_suggestion.risk_level === '高' ? '#fff1f0' : (stock.operation_suggestion.risk_level === '低' ? '#f6ffed' : '#fffbe6'),
                   color: stock.operation_suggestion.risk_level === '高' ? '#cf1322' : (stock.operation_suggestion.risk_level === '低' ? '#389e0d' : '#d46b08'),
                   border: '1px solid currentColor',
                   fontWeight: 'bold'
               }}>
                  {stock.operation_suggestion.risk_level}风险
               </span>
            </div>
            
            <div style={{fontSize: '12px', color: '#666', marginBottom: '6px'}}>
               {stock.operation_suggestion.reason}
            </div>

            <div style={{fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '6px', marginTop: '6px'}}>
                <span>参考买点: <strong style={{color: '#52c41a'}}>{stock.operation_suggestion.buy_point > 0 ? stock.operation_suggestion.buy_point.toFixed(2) : '-'}</strong></span>
                <span>止损: <strong style={{color: '#cf1322'}}>{stock.operation_suggestion.stop_loss > 0 ? stock.operation_suggestion.stop_loss.toFixed(2) : '-'}</strong></span>
            </div>
         </div>
      )}

      {stock.kline && stock.kline.length > 0 && (
          <div style={{marginBottom: '10px', height: '150px', border: '1px solid #f0f0f0', borderRadius: '4px', overflow: 'hidden'}}>
              <StockMiniChart kline={stock.kline} height="150px" />
          </div>
      )}
      
      {stock.ai_analysis && (
         <div style={{fontSize: '12px', color: '#666', lineHeight: '1.6', borderTop: '1px dashed #eee', paddingTop: '8px', background: '#fafafa', padding: '8px', borderRadius: '4px'}}>
            💡 {stock.ai_analysis}
         </div>
      )}
    </div>

    {/* 股票详情弹窗 */}
    {showDetail && (
      <StockDetail stock={stock} onClose={() => setShowDetail(false)} />
    )}
  </>
  );
};

export default StockCard;
