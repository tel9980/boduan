import type { ScreenedStock } from '../api/stock';

/**
 * 导出股票数据为CSV格式
 */
export function exportToCSV(stocks: ScreenedStock[], filename: string = 'stocks.csv') {
  if (!stocks || stocks.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // CSV表头
  const headers = [
    '股票代码',
    '股票名称',
    '最新价',
    '涨跌幅(%)',
    '量比',
    '换手率(%)',
    '流通市值(亿)',
    '成交额(亿)',
    '评分',
    '风险等级',
    '操作建议',
    '融资融券',
    '融资余额(亿)',
    '融资净流入(亿)',
    '板块'
  ];

  // 转换数据
  const rows = stocks.map(stock => [
    stock.code,
    stock.name,
    stock.price.toFixed(2),
    stock.change_percent.toFixed(2),
    stock.volume_ratio.toFixed(2),
    stock.turnover.toFixed(2),
    stock.market_cap.toFixed(1),
    (stock.amount / 100000000).toFixed(2),
    stock.score?.toFixed(1) || stock.beginner_score || '-',
    stock.risk_level || '-',
    stock.operation_suggestion?.action || '-',
    stock.margin_info?.is_margin_eligible ? '是' : '否',
    stock.margin_info?.margin_balance?.toFixed(2) || '-',
    stock.margin_info?.net_flow?.toFixed(3) || '-',
    stock.board_type?.name || '-'
  ]);

  // 组合CSV内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // 添加BOM以支持Excel正确显示中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 导出市场环境数据为JSON
 */
export function exportMarketEnvToJSON(marketEnv: any, filename: string = 'market_environment.json') {
  if (!marketEnv) {
    alert('没有市场环境数据可导出');
    return;
  }

  const jsonContent = JSON.stringify(marketEnv, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 复制股票代码到剪贴板
 */
export async function copyStockCodes(stocks: ScreenedStock[]) {
  if (!stocks || stocks.length === 0) {
    alert('没有股票代码可复制');
    return;
  }

  const codes = stocks.map(s => s.code).join(',');
  
  try {
    await navigator.clipboard.writeText(codes);
    alert(`已复制${stocks.length}只股票代码到剪贴板`);
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = codes;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    alert(`已复制${stocks.length}只股票代码到剪贴板`);
  }
}

/**
 * 导出股票数据为JSON格式
 */
export function exportToJSON(stocks: ScreenedStock[], filename: string = 'stocks.json') {
  if (!stocks || stocks.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const jsonContent = JSON.stringify(stocks, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 导出筛选历史为JSON格式
 */
export function exportHistoryToJSON(history: any[], filename: string = 'screening_history.json') {
  if (!history || history.length === 0) {
    alert('没有历史记录可导出');
    return;
  }

  const jsonContent = JSON.stringify(history, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * 导出为Excel格式（实际是CSV，但Excel可以打开）
 */
export function exportToExcel(stocks: ScreenedStock[], filename: string = 'stocks.xlsx') {
  // 使用CSV格式，但文件名为.xlsx，Excel会自动识别
  exportToCSV(stocks, filename.replace('.xlsx', '.csv'));
}
