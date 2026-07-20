// 星寰海 v2.0 - 外展协调适配器
// 负责规划主动消息、检索待发送消息和记录用户反应

import { getStorage, setStorage } from '../../utils/storage';
import type { OutreachPlan, AiOutreachMessage, OutreachTriggerType } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  SCHEDULED_MESSAGES: 'scheduled_messages',
  SENT_MESSAGES: 'sent_messages',
  RESPONSE_HISTORY: 'response_history'
};

/** 用户响应记录 */
interface ResponseRecord {
  messageId: string;
  responseType: 'positive' | 'neutral' | 'negative' | 'no_response';
  responseText?: string;
  respondedAt: Date;
  engagementLevel: number; // 0-10
}

/** 外展配置 */
interface OutreachConfig {
  maxDailyMessages: number;
  minIntervalMinutes: number;
  preferredTimeWindows: Array<{ start: string; end: string }>;
  cooldownAfterNegative: number; // 负面响应后冷却小时数
}

export class OutreachCoordinatorAdapter {
  private userId: string;
  private defaultConfig: OutreachConfig;

  constructor(userId: string) {
    this.userId = userId;
    this.defaultConfig = {
      maxDailyMessages: 3,
      minIntervalMinutes: 60,
      preferredTimeWindows: [
        { start: '09:00', end: '11:00' },
        { start: '14:00', end: '16:00' },
        { start: '20:00', end: '22:00' }
      ],
      cooldownAfterNegative: 24
    };
  }

  /**
   * 安排外展消息
   * @param triggerType 触发类型
   * @param content 消息内容
   * @param scheduledTime 计划发送时间（可选，默认使用最佳时间窗口）
   */
  scheduleOutreach(
    triggerType: OutreachTriggerType,
    content: { title: string; body: string; suggestedActions?: string[] },
    scheduledTime?: Date
  ): OutreachPlan | null {
    try {
      const config = this.getConfig();
      const messages = this.getScheduledMessages();

      // 检查每日限制
      const todayMessages = messages.filter(m => {
        const date = new Date(m.scheduledTime);
        return date.toDateString() === new Date().toDateString();
      });

      if (todayMessages.length >= config.maxDailyMessages) {
        return null;
      }

      // 确定发送时间
      const sendTime = scheduledTime || this.findBestTimeWindow();
      if (!sendTime) {
        return null;
      }

      // 计算预期影响
      const expectedImpact = this.calculateExpectedImpact(triggerType);

      const plan: OutreachPlan = {
        id: `outreach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        scheduledTime: sendTime,
        content: {
          title: content.title,
          body: content.body,
          suggestedActions: content.suggestedActions || []
        },
        triggerReason: this.getTriggerReason(triggerType),
        expectedImpact,
        status: 'scheduled'
      };

      messages.unshift(plan);

      // 最多保留50条待发送消息
      if (messages.length > 50) {
        messages.splice(50);
      }

      setStorage(STORAGE_KEYS.SCHEDULED_MESSAGES, messages);

      return plan;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取已安排的消息
   * @param status 状态过滤（可选）
   * @param limit 返回数量限制
   */
  getScheduledMessages(status?: OutreachPlan['status'], limit: number = 20): OutreachPlan[] {
    try {
      let messages = getStorage<OutreachPlan[]>(STORAGE_KEYS.SCHEDULED_MESSAGES) || [];

      // 过滤过期消息
      const now = Date.now();
      messages = messages.filter(m => {
        if (m.status === 'expired') return false;
        if (m.scheduledTime.getTime() < now && m.status === 'scheduled') {
          // 自动标记过期
          m.status = 'expired';
        }
        return m.status !== 'expired';
      });

      // 状态过滤
      if (status) {
        messages = messages.filter(m => m.status === status);
      }

      // 按时间排序
      messages.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

      setStorage(STORAGE_KEYS.SCHEDULED_MESSAGES, messages);
      return messages.slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * 记录用户响应
   * @param messageId 消息ID
   * @param responseType 响应类型
   * @param responseText 响应文本（可选）
   * @param engagementLevel 参与度等级（0-10）
   */
  recordResponse(
    messageId: string,
    responseType: ResponseRecord['responseType'],
    responseText?: string,
    engagementLevel: number = 5
  ): boolean {
    try {
      const responses = getStorage<ResponseRecord[]>(STORAGE_KEYS.RESPONSE_HISTORY) || [];

      const record: ResponseRecord = {
        messageId,
        responseType,
        responseText,
        respondedAt: new Date(),
        engagementLevel: Math.max(0, Math.min(10, engagementLevel))
      };

      responses.unshift(record);

      // 最多保留500条
      if (responses.length > 500) {
        responses.splice(500);
      }

      setStorage(STORAGE_KEYS.RESPONSE_HISTORY, responses);

      // 更新消息状态
      this.updateMessageStatus(messageId, responseType);

      // 如果负面响应，设置冷却
      if (responseType === 'negative') {
        this.setCooldown();
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 发送消息（将计划转为已发送）
   * @param messageId 消息ID
   */
  sendMessage(messageId: string): boolean {
    try {
      const messages = getStorage<OutreachPlan[]>(STORAGE_KEYS.SCHEDULED_MESSAGES) || [];
      const messageIndex = messages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) {
        return false;
      }

      const message = messages[messageIndex];
      message.status = 'sent';

      messages[messageIndex] = message;
      setStorage(STORAGE_KEYS.SCHEDULED_MESSAGES, messages);

      // 添加到已发送列表
      const sentMessages = getStorage<AiOutreachMessage[]>(STORAGE_KEYS.SENT_MESSAGES) || [];
      sentMessages.unshift({
        id: message.id,
        userId: this.userId,
        triggerType: this.parseTriggerType(message.triggerReason),
        priority: this.determinePriority(message),
        title: message.content.title,
        body: message.content.body,
        sentAt: new Date()
      });

      setStorage(STORAGE_KEYS.SENT_MESSAGES, sentMessages);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 确认消息已送达
   * @param messageId 消息ID
   */
  markDelivered(messageId: string): boolean {
    try {
      const sentMessages = getStorage<AiOutreachMessage[]>(STORAGE_KEYS.SENT_MESSAGES) || [];
      const messageIndex = sentMessages.findIndex(m => m.id === messageId);

      if (messageIndex === -1) {
        return false;
      }

      sentMessages[messageIndex].readAt = new Date();
      setStorage(STORAGE_KEYS.SENT_MESSAGES, sentMessages);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取响应统计
   * @param days 分析天数
   */
  getResponseStats(days: number = 30): {
    totalSent: number;
    responseRate: number;
    positiveRate: number;
    avgEngagement: number;
    bestPerformingContent: string | null;
  } {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const responses = getStorage<ResponseRecord[]>(STORAGE_KEYS.RESPONSE_HISTORY) || [];
      const filteredResponses = responses.filter(r => r.respondedAt.getTime() > cutoff);

      if (filteredResponses.length === 0) {
        return {
          totalSent: 0,
          responseRate: 0,
          positiveRate: 0,
          avgEngagement: 0,
          bestPerformingContent: null
        };
      }

      const totalSent = filteredResponses.length;
      const responded = filteredResponses.filter(r => r.responseType !== 'no_response').length;
      const positive = filteredResponses.filter(r => r.responseType === 'positive').length;
      const avgEngagement = filteredResponses.reduce((sum, r) => sum + r.engagementLevel, 0) / totalSent;

      // 找出表现最好的内容（基于参与度）
      const contentEngagement: Record<string, { total: number; sum: number }> = {};
      filteredResponses.forEach(r => {
        if (!contentEngagement[r.messageId]) {
          contentEngagement[r.messageId] = { total: 0, sum: 0 };
        }
        contentEngagement[r.messageId].total++;
        contentEngagement[r.messageId].sum += r.engagementLevel;
      });

      let bestContent: string | null = null;
      let bestScore = 0;
      Object.entries(contentEngagement).forEach(([id, data]) => {
        const score = data.sum / data.total;
        if (score > bestScore) {
          bestScore = score;
          bestContent = id;
        }
      });

      return {
        totalSent,
        responseRate: Math.round((responded / totalSent) * 100),
        positiveRate: Math.round((positive / totalSent) * 100),
        avgEngagement: Math.round(avgEngagement),
        bestPerformingContent: bestContent
      };
    } catch (error) {
      return {
        totalSent: 0,
        responseRate: 0,
        positiveRate: 0,
        avgEngagement: 0,
        bestPerformingContent: null
      };
    }
  }

  /**
   * 查找最佳时间窗口
   */
  private findBestTimeWindow(): Date | null {
    const config = this.getConfig();
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 找到下一个可用的时间窗口
    for (const window of config.preferredTimeWindows) {
      const [startH, startM] = window.start.split(':').map(Number);
      const [endH, endM] = window.end.split(':').map(Number);

      // 如果当前时间在窗口内，立即发送
      if (currentHour === startH && currentMinute >= startM) {
        if (currentHour < endH || (currentHour === endH && currentMinute < endM)) {
          return new Date();
        }
      }

      // 否则安排到明天的这个窗口
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(startH, startM, 0, 0);

      if (tomorrow.getTime() > now.getTime()) {
        return tomorrow;
      }
    }

    return null;
  }

  /**
   * 计算预期影响
   */
  private calculateExpectedImpact(triggerType: OutreachTriggerType): {
    engagementProbability: number;
    positiveResponseProbability: number;
  } {
    // 基于历史数据调整概率
    const stats = this.getResponseStats(7);
    const baseEngagement = stats.responseRate / 100;
    const basePositive = stats.positiveRate / 100;

    // 根据触发类型调整
    const triggerAdjustments: Record<OutreachTriggerType, { engagement: number; positive: number }> = {
      prediction: { engagement: 0.8, positive: 0.6 },
      silence: { engagement: 0.6, positive: 0.5 },
      pattern: { engagement: 0.7, positive: 0.55 },
      followup: { engagement: 0.5, positive: 0.4 },
      good_news: { engagement: 0.9, positive: 0.8 },
      crisis: { engagement: 0.4, positive: 0.3 }
    };

    const adjustment = triggerAdjustments[triggerType] || { engagement: 0.6, positive: 0.5 };

    return {
      engagementProbability: Math.round(Math.min(0.95, baseEngagement * adjustment.engagement + 0.3) * 100),
      positiveResponseProbability: Math.round(Math.min(0.9, basePositive * adjustment.positive + 0.2) * 100)
    };
  }

  /**
   * 获取触发原因描述
   */
  private getTriggerReason(triggerType: OutreachTriggerType): string {
    const reasons: Record<OutreachTriggerType, string> = {
      prediction: '基于情绪预测模型触发',
      silence: '检测到长时间未互动',
      pattern: '识别到重复情绪模式',
      followup: '跟进之前的干预',
      good_news: '分享积极内容',
      crisis: '危机预警触发'
    };
    return reasons[triggerType] || '系统自动触发';
  }

  /**
   * 解析触发类型
   */
  private parseTriggerType(reason: string): OutreachTriggerType {
    if (reason.includes('预测')) return 'prediction';
    if (reason.includes('沉默') || reason.includes('未互动')) return 'silence';
    if (reason.includes('模式')) return 'pattern';
    if (reason.includes('跟进')) return 'followup';
    if (reason.includes('积极')) return 'good_news';
    if (reason.includes('危机')) return 'crisis';
    return 'prediction';
  }

  /**
   * 确定优先级
   */
  private determinePriority(message: OutreachPlan): 'low' | 'medium' | 'high' | 'critical' {
    if (message.triggerReason.includes('危机')) return 'critical';
    if (message.triggerReason.includes('预测')) return 'high';
    if (message.triggerReason.includes('模式')) return 'medium';
    return 'low';
  }

  /**
   * 更新消息状态
   */
  private updateMessageStatus(messageId: string, responseType: ResponseRecord['responseType']): void {
    const messages = getStorage<OutreachPlan[]>(STORAGE_KEYS.SCHEDULED_MESSAGES) || [];
    const messageIndex = messages.findIndex(m => m.id === messageId);

    if (messageIndex !== -1) {
      // 可以在这里根据响应类型更新消息状态
      const message = messages[messageIndex];
      if (responseType === 'positive') {
        message.status = 'delivered';
      }
      messages[messageIndex] = message;
      setStorage(STORAGE_KEYS.SCHEDULED_MESSAGES, messages);
    }
  }

  /**
   * 设置冷却期
   */
  private setCooldown(): void {
    const config = this.getConfig();
    const cooldownUntil = Date.now() + config.cooldownAfterNegative * 60 * 60 * 1000;
    setStorage('outreach_cooldown_until', cooldownUntil);
  }

  /**
   * 检查是否在冷却期
   */
  isInCooldown(): boolean {
    const cooldownUntil = getStorage<number>('outreach_cooldown_until');
    if (!cooldownUntil) return false;
    return Date.now() < cooldownUntil;
  }

  /**
   * 获取配置
   */
  private getConfig(): OutreachConfig {
    return getStorage<OutreachConfig>('outreach_config') || this.defaultConfig;
  }

  /**
   * 清除数据
   */
  clear(): void {
    setStorage(STORAGE_KEYS.SCHEDULED_MESSAGES, []);
    setStorage(STORAGE_KEYS.SENT_MESSAGES, []);
    setStorage(STORAGE_KEYS.RESPONSE_HISTORY, []);
  }
}