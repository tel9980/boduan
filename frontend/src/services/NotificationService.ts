/**
 * 通知服务
 * 负责发送浏览器通知、播放音效、管理通知权限
 */

export interface NotificationMessage {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export class NotificationService {
  private audioContext: AudioContext | null = null;
  
  /**
   * 请求浏览器通知权限
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('浏览器不支持通知功能');
      return 'denied';
    }
    
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    
    return Notification.permission;
  }
  
  /**
   * 检查通知权限状态
   */
  checkPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
  
  /**
   * 发送浏览器通知
   */
  sendBrowserNotification(message: NotificationMessage): void {
    if (Notification.permission !== 'granted') {
      console.warn('未授权浏览器通知');
      this.showInternalMessage(message.body, 'info');
      return;
    }
    
    try {
      const notification = new Notification(message.title, {
        body: message.body,
        icon: message.icon || '/logo.png',
        tag: message.tag,
        data: message.data,
        requireInteraction: false,
        silent: false
      });
      
      // 点击通知时的处理
      notification.onclick = () => {
        window.focus();
        if (message.data?.stockCode) {
          // 跳转到股票详情（这里可以根据实际路由调整）
          window.location.hash = `#/stock/${message.data.stockCode}`;
        }
        notification.close();
      };
      
      // 5秒后自动关闭
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('发送浏览器通知失败:', error);
      this.showInternalMessage(message.body, 'info');
    }
  }
  
  /**
   * 播放音效
   */
  playSound(soundType: 'alert' | 'warning' | 'success' = 'alert'): void {
    try {
      // 使用Web Audio API播放简单音效
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // 不同类型的音效频率
      const frequencies = {
        alert: 800,
        warning: 600,
        success: 1000
      };
      
      oscillator.frequency.value = frequencies[soundType];
      oscillator.type = 'sine';
      
      // 音量渐变
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('播放音效失败:', error);
    }
  }
  
  /**
   * 显示系统内消息（降级方案）
   */
  showInternalMessage(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
    // 这里使用简单的alert作为降级方案
    // 实际使用时可以集成Ant Design的message组件
    if (typeof window !== 'undefined') {
      // 尝试使用全局message对象（如果有的话）
      if ((window as any).showMessage) {
        (window as any).showMessage(message, type);
      } else {
        // 降级到console
        console.log(`[${type.toUpperCase()}] ${message}`);
      }
    }
  }
  
  /**
   * 格式化提醒消息
   */
  formatAlertMessage(type: string, stockName: string, data: any): NotificationMessage {
    let title = '';
    let body = '';
    
    switch (type) {
      case 'price':
        title = `💰 价格提醒 - ${stockName}`;
        body = `当前价格：¥${data.price?.toFixed(2)} (${data.change >= 0 ? '+' : ''}${data.change?.toFixed(2)}%)`;
        break;
      
      case 'stop_loss':
        title = `⚠️ 止损提醒 - ${stockName}`;
        body = `接近止损价！当前价格：¥${data.price?.toFixed(2)}，止损价：¥${data.stopLoss?.toFixed(2)}`;
        break;
      
      case 'take_profit':
        title = `🎯 止盈提醒 - ${stockName}`;
        body = `接近目标价！当前价格：¥${data.price?.toFixed(2)}，目标价：¥${data.targetPrice?.toFixed(2)}`;
        break;
      
      case 'abnormal':
        title = `📢 异动提醒 - ${stockName}`;
        if (Math.abs(data.change) > 5) {
          body = `涨跌幅异常：${data.change >= 0 ? '+' : ''}${data.change?.toFixed(2)}%`;
        } else if (data.volumeRatio > 3) {
          body = `成交量异常：量比 ${data.volumeRatio?.toFixed(2)}`;
        }
        break;
      
      case 'signal':
        title = `📈 买入信号 - ${stockName}`;
        body = `符合波段交易策略，建议关注`;
        break;
      
      default:
        title = `📢 提醒 - ${stockName}`;
        body = '请查看详情';
    }
    
    return {
      title,
      body,
      data: { stockCode: data.code }
    };
  }
}

// 导出单例
export const notificationService = new NotificationService();
