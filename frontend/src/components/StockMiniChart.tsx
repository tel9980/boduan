import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface StockMiniChartProps {
  kline: {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    boll_upper?: number;
    boll_mid?: number;
    boll_lower?: number;
  }[];
  width?: string;
  height?: string;
}

const StockMiniChart: React.FC<StockMiniChartProps> = ({ kline, width = '100%', height = '180px' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || !kline || kline.length === 0) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const dates = kline.map(item => item.date);
    const data = kline.map(item => [item.open, item.close, item.low, item.high]);
    const bollUpper = kline.map(item => item.boll_upper);
    const bollMid = kline.map(item => item.boll_mid);
    const bollLower = kline.map(item => item.boll_lower);

    const option = {
      grid: {
        left: '2%',
        right: '2%',
        top: '5%',
        bottom: '10%',
        containLabel: false
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false }
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false }
      },
      series: [
        {
          type: 'candlestick',
          data: data,
          itemStyle: {
            color: '#ef232a',
            color0: '#14b143',
            borderColor: '#ef232a',
            borderColor0: '#14b143'
          },
          barWidth: '60%'
        },
        {
          name: 'BOLL Upper',
          type: 'line',
          data: bollUpper,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#ccc',
            opacity: 0.5
          }
        },
        {
          name: 'BOLL Mid',
          type: 'line',
          data: bollMid,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#aaa',
            type: 'dashed'
          }
        },
        {
          name: 'BOLL Lower',
          type: 'line',
          data: bollLower,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1,
            color: '#ccc',
            opacity: 0.5
          }
        }
      ]
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [kline]);

  return <div ref={chartRef} style={{ width, height }} />;
};

export default StockMiniChart;
