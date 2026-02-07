/**
 * 提醒管理器
 * 负责管理提醒规则、检查触发条件、发送通知
 */

import {
  type AlertRule,
  getAlertRules,
  saveAlertRules,
  addAlertRule as addAlertRuleToStorage,
  removeAlertRule as removeAlertRuleFromStorage,
  updateAlertRule as updateAlertRuleInStorage,
  addAlertHistory,
  getNotificationSettings,
  clearExpiredAlertRules
} from '../utils/localStorage';
import { NotificationService } from './NotificationService';

export class AlertManager {
  private rules: AlertRule[] = [];
  private checkInterval: number | null = null;
  private notificationService: NotificationService;
  private dataService: any; // 数据服务，用于获取股票数据
  
  constructor(notificationService: NotificationService, dataService?: any) {
    this.notificationService = notificationService;
    this.dataService = dataService;
    this.loadRules();
  }
  
  /**
   * 从localStorage加载规则
   */
  private loadRules(): void {
    this.rules = getAlertRules();
    // 清除过期规则
    clearExpiredAlertRules();
    this.rules = getAlertRules();
  }
  
  /**
   * 保存规则到localStorage
   */
  private saveRules(): void {
    saveAlertRules(this.rules);
  }
  
  /**
   * 添加提醒规则
   */
  addRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): string {
    const ruleId = addAlertRuleToStorage(rule);
    this.loadRules();
    return ruleId;
  }
  
  /**
   * 删除提醒规则
   */
  removeRule(ruleId: string): void {
    removeAlertRuleFromStorage(ruleId);
    this.loadRules();
  }
  
  /**
   * 更新提醒规则
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    updateAlertRuleInStorage(ruleId, updates);
    this.loadRules();
  }
  
  /**
   * 获取所有规则
   */
  getRules(filter?: { type?: string; isActive?: boolean }): AlertRule[] {
    let filtered = this.rules;
    
    if (filter?.type) {
      filtered = filtered.filter(r => r.type === filter.type);
    }
    
    if (filter?.isActive !== undefined) {
      filtered = filtered.filter(r => r.isActive === filter.isActive);
    }
    
    return filtered;
  }
  
  /**
   * 启动监控
   */
  startMonitoring(): void {
    if (this.checkInterval) {
      console.log('提醒监控已在运行');
      return;
    }
    
    console.log('启动提醒监控...');
    
    // 立即检查一次
    this.checkRules();
    
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkRules();
    }, 60000);
  }
  
  /**
   * 停止监控
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('提醒监控已停止');
    }
  }
  
  /**
   * 检查所有规则
   */
  private async checkRules(): Promise<void> {
    try {
      // 获取提醒设置
      const settings = getNotificationSettings();
      
      // 检查总开关
      if (!settings.masterSwitch) {
        return;
      }
      
      // 检查是否在交易时段
      if (settings.tradingHoursOnly && !this.isTradingHours()) {
        return;
      }
      
      // 获取活跃规则
      const activeRules = this.rules.filter(r => r.isActive);
      
      for (const rule of activeRules) {
        // 检查是否过期
        if (new Date(rule.expiresAt) < new Date()) {
          rule.isActive = false;
          continue;
        }
        
        // 检查是否在冷却期
        if (rule.lastTriggeredAt) {
          const lastTriggered = new Date(rule.lastTriggeredAt);
          const now = new Date();
          const hoursSinceLastTrigger = (now.getTime() - lastTriggered.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastTrigger < settings.alertInterval) {
            continue;
          }
        }
        
        // 检查规则类型是否启用
        if (!this.isRuleTypeEnabled(rule.type, settings)) {
          continue;
        }
        
        // 获取当前数据并检查触发条件
        try {
          const currentData = await this.getCurrentData(rule.stockCode);
          
          if (this.evaluateCondition(rule, currentData)) {
            this.triggerAlert(rule, currentData);
            rule.lastTriggeredAt = new Date().toISOString();
          }
        } catch (error) {
          console.error(`检查规则失败 (${rule.stockCode}):`, error);
        }
      }
      
      // 保存更新后的规则
      this.saveRules();
    } catch (error) {
      console.error('检查提醒规则失败:', error);
    }
  }
  
  /**
   * 评估触发条件
   */
  private evaluateCondition(rule: AlertRule, data: any): boolean {
    switch (rule.type) {
      case 'price':
        if (rule.conditions.direction === 'up') {
          return data.price >= (rule.conditions.targetPrice || 0);
        } else {
          return data.price <= (rule.conditions.targetPrice || 0);
        }
      
      case 'stop_loss':
        return data.price <= (rule.conditions.targetPrice || 0);
      
      case 'take_profit':
        return data.price >= (rule.conditions.targetPrice || 0);
      
      case 'abnormal':
        const changeThreshold = rule.conditions.changePercent || 5;
        const ratioThreshold = rule.conditions.volumeRatio || 3;
        return Math.abs(data.change_percent) > changeThreshold || 
               data.volume_ratio > ratioThreshold;
      
      case 'signal':
        // 检查是否符合波段交易策略
        return data.change_percent >= -2 && data.change_percent <= 5 &&
               data.volume_ratio >= 1.5 && data.volume_ratio <= 3 &&
               data.market_cap <= 160;
      
      default:
        return false;
    }
  }
  
  /**
   * 触发提醒
   */
  private triggerAlert(rule: AlertRule, data: any): void {
    try {
      // 格式化消息
      const message = this.notificationService.formatAlertMessage(
        rule.type,
        rule.stockName,
        {
          ...data,
          stopLoss: rule.conditions.targetPrice,
          targetPrice: rule.conditions.targetPrice
        }
      );
      
      // 发送通知
      rule.notificationChannels.forEach(channel => {
        if (channel === 'browser') {
          this.notificationService.sendBrowserNotification(message);
        } else if (channel === 'sound') {
          this.notificationService.playSound('alert');
        } else if (channel === 'internal') {
          this.notificationService.showInternalMessage(message.body, 'info');
        }
      });
      
      // 保存到历史记录
      addAlertHistory({
        ruleId: rule.id,
        message: `${message.title}: ${message.body}`,
        data: { ...data, rule }
      });
      
      console.log(`提醒已触发: ${rule.stockName} (${rule.type})`);
    } catch (error) {
      console.error('触发提醒失败:', error);
    }
  }
  
  /**
   * 获取当前股票数据
   */
  private async getCurrentData(stockCode: string): Promise<any> {
    // 这里需要调用实际的数据服务
    // 暂时返回模拟数据
    if (this.dataService && this.dataService.getStockData) {
      return await this.dataService.getStockData(stockCode);
    }
    
    // 模拟数据（实际使用时应该调用真实API）
    return {
      code: stockCode,
      price: 10 + Math.random() * 5,
      change_percent: (Math.random() - 0.5) * 10,
      volume_ratio: 1 + Math.random() * 3,
      market_cap: 100
    };
  }
  
  /**
   * 检查是否在交易时段
   */
  private isTradingHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    
    // 周末不交易
    if (day === 0 || day === 6) {
      return false;
    }
    
    // 上午：9:30-11:30
    const morningStart = hour === 9 && minute >= 30;
    const morningEnd = hour === 11 && minute <= 30;
    const morning = (hour === 9 && minute >= 30) || (hour === 10) || (hour === 11 && minute <= 30);
    
    // 下午：13:00-15:00
    const afternoon = (hour === 13) || (hour === 14) || (hour === 15 && minute === 0);
    
    return morning || afternoon;
  }
  
  /**
   * 检查规则类型是否启用
   */
  private isRuleTypeEnabled(type: string, settings: any): boolean {
    switch (type) {
      case 'price':
        return settings.priceAlert;
      case 'stop_loss':
      case 'take_profit':
        return settings.positionAlert;
      case 'abnormal':
      case 'signal':
        return settings.watchlistAlert;
      default:
        return true;
    }
  }
  
  /**
   * 设置数据服务
   */
  setDataService(dataService: any): void {
    this.dataService = dataService;
  }
}

// 导出单例（可选）
// export const alertManager = new AlertManager(notificationService);
