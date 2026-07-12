// 星寰海 v2.0 - memory-body 记忆摄入管道
import type { MoodEntry, EmergencySession, ContextTag, EmotionIntensity } from '../types/memoryBodyTypes';
import { validateMoodEntry, validateEmergencySession, detectDangerousContent } from '../core/memoryBodyGuards';
import { loadConfig } from '../core/memoryBodyConfig';

/** 摄入来源类型 */
export type IngestionSource = 'manual' | 'treehole' | 'behavior' | 'ritual' | 'emergency';

/** 摄入结果接口 */
export interface IngestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings: string[];
}

/** 待处理的记忆条目 */
interface PendingMemory {
  id: string;
  source: IngestionSource;
  content: unknown;
  createdAt: Date;
}

/** MemoryIngestor 类 - 负责记忆的摄入和预处理 */
export class MemoryIngestor {
  private pendingQueue: PendingMemory[] = [];
  private config = loadConfig();

  /** 摄入情绪记录 */
  ingestMoodEntry(entry: Partial<MoodEntry> & { mood: string; intensity: number }): IngestResult<MoodEntry> {
    const warnings: string[] = [];

    // 1. 验证输入
    const validation = validateMoodEntry({
      mood: entry.mood,
      intensity: entry.intensity,
      context: entry.context,
      note: entry.note,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: `验证失败: ${validation.errors.join(', ')}`,
        warnings,
      };
    }

    // 2. 检测危险内容
    if (entry.note) {
      const dangerCheck = detectDangerousContent(entry.note);
      if (dangerCheck.detected) {
        warnings.push('检测到潜在风险内容，已标记');
      }
    }

    // 3. 构建完整条目
    const fullEntry: MoodEntry = {
      id: this.generateId(),
      userId: entry.userId || '',
      mood: validation.data!.mood,
      intensity: validation.data!.intensity,
      context: validation.data!.context as unknown as ContextTag[],
      note: validation.data!.note,
      createdAt: entry.createdAt || new Date(),
    };

    // 4. 检查存储限制
    const currentEntries = this.getCurrentMoodCount();
    if (currentEntries >= this.config.maxMoodEntries) {
      warnings.push(`已达最大存储限制(${this.config.maxMoodEntries})，将自动清理旧数据`);
      this.cleanupOldMoodEntries();
    }

    return {
      success: true,
      data: fullEntry,
      warnings,
    };
  }

  /** 摄入急救会话 */
  ingestEmergencySession(session: Partial<EmergencySession> & { triggerType: string; preIntensity: number }): IngestResult<EmergencySession> {
    const warnings: string[] = [];

    // 1. 验证输入
    const validation = validateEmergencySession({
      triggerType: session.triggerType,
      preIntensity: session.preIntensity,
      content: session.content as Record<string, unknown>,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: `验证失败: ${validation.errors.join(', ')}`,
        warnings,
      };
    }

    // 2. 检测高危内容
    if (session.content) {
      const contentStr = JSON.stringify(session.content);
      const dangerCheck = detectDangerousContent(contentStr);
      if (dangerCheck.detected) {
        warnings.push('检测到高危内容，建议加密存储');
      }
    }

    // 3. 构建完整会话
    const fullSession: EmergencySession = {
      id: this.generateId(),
      userId: session.userId || '',
      flowId: session.flowId || session.triggerType,
      state: session.state || 'completed',
      currentStep: session.currentStep || 5,
      preIntensity: validation.data!.preIntensity as unknown as EmotionIntensity,
      postIntensity: session.postIntensity,
      content: validation.data!.content,
      crisisLevel: session.crisisLevel,
      createdAt: session.createdAt || new Date(),
      updatedAt: new Date(),
    };

    return {
      success: true,
      data: fullSession,
      warnings,
    };
  }

  /** 摄入树洞帖子 */
  ingestTreeholePost(content: string, userId: string): IngestResult<{ id: string; content: string; userId: string; createdAt: Date }> {
    const warnings: string[] = [];

    // 1. 验证内容
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '内容不能为空',
        warnings,
      };
    }

    if (content.length > 500) {
      return {
        success: false,
        error: '内容不能超过500字',
        warnings,
      };
    }

    // 2. 检测危险内容
    const dangerCheck = detectDangerousContent(content);
    if (dangerCheck.detected) {
      warnings.push('内容包含敏感信息，需要人工审核');
    }

    return {
      success: true,
      data: {
        id: this.generateId(),
        content: content.substring(0, 500),
        userId,
        createdAt: new Date(),
      },
      warnings,
    };
  }

  /** 添加到待处理队列 */
  addToQueue(item: PendingMemory): void {
    this.pendingQueue.push(item);
    // 限制队列大小
    if (this.pendingQueue.length > 100) {
      this.pendingQueue = this.pendingQueue.slice(-50);
    }
  }

  /** 获取当前情绪记录数量（模拟） */
  private getCurrentMoodCount(): number {
    // 实际应从store读取
    return 0;
  }

  /** 清理旧的情绪记录（模拟） */
  private cleanupOldMoodEntries(): void {
    // 实际应调用store的清理方法
    console.log('[memory-body] 清理旧情绪记录');
  }

  /** 生成唯一ID */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /** 批量摄入 */
  batchIngest(items: Array<{ type: 'mood' | 'emergency' | 'treehole'; content: unknown }>): IngestResult<unknown[]> {
    const results: unknown[] = [];
    const allWarnings: string[] = [];
    let hasError = false;

    for (const item of items) {
      let result: IngestResult<unknown>;

      switch (item.type) {
        case 'mood':
          result = this.ingestMoodEntry(item.content as Partial<MoodEntry> & { mood: string; intensity: number });
          break;
        case 'emergency':
          result = this.ingestEmergencySession(item.content as Partial<EmergencySession> & { triggerType: string; preIntensity: number });
          break;
        case 'treehole':
          result = this.ingestTreeholePost(item.content as string, '');
          break;
        default:
          result = { success: false, error: '未知类型', warnings: [] };
      }

      if (result.success && result.data) {
        results.push(result.data);
      } else {
        hasError = true;
      }

      allWarnings.push(...result.warnings);
    }

    return {
      success: !hasError,
      data: results,
      warnings: allWarnings,
    };
  }
}
