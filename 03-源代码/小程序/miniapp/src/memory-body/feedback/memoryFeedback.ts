// 星寰海 v2.0 - memory-body 记忆反馈循环
import type { MoodEntry } from '../types/memoryBodyTypes';

/** 交互类型 */
export type InteractionType = 'view' | 'edit' | 'delete' | 'share' | 'retrieve';

/** 交互记录接口 */
export interface InteractionRecord {
  memoryId: string;
  interactionType: InteractionType;
  timestamp: Date;
  duration?: number; // 查看时长（秒）
  context?: string; // 交互上下文
}

/** 反馈统计接口 */
export interface FeedbackStats {
  memoryId: string;
  viewCount: number;
  editCount: number;
  deleteCount: number;
  lastAccessTime: Date;
  averageViewDuration: number;
  relevanceScore: number;
}

/** MemoryFeedback 类 - 管理记忆的反馈循环 */
export class MemoryFeedback {
  private interactions: Map<string, InteractionRecord[]> = new Map();
  private statsCache: Map<string, FeedbackStats> = new Map();

  /** 记录交互 */
  recordInteraction(record: Omit<InteractionRecord, 'timestamp'> & { timestamp?: Date }): void {
    const fullRecord: InteractionRecord = {
      ...record,
      timestamp: record.timestamp || new Date(),
    };

    if (!this.interactions.has(fullRecord.memoryId)) {
      this.interactions.set(fullRecord.memoryId, []);
    }

    const records = this.interactions.get(fullRecord.memoryId)!;
    records.push(fullRecord);

    // 清除缓存
    this.statsCache.delete(fullRecord.memoryId);
  }

  /** 批量记录交互 */
  recordInteractions(records: Array<Omit<InteractionRecord, 'timestamp'> & { timestamp?: Date }>): void {
    for (const record of records) {
      this.recordInteraction(record);
    }
  }

  /** 获取指定记忆的交互历史 */
  getInteractionHistory(memoryId: string): InteractionRecord[] {
    return this.interactions.get(memoryId) || [];
  }

  /** 获取所有记忆的交互历史 */
  getAllInteractionHistory(): Map<string, InteractionRecord[]> {
    return new Map(this.interactions);
  }

  /** 获取反馈统计 */
  getStats(memoryId: string): FeedbackStats {
    // 检查缓存
    if (this.statsCache.has(memoryId)) {
      return this.statsCache.get(memoryId)!;
    }

    const records = this.interactions.get(memoryId) || [];
    const viewRecords = records.filter(r => r.interactionType === 'view');
    const editRecords = records.filter(r => r.interactionType === 'edit');
    const deleteRecords = records.filter(r => r.interactionType === 'delete');

    const avgDuration = viewRecords.length > 0
      ? viewRecords.reduce((sum, r) => sum + (r.duration || 0), 0) / viewRecords.length
      : 0;

    // 计算相关性分数（基于访问频率和最近访问时间）
    const now = Date.now();
    const lastAccess = records.length > 0 ? records[records.length - 1].timestamp : null;
    const daysSinceLastAccess = lastAccess
      ? (now - lastAccess.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    const frequencyScore = Math.min(records.length / 10, 1); // 最多10次交互得满分
    const recencyScore = Math.max(0, 1 - daysSinceLastAccess / 30); // 30天内线性衰减
    const relevanceScore = frequencyScore * 0.6 + recencyScore * 0.4;

    const stats: FeedbackStats = {
      memoryId,
      viewCount: viewRecords.length,
      editCount: editRecords.length,
      deleteCount: deleteRecords.length,
      lastAccessTime: lastAccess || new Date(0),
      averageViewDuration: avgDuration,
      relevanceScore: Math.min(relevanceScore, 1),
    };

    // 缓存结果
    this.statsCache.set(memoryId, stats);

    return stats;
  }

  /** 获取多个记忆的统计 */
  getMultipleStats(memoryIds: string[]): FeedbackStats[] {
    return memoryIds.map(id => this.getStats(id));
  }

  /** 更新记忆的相关性分数 */
  updateRelevanceScores(entries: MoodEntry[]): Map<string, number> {
    const scoreMap = new Map<string, number>();

    for (const entry of entries) {
      const stats = this.getStats(entry.id);
      // 结合原始强度和反馈分数
      const baseScore = entry.intensity / 10;
      const feedbackWeight = 0.3;
      const finalScore = baseScore * (1 - feedbackWeight) + stats.relevanceScore * feedbackWeight;
      scoreMap.set(entry.id, Math.min(finalScore, 1));
    }

    return scoreMap;
  }

  /** 获取最常访问的记忆 */
  getMostAccessedMemories(limit: number = 10): Array<{ memoryId: string; accessCount: number }> {
    const allStats = Array.from(this.interactions.keys())
      .map(id => ({ memoryId: id, accessCount: this.getStats(id).viewCount }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);

    return allStats;
  }

  /** 获取最近访问的记忆 */
  getRecentlyAccessedMemories(limit: number = 10): Array<{ memoryId: string; lastAccessTime: Date }> {
    const allStats = Array.from(this.interactions.keys())
      .map(id => ({ memoryId: id, lastAccessTime: this.getStats(id).lastAccessTime }))
      .sort((a, b) => b.lastAccessTime.getTime() - a.lastAccessTime.getTime())
      .slice(0, limit);

    return allStats;
  }

  /** 获取未被访问的记忆（可能可以归档） */
  getUnaccessedMemories(daysThreshold: number = 30): string[] {
    const cutoff = Date.now() - daysThreshold * 24 * 60 * 60 * 1000;

    return Array.from(this.interactions.keys())
      .filter(id => {
        const stats = this.getStats(id);
        return stats.lastAccessTime.getTime() < cutoff && stats.viewCount === 0;
      });
  }

  /** 清除指定记忆的交互记录 */
  clearMemoryInteractions(memoryId: string): void {
    this.interactions.delete(memoryId);
    this.statsCache.delete(memoryId);
  }

  /** 清除所有数据 */
  clearAll(): void {
    this.interactions.clear();
    this.statsCache.clear();
  }

  /** 导出反馈数据 */
  exportData(): {
    totalMemories: number;
    totalInteractions: number;
    averageRelevanceScore: number;
    topMemories: Array<{ memoryId: string; accessCount: number }>;
  } {
    const allStats = Array.from(this.interactions.keys()).map(id => this.getStats(id));
    const totalInteractions = allStats.reduce((sum, s) => sum + s.viewCount + s.editCount, 0);
    const avgRelevance = allStats.length > 0
      ? allStats.reduce((sum, s) => sum + s.relevanceScore, 0) / allStats.length
      : 0;

    return {
      totalMemories: this.interactions.size,
      totalInteractions,
      averageRelevanceScore: avgRelevance,
      topMemories: this.getMostAccessedMemories(5),
    };
  }
}
