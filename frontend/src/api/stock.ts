/**
 * 股票API服务
 */
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 增加到300秒（5分钟），处理复杂分析
});

// 创建可取消的请求控制器
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

// 筛选后的股票信息
export interface ScreenedStock {
  code: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume_ratio: number;
  turnover: number;
  market_cap: number;
  amount: number;
  volume: number;
  main_inflow?: number;
  ai_analysis?: string;  // 新增：AI 智能分析
  beginner_score?: number;
  beginner_tags?: string[];
  score?: number;  // 新增：波段交易评分
  risk_level?: string;  // 新增：风险等级
  reasons?: string[];  // 新增：推荐理由
  warnings?: string[];  // 新增：风险提示
  industry?: string;  // 新增：行业
  trade_points?: {  // 新增：买卖点建议
    buy_price: number;
    buy_timing: string;
    stop_loss: number;
    stop_loss_percent: number;
    target_price: number;
    target_percent: number;
    risk_reward_ratio: number;
  };
  margin_info?: {  // 新增：融资融券信息
    is_margin_eligible: boolean;
    margin_balance: number;
    short_balance: number;
    margin_ratio: number;
    net_flow: number;
    margin_score: number;
    has_data: boolean;
  };
  capital_flow?: {  // 新增：资金流向
    main_inflow: number;
    is_inflow: boolean;
    flow_strength: string;
    has_data: boolean;
  };
  board_type?: {  // 新增：板块类型
    type: string;
    name: string;
    color: string;
    allowed?: boolean;
  };
  kline?: {
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
  operation_suggestion?: {
    action: string;
    risk_level: string;
    buy_point: number;
    stop_loss: number;
    target: number;
    reason: string;
  };
}

// 利空消息详情
export interface NegativeNewsItem {
  title: string;
  date: string;
  source: string;
  keywords: string[];
}

// 利空消息检测结果
export interface NegativeNewsInfo {
  has_negative_news: boolean;
  negative_count: number;
  total_news_count: number;
  negative_news: NegativeNewsItem[];
  risk_level: 'low' | 'medium' | 'high';
}

// 分时成交量数据项
export interface MinuteVolumeItem {
  time: string;
  price: number;
  volume: number;
  cum_volume: number;
}

// 分时数据结果（包含时间范围信息）
export interface MinuteVolumeResult {
  data: MinuteVolumeItem[];
  time_range: string;
  is_after_close: boolean;
  fetch_time: string;
}

// 尾盘走势分析
export interface TailTrend {
  trend: 'strong_up' | 'up' | 'stable' | 'down' | 'unknown';
  strength: number;
  tail_change?: number;
  tail_volume_ratio?: number;
  description: string;
}

// 上涨空间
export interface UpsideSpace {
  space: number;
  limit_price: number;
  current_change: number;
  near_limit: boolean;
  limit_rate: number;
}

// 资金流向
export interface CapitalFlow {
  main_inflow: number;
  is_inflow: boolean;
  flow_strength: string;
}

// 板块类型
export interface BoardType {
  type: 'kcb' | 'cyb' | 'sh' | 'sz' | 'other';
  name: string;
  color: string;
  risk_note: string;
}

// 融资融券信息
export interface MarginInfo {
  is_margin_eligible: boolean;
  margin_balance: number;
  short_balance: number;
  margin_ratio: number;
  net_flow: number;
  margin_score: number;
  has_data: boolean;
}

// 技术指标 (T+1短线版)
export interface TechnicalIndicators {
  tail_trend: TailTrend;
  upside_space: UpsideSpace;
  capital_flow: CapitalFlow;
  margin_info?: MarginInfo;  // 新增：融资融券信息
  open_probability: 'high' | 'medium' | 'low';
}

// AI精选股票
export interface AISelectedStock {
  code: string;
  name: string;
  price: number;
  change_percent: number;
  volume_ratio: number;
  market_cap: number;
  turnover: number;
  score: number;
  reasons: string[];
  warnings: string[];
  indicators: TechnicalIndicators;
  negative_news?: NegativeNewsInfo;
  minute_volume?: MinuteVolumeResult;
  board_type?: BoardType;
}

// 大盘环境
export interface MarketEnvironment {
  index_code?: string;  // 新增：指数代码
  index_name?: string;  // 新增：指数名称
  index_price: number;
  index_change: number;
  above_ma5: boolean;
  market_sentiment: 'bullish' | 'bearish' | 'neutral' | 'unknown';
  safe_to_buy: boolean;
}

// 开盘策略
export interface OpenStrategy {
  high_open_threshold: number;
  high_open_action: string;
  low_open_threshold: number;
  low_open_action: string;
  flat_open_action: string;
}

// 交易计划
export interface TradePlan {
  entry_price: number;
  entry_time: string;
  stop_loss_price: number;
  stop_loss_ratio: number;
  take_profit_price: number;
  take_profit_ratio: number;
  expected_return: number;
  hold_period: string;
  risk_reward_ratio: number;
  open_strategy?: OpenStrategy;  // 新增：开盘策略
}

// 最终单只精选股票
export interface FinalPick {
  rank?: number;  // 新增：排名（1/2/3）
  code: string;
  name: string;
  price: number;
  change_percent: number;
  volume_ratio: number;
  market_cap: number;
  turnover?: number;
  score?: number;
  open_probability?: 'high' | 'medium' | 'low';
  summary: string;
  reasons: string[];
  warnings: string[];
  tail_trend?: TailTrend;
  upside_space?: UpsideSpace;
  capital_flow?: CapitalFlow;
  negative_risk?: {
    has_negative_news: boolean;
    risk_level: 'low' | 'medium' | 'high';
    negative_count: number;
  };
  board_type?: BoardType;
  market_environment?: MarketEnvironment;
  trade_plan?: TradePlan;
  operation_tips?: string[];
  source?: 'ai' | 'technical';  // 新增：来源标识
  source_label?: string;  // 新增：来源显示文本
  concepts?: string[];  // 新增：概念标签
  is_hot_industry?: boolean;  // 新增：是否属于主力抢筹热门行业
}

// 过滤后的精选股票信息
export interface FilteredStock {
  code: string;
  name: string;
  price: number;
  change_percent: number;
  volume_ratio: number;
  market_cap: number;
  turnover?: number;
  amount?: number;
  ma5: number;
  support_level: number;
  analysis: {
    volume_pattern: string;
    price_position: string;
    sector: string;
  };
  negative_news?: NegativeNewsInfo;
  minute_volume?: MinuteVolumeResult;
  board_type?: BoardType;
  source?: 'ai' | 'technical';  // 新增：来源标识
  source_label?: string;  // 新增：来源显示文本
  concepts?: string[];  // 新增：概念标签
  is_hot_industry?: boolean;  // 新增：是否属于主力抢筹热门行业
}

// 分析结果
export interface AnalysisResult {
  code: string;
  name: string;
  price: number;
  change_percent: number;
  volume_ratio: number;
  market_cap: number;
  ma5: number;
  support_level: number;
  has_volume_pattern: boolean;
  above_ma5_high: boolean;
  is_digital_economy: boolean;
  qualified: boolean;
}

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  amount: number;
  high: number;
  low: number;
  open: number;
  pre_close: number;
  turnover?: number;
  volume_ratio?: number;
  pe_ratio?: number;
  total_value?: number;
  market_cap?: number;
}

export interface KLineItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount?: number;
  change_percent?: number;
}

export interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
  amount: number;
}

// 筛选股票
export async function screenStocks(params?: {
  change_min?: number;
  change_max?: number;
  volume_ratio_min?: number;
  volume_ratio_max?: number;
  market_cap_min?: number;
  market_cap_max?: number;
  limit?: number;
  include_cyb?: boolean;
  require_margin?: boolean;
}): Promise<{
  count: number;
  criteria: {
    change_range: string;
    volume_ratio_range: string;
    market_cap_range: string;
  };
  data: ScreenedStock[];
  cache_age_minutes?: number;  // 新增：缓存数据年龄（分钟）
  message?: string;  // 新增：提示信息
  market_environment?: {
    status: string;
    description: string;
    advice: string;
    statistics: {
      total_stocks: number;
      up_count: number;
      down_count: number;
      up_ratio: number;
      avg_change: number;
      avg_volume_ratio: number;
    };
    timestamp: string;
  };
}> {
  const response = await api.get('/screen', { params });
  return response.data;
}

// 波段交易筛选响应
export interface BandTradingResponse {
  success?: boolean;  // 新增：请求是否成功
  count: number;
  criteria: {
    strategy: string;
    market_cap_max: string;
  };
  data: ScreenedStock[];
  cache_age_minutes?: number;  // 新增：缓存数据年龄（分钟）
  message?: string;  // 新增：提示信息
  market_environment?: {
    status: string;
    description: string;
    advice: string;
    statistics: {
      total_stocks: number;
      up_count: number;
      down_count: number;
      up_ratio: number;
      avg_change: number;
      avg_volume_ratio: number;
    };
    timestamp: string;
  };
}

// 波段交易筛选
export async function screenBandTradingStocks(params?: {
  change_min?: number;
  change_max?: number;
  volume_ratio_min?: number;
  volume_ratio_max?: number;
  market_cap_max?: number;
  limit?: number;
  macd_required?: boolean;
  kdj_required?: boolean;
  strategy_type?: string;  // 新增：策略类型
}): Promise<BandTradingResponse> {
  // 使用实时端点以确保策略差异化排序生效
  const response = await api.get('/band-trading-realtime', { params });
  return response.data;
}

// 更新融资融券标的
export const updateMarginStocks = async () => {
  const response = await api.post('/admin/update-margin-stocks');
  return response.data;
};

// 过滤精选股票
export async function filterStocks(
  codes: string[],
  includeKcbCyb: boolean = false,
  preferTailInflow: boolean = false,
  strictRiskControl: boolean = true,
  cancelToken?: any,
): Promise<{
  count: number;
  total_analyzed: number;
  filter_criteria: {
    volume_pattern: string;
    price_position: string;
    sector: string;
  };
  data: FilteredStock[];
  all_analysis: AnalysisResult[];
  ai_selected: AISelectedStock[];
  market_environment: MarketEnvironment;
  final_pick?: FinalPick | null;
  final_picks?: FinalPick[];  // 新增：Top3候选列表
}> {
  const response = await api.get('/filter', { 
    params: { 
      codes: codes.join(','),
      include_kcb_cyb: includeKcbCyb,
      prefer_tail_inflow: preferTailInflow,
      strict_risk_control: strictRiskControl,
    },
    cancelToken,
  });
  return response.data;
}

// 获取实时行情
export async function getRealtimeQuote(code: string): Promise<StockQuote> {
  const response = await api.get('/realtime', { params: { code } });
  return response.data;
}

// 获取K线数据
export async function getKLineData(
  code: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 90
): Promise<{ code: string; period: string; data: KLineItem[] }> {
  const response = await api.get('/kline', { params: { code, period, days } });
  return response.data;
}

// 获取热门股票
export async function getHotStocks(limit: number = 20): Promise<{ count: number; data: StockQuote[] }> {
  const response = await api.get('/hot', { params: { limit } });
  return response.data;
}

// 获取主要指数
export async function getIndexData(): Promise<{ data: IndexData[] }> {
  const response = await api.get('/index');
  return response.data;
}
