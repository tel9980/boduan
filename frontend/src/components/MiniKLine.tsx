/**
 * 迷你K线图组件 - 用于股票卡片
 */
import React from 'react';

interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface MiniKLineProps {
  data: KLineData[];
  width?: number;
  height?: number;
}

const MiniKLine: React.FC<MiniKLineProps> = ({ data, width = 200, height = 60 }) => {
  if (!data || data.length === 0) return null;

  // 计算价格范围
  const prices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  
  // 计算每根K线的宽度
  const barWidth = width / data.length;
  const padding = 2;

  // 价格转换为Y坐标
  const priceToY = (price: number) => {
    return height - ((price - minPrice) / priceRange) * height;
  };

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((item, index) => {
        const x = index * barWidth + padding;
        const isUp = item.close >= item.open;
        const color = isUp ? '#ef4444' : '#22c55e';
        
        const highY = priceToY(item.high);
        const lowY = priceToY(item.low);
        const openY = priceToY(item.open);
        const closeY = priceToY(item.close);
        
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(closeY - openY) || 1;
        
        return (
          <g key={index}>
            {/* 上下影线 */}
            <line
              x1={x + barWidth / 2 - padding}
              y1={highY}
              x2={x + barWidth / 2 - padding}
              y2={lowY}
              stroke={color}
              strokeWidth="1"
            />
            {/* K线实体 */}
            <rect
              x={x}
              y={bodyTop}
              width={barWidth - padding * 2}
              height={bodyHeight}
              fill={isUp ? color : 'transparent'}
              stroke={color}
              strokeWidth="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default MiniKLine;
