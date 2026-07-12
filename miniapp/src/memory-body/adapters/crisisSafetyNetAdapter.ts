// 星寰海 v2.0 - 危机安全网适配器
// 负责危机等级评估、活跃警报管理和升级触发

import { getStorage, setStorage } from '../../utils/storage';
import type { CrisisAssessment, CrisisLevel, MoodEntry } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  CRISIS_ALERTS: 'crisis_alerts',
  CRISIS_HISTORY: 'crisis_history',
  CRISIS_CONFIG: 'crisis_config'
};

/** 危机警报 */
interface CrisisAlert {
  id: string;
  level: CrisisLevel;
  triggerType: string;
  message: string;
  detectedAt: Date;
  acknowledged: boolean;
  escalated: boolean;
}

/** 危机检测配置 */
interface CrisisConfig {
  intensityThresholds: {
    mild: number;
    moderate: number;
    severe: number;
  };
  consecutiveHighDays: number; // 连续高情绪天数阈值
  keywordTriggers: Record<string, CrisisLevel>;
  cooldownHours: number; // 同一类型警报冷却时间
}

export class CrisisSafetyNetAdapter {
  private defaultConfig: CrisisConfig;

  constructor(_userId: string) {
    this.defaultConfig = {
      intensityThresholds: {
        mild: 7,
        moderate: 8,
        severe: 9
      },
      consecutiveHighDays: 3,
      keywordTriggers: {
        '自杀': 'severe',
        '不想活': 'severe',
        '结束生命': 'severe',
        '伤害自己': 'severe',
        '绝望': 'moderate',
        '崩溃': 'moderate',
        '无助': 'moderate',
        '焦虑': 'mild',
        '压力': 'mild'
      },
      cooldownHours: 24
    };
  }

  /**
   * 检查危机等级
   * 基于最近的情绪输入评估风险
   * @param recentEntries 最近的情绪记录
   * @param inputText 可选的文本输入（用于关键词检测）
   */
  checkCrisisLevel(recentEntries: MoodEntry[], inputText?: string): CrisisAssessment {
    try {
      const config = this.getConfig();
      const triggers: Array<{
        type: string;
        value: number;
        threshold: number;
        message: string;
      }> = [];

      let riskScore = 0;

      // 1. 检查高强度情绪
      if (recentEntries.length > 0) {
        const avgIntensity = recentEntries.reduce((sum, e) => sum + e.intensity, 0) / recentEntries.length;

        if (avgIntensity >= config.intensityThresholds.severe) {
          triggers.push({
            type: 'high_intensity',
            value: avgIntensity,
            threshold: config.intensityThresholds.severe,
            message: `平均情绪强度 ${avgIntensity} 达到严重级别`
          });
          riskScore += 40;
        } else if (avgIntensity >= config.intensityThresholds.moderate) {
          triggers.push({
            type: 'medium_intensity',
            value: avgIntensity,
            threshold: config.intensityThresholds.moderate,
            message: `平均情绪强度 ${avgIntensity} 达到中度级别`
          });
          riskScore += 25;
        } else if (avgIntensity >= config.intensityThresholds.mild) {
          triggers.push({
            type: 'low_intensity',
            value: avgIntensity,
            threshold: config.intensityThresholds.mild,
            message: `平均情绪强度 ${avgIntensity} 达到轻度级别`
          });
          riskScore += 10;
        }

        // 2. 检查负面情绪占比
        const negativeMoods = ['sad', 'anxious', 'lonely', 'angry', 'fearful', 'frustrated', 'guilty', 'ashamed', 'empty', 'overwhelmed'];
        const negativeCount = recentEntries.filter(e => negativeMoods.includes(e.mood)).length;
        const negativeRatio = negativeCount / recentEntries.length;

        if (negativeRatio > 0.7 && recentEntries.length >= 3) {
          triggers.push({
            type: 'negative_dominance',
            value: negativeRatio,
            threshold: 0.7,
            message: `负面情绪占比 ${Math.round(negativeRatio * 100)}% 超过阈值`
          });
          riskScore += 20;
        }

        // 3. 检查连续高情绪天数
        const highIntensityDays = this.countConsecutiveHighDays(recentEntries, config.intensityThresholds.mild);
        if (highIntensityDays >= config.consecutiveHighDays) {
          triggers.push({
            type: 'consecutive_high',
            value: highIntensityDays,
            threshold: config.consecutiveHighDays,
            message: `连续 ${highIntensityDays} 天出现较高情绪强度`
          });
          riskScore += 15;
        }
      }

      // 4. 检查关键词触发
      if (inputText) {
        const keywordResult = this.checkKeywords(inputText, config);
        if (keywordResult) {
          triggers.push(keywordResult);
          riskScore += keywordResult.type === 'severe' ? 35 : keywordResult.type === 'moderate' ? 20 : 10;
        }
      }

      // 确定危机等级
      const level = this.determineLevel(riskScore, triggers);

      // 生成建议行动
      const recommendedActions = this.generateRecommendedActions(level, triggers);

      const assessment: CrisisAssessment = {
        level,
        triggers,
        recommendedActions,
        riskScore: Math.min(100, riskScore),
        assessedAt: new Date()
      };

      // 如果有严重或中度危机，创建警报
      if (level === 'severe' || level === 'moderate') {
        this.createAlert(assessment);
      }

      return assessment;
    } catch (error) {
      console.error('[CrisisSafetyNetAdapter] checkCrisisLevel error:', error);
      return this.getEmptyAssessment();
    }
  }

  /**
   * 获取活跃警报
   * @param includeAcknowledged 是否包含已确认的警报
   */
  getActiveAlerts(includeAcknowledged: boolean = false): CrisisAlert[] {
    try {
      let alerts = getStorage<CrisisAlert[]>(STORAGE_KEYS.CRISIS_ALERTS) || [];

      // 过滤掉过期的警报（超过7天）
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      alerts = alerts.filter(a => a.detectedAt.getTime() > cutoff);

      if (!includeAcknowledged) {
        alerts = alerts.filter(a => !a.acknowledged);
      }

      // 按严重程度排序
      const levelOrder = { severe: 0, moderate: 1, mild: 2 };
      alerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

      setStorage(STORAGE_KEYS.CRISIS_ALERTS, alerts);
      return alerts;
    } catch (error) {
      console.error('[CrisisSafetyNetAdapter] getActiveAlerts error:', error);
      return [];
    }
  }

  /**
   * 如果需要则升级干预
   * @param alertId 警报ID
   * @param reason 升级原因
   */
  escalateIfNeeded(alertId: string, reason: string): boolean {
    try {
      const alerts = getStorage<CrisisAlert[]>(STORAGE_KEYS.CRISIS_ALERTS) || [];
      const alertIndex = alerts.findIndex(a => a.id === alertId);

      if (alertIndex === -1) {
        console.warn('[CrisisSafetyNetAdapter] Alert not found for escalation');
        return false;
      }

      const alert = alerts[alertIndex];

      // 检查冷却时间
      const lastEscalation = alert.escalated ? alert.detectedAt : null;
      if (lastEscalation) {
        const hoursSinceLast = (Date.now() - lastEscalation.getTime()) / (1000 * 60 * 60);
        const config = this.getConfig();
        if (hoursSinceLast < config.cooldownHours) {
          console.warn('[CrisisSafetyNetAdapter] Escalation in cooldown period');
          return false;
        }
      }

      // 执行升级
      alert.escalated = true;
      alert.message = `${alert.message}\n[升级] ${reason}`;

      alerts[alertIndex] = alert;
      setStorage(STORAGE_KEYS.CRISIS_ALERTS, alerts);

      // 记录到历史
      this.recordEscalation(alert, reason);

      return true;
    } catch (error) {
      console.error('[CrisisSafetyNetAdapter] escalateIfNeeded error:', error);
      return false;
    }
  }

  /**
   * 确认警报
   * @param alertId 警报ID
   */
  acknowledgeAlert(alertId: string): boolean {
    try {
      const alerts = getStorage<CrisisAlert[]>(STORAGE_KEYS.CRISIS_ALERTS) || [];
      const alertIndex = alerts.findIndex(a => a.id === alertId);

      if (alertIndex === -1) {
        return false;
      }

      alerts[alertIndex].acknowledged = true;
      setStorage(STORAGE_KEYS.CRISIS_ALERTS, alerts);

      return true;
    } catch (error) {
      console.error('[CrisisSafetyNetAdapter] acknowledgeAlert error:', error);
      return false;
    }
  }

  /**
   * 创建警报
   */
  private createAlert(assessment: CrisisAssessment): void {
    const alerts = getStorage<CrisisAlert[]>(STORAGE_KEYS.CRISIS_ALERTS) || [];

    const alert: CrisisAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level: assessment.level,
      triggerType: assessment.triggers.map(t => t.type).join(','),
      message: assessment.triggers.map(t => t.message).join('\n'),
      detectedAt: assessment.assessedAt,
      acknowledged: false,
      escalated: false
    };

    alerts.unshift(alert);

    // 最多保留50条
    if (alerts.length > 50) {
      alerts.splice(50);
    }

    setStorage(STORAGE_KEYS.CRISIS_ALERTS, alerts);
  }

  /**
   * 记录升级事件
   */
  private recordEscalation(alert: CrisisAlert, reason: string): void {
    const history = getStorage<Array<{ alertId: string; reason: string; timestamp: Date }>>(
      STORAGE_KEYS.CRISIS_HISTORY
    ) || [];

    history.unshift({
      alertId: alert.id,
      reason,
      timestamp: new Date()
    });

    // 最多保留100条
    if (history.length > 100) {
      history.splice(100);
    }

    setStorage(STORAGE_KEYS.CRISIS_HISTORY, history);
  }

  /**
   * 计算连续高情绪天数
   */
  private countConsecutiveHighDays(entries: MoodEntry[], threshold: number): number {
    const days = new Set<string>();

    entries.forEach(entry => {
      if (entry.intensity >= threshold) {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        days.add(dateKey);
      }
    });

    return days.size;
  }

  /**
   * 检查关键词
   */
  private checkKeywords(text: string, config: CrisisConfig): {
    type: string;
    value: number;
    threshold: number;
    message: string;
  } | null {
    const lowerText = text.toLowerCase();

    for (const [keyword, level] of Object.entries(config.keywordTriggers)) {
      if (lowerText.includes(keyword)) {
        return {
          type: `keyword_${level}`,
          value: 1,
          threshold: 0,
          message: `检测到高危关键词: "${keyword}"`
        };
      }
    }

    return null;
  }

  /**
   * 确定危机等级
   */
  private determineLevel(riskScore: number, triggers: Array<{ type: string }>): CrisisLevel {
    if (riskScore >= 60 || triggers.some(t => t.type.includes('severe'))) {
      return 'severe';
    } else if (riskScore >= 30 || triggers.some(t => t.type.includes('moderate'))) {
      return 'moderate';
    }
    return 'mild';
  }

  /**
   * 生成建议行动
   */
  private generateRecommendedActions(
    level: CrisisLevel,
    triggers: Array<{ type: string }>
  ): Array<{ priority: 'immediate' | 'soon' | 'later'; action: string; reason: string }> {
    const actions: Array<{ priority: 'immediate' | 'soon' | 'later'; action: string; reason: string }> = [];

    if (level === 'severe') {
      actions.push({
        priority: 'immediate',
        action: '启动紧急干预流程',
        reason: '检测到严重危机信号，需要立即响应'
      });
      actions.push({
        priority: 'immediate',
        action: '联系紧急联系人',
        reason: '用户可能需要外部支持'
      });
      actions.push({
        priority: 'soon',
        action: '提供专业帮助资源',
        reason: '建议寻求专业心理咨询'
      });
    } else if (level === 'moderate') {
      actions.push({
        priority: 'soon',
        action: '主动关怀消息',
        reason: '检测到中度情绪波动，建议温和介入'
      });
      actions.push({
        priority: 'soon',
        action: '推荐放松练习',
        reason: '帮助缓解当前情绪状态'
      });
      actions.push({
        priority: 'later',
        action: '记录情绪变化趋势',
        reason: '持续观察情绪发展'
      });
    } else {
      actions.push({
        priority: 'later',
        action: '日常情绪追踪',
        reason: '保持对情绪状态的关注'
      });
      actions.push({
        priority: 'later',
        action: '预防性干预建议',
        reason: '防止情绪进一步恶化'
      });
    }

    // 根据触发器添加特定建议
    if (triggers.some(t => t.type === 'keyword_severe')) {
      actions.unshift({
        priority: 'immediate',
        action: '显示危机热线信息',
        reason: '检测到自我伤害相关表述'
      });
    }

    return actions;
  }

  /**
   * 获取配置
   */
  private getConfig(): CrisisConfig {
    return getStorage<CrisisConfig>(STORAGE_KEYS.CRISIS_CONFIG) || this.defaultConfig;
  }

  /**
   * 获取空评估模板
   */
  private getEmptyAssessment(): CrisisAssessment {
    return {
      level: 'mild',
      triggers: [],
      recommendedActions: [],
      riskScore: 0,
      assessedAt: new Date()
    };
  }

  /**
   * 清除数据
   */
  clear(): void {
    setStorage(STORAGE_KEYS.CRISIS_ALERTS, []);
    setStorage(STORAGE_KEYS.CRISIS_HISTORY, []);
  }
}