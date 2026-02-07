/**
 * 持仓管理器
 * 负责管理持仓数据、计算盈亏、评估风险、检查止损止盈
 */

import {
  type Position,
  getPositions,
  savePositions,
  addPosition as addPositionToStorage,
  removePosition as removePositionFromStorage,
  updatePosition as updatePositionInStorage
} from '../utils/localStorage';
import { AlertManager } from './AlertManager';

// 盈亏结果接口
export interface PnLResult {
  cost: number;              // 成本
  currentValue: number;      // 当前市值
  pnlAmount: number;         // 盈亏金额
  pnlPercent: number;        // 盈亏比例
  status: 'profit' | 'loss' | 'even';  // 状态
}

// 总盈亏接口
export interface TotalPnL {
  totalCost: number;         // 总成本
  totalValue: number;        // 总市值
  totalPnL: number;          // 总盈亏金额
  totalPnLPercent: number;   // 总盈亏比例
  profitCount: number;       // 盈利股票数
  lossCount: number;         // 亏损股票数
}

// 持仓统计接口
export interface PortfolioStatistics {
  totalPositions: number;    // 持仓数量
  totalValue: number;        // 总市值
  totalPnL: number;          // 总盈亏
  totalPnLPercent: number;   // 总盈亏比例
  avgHoldDays: number;       // 平均持仓天数
  bestPosition: {            // 最佳持仓
    code: string;
    name: string;
    pnlPercent: number;
  } | null;
  worstPosition: {           // 最差持仓
    code: string;
    name: string;
    pnlPercent: number;
  } | null;
}

// 风险评估接口
export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high';  // 风险等级
  concentration: number;                  // 集中度
  boardDiversity: number;                 // 板块分散度
  industryDiversity: number;              // 行业分散度
  suggestions: string[];                  // 优化建议
}

export class PortfolioManager {
  private positions: Position[] = [];
  private updateInterval: number | null = null;
  private alertManager: AlertManager | null = null;
  private dataService: any; // 数据服务，用于获取股票价格
  
  constructor(alertManager?: AlertManager, dataService?: any) {
    this.alertManager = alertManager || null;
    this.dataService = dataService;
    this.loadPositions();
  }
  
  /**
   * 从localStorage加载持仓
   */
  private loadPositions(): void {
    this.positions = getPositions();
  }
  
  /**
   * 保存持仓到localStorage
   */
  private savePositions(): void {
    savePositions(this.positions);
  }
  
  /**
   * 添加持仓
   */
  addPosition(position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>): string {
    const positionId = addPositionToStorage(position);
    this.loadPositions();
    
    // 如果设置了止损止盈，自动创建提醒
    if (this.alertManager && (position.stopLoss || position.takeProfit)) {
      if (position.stopLoss) {
        this.alertManager.addRule({
          type: 'stop_loss',
          stockCode: position.stockCode,
          stockName: position.stockName,
          conditions: {
            targetPrice: position.stopLoss
          },
          isActive: true,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser', 'sound']
        });
      }
      
      if (position.takeProfit) {
        this.alertManager.addRule({
          type: 'take_profit',
          stockCode: position.stockCode,
          stockName: position.stockName,
          conditions: {
            targetPrice: position.takeProfit
          },
          isActive: true,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          notificationChannels: ['browser', 'sound']
        });
      }
    }
    
    return positionId;
  }
  
  /**
   * 删除持仓
   */
  removePosition(positionId: string): void {
    removePositionFromStorage(positionId);
    this.loadPositions();
  }
  
  /**
   * 更新持仓
   */
  updatePosition(positionId: string, updates: Partial<Position>): void {
    updatePositionInStorage(positionId, updates);
    this.loadPositions();
  }
  
  /**
   * 获取所有持仓
   */
  getPositions(): Position[] {
    return this.positions;
  }
  
  /**
   * 获取单个持仓
   */
  getPosition(positionId: string): Position | undefined {
    return this.positions.find(p => p.id === positionId);
  }
  
  /**
   * 启动价格更新
   */
  startPriceUpdate(): void {
    if (this.updateInterval) {
      console.log('价格更新已在运行');
      return;
    }
    
    console.log('启动持仓价格更新...');
    
    // 立即更新一次
    this.updatePrices();
    
    // 每30秒更新一次
    this.updateInterval = setInterval(() => {
      this.updatePrices();
    }, 30000);
  }
  
  /**
   * 停止价格更新
   */
  stopPriceUpdate(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('持仓价格更新已停止');
    }
  }
  
  /**
   * 更新所有持仓的价格
   */
  private async updatePrices(): Promise<void> {
    try {
      for (const position of this.positions) {
        try {
          const currentPrice = await this.getCurrentPrice(position.stockCode);
          
          // 更新持仓的当前价格
          this.updatePosition(position.id, {
            currentPrice,
            updatedAt: new Date().toISOString()
          });
          
          // 检查止损止盈
          this.checkStopLossForPosition(position, currentPrice);
          this.checkTakeProfitForPosition(position, currentPrice);
        } catch (error) {
          console.error(`更新持仓价格失败 (${position.stockCode}):`, error);
        }
      }
    } catch (error) {
      console.error('更新持仓价格失败:', error);
    }
  }
  
  /**
   * 获取当前股票价格
   */
  private async getCurrentPrice(stockCode: string): Promise<number> {
    // 这里需要调用实际的数据服务
    // 暂时返回模拟数据
    if (this.dataService && this.dataService.getStockPrice) {
      return await this.dataService.getStockPrice(stockCode);
    }
    
    // 模拟价格变动（实际使用时应该调用真实API）
    const position = this.positions.find(p => p.stockCode === stockCode);
    if (position && position.currentPrice) {
      // 模拟 ±2% 的价格波动
      const change = (Math.random() - 0.5) * 0.04;
      return position.currentPrice * (1 + change);
    }
    
    return position?.buyPrice || 0;
  }
  
  /**
   * 计算单个持仓的盈亏
   */
  calculatePnL(position: Position, currentPrice?: number): PnLResult {
    const price = currentPrice || position.currentPrice || position.buyPrice;
    const cost = position.buyPrice * position.quantity;
    const currentValue = price * position.quantity;
    const pnlAmount = currentValue - cost;
    const pnlPercent = (pnlAmount / cost) * 100;
    
    let status: 'profit' | 'loss' | 'even';
    if (pnlPercent > 0.01) status = 'profit';
    else if (pnlPercent < -0.01) status = 'loss';
    else status = 'even';
    
    return {
      cost,
      currentValue,
      pnlAmount,
      pnlPercent,
      status
    };
  }
  
  /**
   * 获取总盈亏
   */
  getTotalPnL(): TotalPnL {
    let totalCost = 0;
    let totalValue = 0;
    let profitCount = 0;
    let lossCount = 0;
    
    this.positions.forEach(position => {
      const pnl = this.calculatePnL(position);
      totalCost += pnl.cost;
      totalValue += pnl.currentValue;
      
      if (pnl.status === 'profit') profitCount++;
      else if (pnl.status === 'loss') lossCount++;
    });
    
    const totalPnL = totalValue - totalCost;
    const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    return {
      totalCost,
      totalValue,
      totalPnL,
      totalPnLPercent,
      profitCount,
      lossCount
    };
  }
  
  /**
   * 获取持仓统计
   */
  getStatistics(): PortfolioStatistics {
    const totalPnL = this.getTotalPnL();
    
    // 计算平均持仓天数
    const now = new Date();
    const totalDays = this.positions.reduce((sum, p) => {
      const buyDate = new Date(p.buyDate);
      const days = Math.floor((now.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    const avgHoldDays = this.positions.length > 0 ? Math.floor(totalDays / this.positions.length) : 0;
    
    // 找出最佳和最差持仓
    let bestPosition = null;
    let worstPosition = null;
    let maxPnL = -Infinity;
    let minPnL = Infinity;
    
    this.positions.forEach(position => {
      const pnl = this.calculatePnL(position);
      
      if (pnl.pnlPercent > maxPnL) {
        maxPnL = pnl.pnlPercent;
        bestPosition = {
          code: position.stockCode,
          name: position.stockName,
          pnlPercent: pnl.pnlPercent
        };
      }
      
      if (pnl.pnlPercent < minPnL) {
        minPnL = pnl.pnlPercent;
        worstPosition = {
          code: position.stockCode,
          name: position.stockName,
          pnlPercent: pnl.pnlPercent
        };
      }
    });
    
    return {
      totalPositions: this.positions.length,
      totalValue: totalPnL.totalValue,
      totalPnL: totalPnL.totalPnL,
      totalPnLPercent: totalPnL.totalPnLPercent,
      avgHoldDays,
      bestPosition,
      worstPosition
    };
  }
  
  /**
   * 评估持仓风险
   */
  assessRisk(): RiskAssessment {
    if (this.positions.length === 0) {
      return {
        riskLevel: 'low',
        concentration: 0,
        boardDiversity: 0,
        industryDiversity: 0,
        suggestions: ['暂无持仓']
      };
    }
    
    const totalValue = this.getTotalPnL().totalValue;
    
    // 计算集中度（最大持仓占比）
    const maxPositionValue = Math.max(...this.positions.map(p => {
      const pnl = this.calculatePnL(p);
      return pnl.currentValue;
    }));
    const concentration = maxPositionValue / totalValue;
    
    // 计算板块分散度
    const boards = new Set(this.positions.map(p => p.board || 'unknown'));
    const boardDiversity = boards.size / this.positions.length;
    
    // 计算行业分散度
    const industries = new Set(this.positions.map(p => p.industry || 'unknown'));
    const industryDiversity = industries.size / this.positions.length;
    
    // 确定风险等级
    let riskLevel: 'low' | 'medium' | 'high';
    if (concentration > 0.5 || boardDiversity < 0.5 || industryDiversity < 0.5) {
      riskLevel = 'high';
    } else if (concentration > 0.3 || boardDiversity < 0.7 || industryDiversity < 0.7) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }
    
    // 生成优化建议
    const suggestions: string[] = [];
    if (concentration > 0.5) {
      suggestions.push('单只股票占比过高，建议分散投资');
    }
    if (boardDiversity < 0.5) {
      suggestions.push('板块过于集中，建议增加不同板块的股票');
    }
    if (industryDiversity < 0.5) {
      suggestions.push('行业过于集中，建议增加不同行业的股票');
    }
    if (this.positions.length < 3) {
      suggestions.push('持仓数量较少，建议增加到3-5只');
    }
    if (this.positions.length > 10) {
      suggestions.push('持仓数量较多，建议精简到5-10只');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('持仓风险分散良好，继续保持');
    }
    
    return {
      riskLevel,
      concentration,
      boardDiversity,
      industryDiversity,
      suggestions
    };
  }
  
  /**
   * 检查单个持仓的止损
   */
  private checkStopLossForPosition(position: Position, currentPrice: number): void {
    if (!position.stopLoss || !this.alertManager) return;
    
    // 达到止损价
    if (currentPrice <= position.stopLoss) {
      console.log(`触发止损: ${position.stockName} (${position.stockCode})`);
      // AlertManager 会自动处理提醒
    }
    
    // 接近止损价（距离<1%）
    if (currentPrice <= position.stopLoss * 1.01 && currentPrice > position.stopLoss) {
      console.log(`接近止损: ${position.stockName} (${position.stockCode})`);
      // 可以发送警告通知
    }
  }
  
  /**
   * 检查单个持仓的止盈
   */
  private checkTakeProfitForPosition(position: Position, currentPrice: number): void {
    if (!position.takeProfit || !this.alertManager) return;
    
    // 达到止盈价
    if (currentPrice >= position.takeProfit) {
      console.log(`触发止盈: ${position.stockName} (${position.stockCode})`);
      // AlertManager 会自动处理提醒
    }
  }
  
  /**
   * 设置数据服务
   */
  setDataService(dataService: any): void {
    this.dataService = dataService;
  }
  
  /**
   * 设置提醒管理器
   */
  setAlertManager(alertManager: AlertManager): void {
    this.alertManager = alertManager;
  }
}
