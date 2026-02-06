import React from 'react';
import type { ScreenedStock } from '../api/stock';
import StockMiniChart from './StockMiniChart';

interface StockCardProps {
  stock: ScreenedStock;
}

const StockCard: React.FC<StockCardProps> = ({ stock }) => {
  return (
    <div style={{background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
         <div>
            <div style={{fontSize: '18px', fontWeight: 'bold', color: '#333'}}>{stock.name}</div>
            <div style={{fontSize: '13px', color: '#999'}}>{stock.code}</div>
         </div>
         <div style={{textAlign: 'right'}}>
            <div style={{fontSize: '20px', fontWeight: 'bold', color: (stock.beginner_score||60) >= 80 ? '#f5222d' : '#fa8c16'}}>
               {stock.beginner_score || 60}分
            </div>
            <div style={{fontSize: '12px', color: '#666'}}>推荐指数</div>
         </div>
      </div>
      
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', padding: '8px', background: '#f9f9f9', borderRadius: '4px'}}>
          <div style={{textAlign: 'center'}}>
             <div style={{fontSize: '12px', color: '#666'}}>最新价</div>
             <div style={{fontWeight: 'bold', color: '#f5222d'}}>¥{stock.price.toFixed(2)}</div>
          </div>
          <div style={{textAlign: 'center'}}>
             <div style={{fontSize: '12px', color: '#666'}}>涨幅</div>
             <div style={{color: '#f5222d', fontWeight: 'bold'}}>+{stock.change_percent.toFixed(2)}%</div>
          </div>
          <div style={{textAlign: 'center'}}>
             <div style={{fontSize: '12px', color: '#666'}}>量比</div>
             <div style={{fontWeight: 'bold'}}>{stock.volume_ratio.toFixed(2)}</div>
          </div>
      </div>

      <div style={{marginBottom: '10px'}}>
         {stock.beginner_tags?.map(tag => (
            <span key={tag} style={{display: 'inline-block', background: '#e6f7ff', color: '#1890ff', border: '1px solid #91d5ff', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', marginRight: '6px', marginBottom: '4px'}}>
              {tag}
            </span>
         ))}
      </div>

      {stock.operation_suggestion && (
         <div style={{marginBottom: '10px', padding: '10px', background: stock.operation_suggestion.action === '强烈推荐' ? '#f6ffed' : '#fffbe6', border: '1px solid', borderColor: stock.operation_suggestion.action === '强烈推荐' ? '#b7eb8f' : '#ffe58f', borderRadius: '4px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px'}}>
               <strong style={{color: stock.operation_suggestion.action === '强烈推荐' ? '#52c41a' : '#fa8c16', fontSize: '14px'}}>
                  {stock.operation_suggestion.action}
               </strong>
               <span style={{
                   padding: '1px 5px', 
                   borderRadius: '3px', 
                   fontSize: '11px',
                   background: stock.operation_suggestion.risk_level === '高' ? '#fff1f0' : (stock.operation_suggestion.risk_level === '低' ? '#f6ffed' : '#fffbe6'),
                   color: stock.operation_suggestion.risk_level === '高' ? '#cf1322' : (stock.operation_suggestion.risk_level === '低' ? '#389e0d' : '#d46b08'),
                   border: '1px solid currentColor'
               }}>
                  {stock.operation_suggestion.risk_level}风险
               </span>
            </div>
            
            <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>
               建议: {stock.operation_suggestion.reason}
            </div>

            <div style={{fontSize: '12px', color: '#666', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '6px', marginTop: '6px'}}>
                <span>参考买点: <strong style={{color: '#333'}}>{stock.operation_suggestion.buy_point > 0 ? stock.operation_suggestion.buy_point.toFixed(2) : '-'}</strong></span>
                <span>止损: <span style={{color: '#cf1322'}}>{stock.operation_suggestion.stop_loss > 0 ? stock.operation_suggestion.stop_loss.toFixed(2) : '-'}</span></span>
            </div>
         </div>
      )}

      {stock.kline && stock.kline.length > 0 && (
          <div style={{marginBottom: '10px', height: '150px', border: '1px solid #f0f0f0', borderRadius: '4px', overflow: 'hidden'}}>
              <StockMiniChart kline={stock.kline} height="150px" />
          </div>
      )}
      
      {stock.ai_analysis && (
         <div style={{fontSize: '13px', color: '#666', lineHeight: '1.5', borderTop: '1px dashed #eee', paddingTop: '8px'}}>
            💡 {stock.ai_analysis}
         </div>
      )}
    </div>
  );
};

export default StockCard;
