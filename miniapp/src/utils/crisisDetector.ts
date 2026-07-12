// 星寰海 v2.0 - 危机关键词检测工具
// 提供独立的危机检测功能，支持实时文本检测和强度评估

import { CRISIS_KEYWORDS, HOTLINE_INFO } from '../data/crisisKeywords';

/** 危机严重程度 */
export type CrisisLevel = 'mild' | 'moderate' | 'severe';

/** 检测结果 */
export interface CrisisDetectionResult {
  detected: boolean;
  level: CrisisLevel;
  matchedKeywords: string[];
  suggestion: string;
  intensity: number; // 1-10 强度评分
}

/** 安全检查结果 */
export interface SafetyCheckResult {
  preIntensity: number;
  postIntensity: number;
  intensityChange: number;
  needsFollowUp: boolean;
  reason?: string;
}

/** 危机事件记录 */
export interface CrisisEvent {
  id: string;
  timestamp: Date;
  level: CrisisLevel;
  matchedKeywords: string[];
  text: string;
  action: 'detected' | 'escalated' | 'resolved';
  hotlineShown: boolean;
}

/** 配置选项 */
export interface CrisisDetectorConfig {
  enableLogging: boolean;
  minTextLength: number;
  maxTextLength: number;
  followUpThreshold: number; // 强度变化阈值，默认为2
}

const DEFAULT_CONFIG: CrisisDetectorConfig = {
  enableLogging: true,
  minTextLength: 1,
  maxTextLength: 5000,
  followUpThreshold: 2
};

/**
 * 危机检测器类
 * 提供独立的危机检测功能，可复用于多个场景
 */
export class CrisisDetector {
  private config: CrisisDetectorConfig;
  private eventListeners: Array<(event: CrisisEvent) => void> = [];
  private crisisHistory: CrisisEvent[] = [];

  constructor(config?: Partial<CrisisDetectorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 检测文本中的危机关键词
   * @param text 待检测的文本
   * @returns 检测结果
   */
  detect(text: string): CrisisDetectionResult {
    // 验证输入
    if (!this.validateInput(text)) {
      return {
        detected: false,
        level: 'mild',
        matchedKeywords: [],
        suggestion: '',
        intensity: 0
      };
    }

    const lowerText = text.toLowerCase();
    const matchedMild: string[] = [];
    const matchedModerate: string[] = [];
    const matchedSevere: string[] = [];

    // 遍历关键词库进行匹配
    for (const keyword of CRISIS_KEYWORDS) {
      if (lowerText.includes(keyword.word)) {
        if (keyword.level === 'mild') {
          matchedMild.push(keyword.word);
        } else if (keyword.level === 'moderate') {
          matchedModerate.push(keyword.word);
        } else {
          matchedSevere.push(keyword.word);
        }
      }
    }

    // 确定最高级别
    let level: CrisisLevel = 'mild';
    let matchedKeywords: string[] = [];
    let suggestion = '';
    let intensity = 0;

    if (matchedSevere.length > 0) {
      level = 'severe';
      matchedKeywords = matchedSevere;
      intensity = 8 + Math.min(matchedSevere.length * 1, 2); // 8-10
      suggestion = `立即拨打${HOTLINE_INFO.number}或120/110`;
    } else if (matchedModerate.length > 0) {
      level = 'moderate';
      matchedKeywords = matchedModerate;
      intensity = 5 + Math.min(matchedModerate.length * 1, 3); // 5-8
      suggestion = `你的感受很重要。如果需要帮助，可以拨打${HOTLINE_INFO.number}`;
    } else if (matchedMild.length > 0) {
      level = 'mild';
      matchedKeywords = matchedMild;
      intensity = 2 + Math.min(matchedMild.length * 0.5, 3); // 2-5
      suggestion = `如果这种感觉持续困扰你，可以拨打${HOTLINE_INFO.number}寻求专业帮助`;
    }

    const result: CrisisDetectionResult = {
      detected: matchedKeywords.length > 0,
      level,
      matchedKeywords,
      suggestion,
      intensity
    };

    // 如果检测到危机，触发事件
    if (result.detected) {
      this.triggerEvent({
        id: this.generateId(),
        timestamp: new Date(),
        level,
        matchedKeywords,
        text: text.substring(0, 100), // 只保存前100字符
        action: 'detected',
        hotlineShown: level !== 'mild'
      });

      if (this.config.enableLogging) {
        this.logDetection(result);
      }
    }

    return result;
  }

  /**
   * 执行安全检查
   * @param preIntensity 事前强度（1-10）
   * @param postIntensity 事后强度（1-10）
   * @returns 安全检查结果
   */
  checkSafety(preIntensity: number, postIntensity: number): SafetyCheckResult {
    // 验证强度值
    const validPre = Math.max(1, Math.min(10, preIntensity));
    const validPost = Math.max(1, Math.min(10, postIntensity));

    const intensityChange = validPost - validPre;
    const needsFollowUp = Math.abs(intensityChange) >= this.config.followUpThreshold;

    const result: SafetyCheckResult = {
      preIntensity: validPre,
      postIntensity: validPost,
      intensityChange,
      needsFollowUp,
      reason: undefined
    };

    if (needsFollowUp) {
      if (intensityChange > 0) {
        result.reason = `情绪强度上升了${intensityChange}级，建议关注用户状态`;
      } else {
        result.reason = `情绪强度下降了${Math.abs(intensityChange)}级，干预有效`;
      }
    }

    return result;
  }

  /**
   * 添加事件监听器
   * @param listener 监听函数
   */
  addEventListener(listener: (event: CrisisEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   * @param listener 监听函数
   */
  removeEventListener(listener: (event: CrisisEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 获取危机历史记录
   * @returns 危机事件列表
   */
  getCrisisHistory(): CrisisEvent[] {
    return [...this.crisisHistory];
  }

  /**
   * 清除危机历史记录
   */
  clearHistory(): void {
    this.crisisHistory = [];
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<CrisisDetectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 验证输入文本
   * @param text 待验证的文本
   * @returns 是否有效
   */
  private validateInput(text: string): boolean {
    if (!text || typeof text !== 'string') {
      return false;
    }

    const trimmed = text.trim();
    if (trimmed.length < this.config.minTextLength) {
      return false;
    }

    if (trimmed.length > this.config.maxTextLength) {
      return false;
    }

    return true;
  }

  /**
   * 生成唯一ID
   * @returns ID字符串
   */
  private generateId(): string {
    return `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 触发事件
   * @param event 危机事件
   */
  private triggerEvent(event: CrisisEvent): void {
    this.crisisHistory.push(event);

    // 通知所有监听器
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        if (this.config.enableLogging) {
          console.error('[CrisisDetector] Event listener error:', error);
        }
      }
    }
  }

  /**
   * 记录检测结果
   * @param result 检测结果
   */
  private logDetection(result: CrisisDetectionResult): void {
    console.log(`[CrisisDetector] Detection:`, {
      level: result.level,
      keywords: result.matchedKeywords,
      intensity: result.intensity,
      suggestion: result.suggestion,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 创建危机检测器实例
 * @param config 配置选项
 * @returns 检测器实例
 */
export function createCrisisDetector(config?: Partial<CrisisDetectorConfig>): CrisisDetector {
  return new CrisisDetector(config);
}

/**
 * 快速检测文本（静态方法）
 * @param text 待检测的文本
 * @returns 检测结果
 */
export function quickDetect(text: string): CrisisDetectionResult {
  const detector = new CrisisDetector({ enableLogging: false });
  return detector.detect(text);
}
