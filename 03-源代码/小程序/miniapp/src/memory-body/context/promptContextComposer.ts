// 星寰海 v2.0 - memory-body 提示上下文组合器
import type { MoodEntry, EmotionPattern } from '../types/memoryBodyTypes';

/** 上下文类型 */
export type ContextType = 'recent' | 'emotional' | 'situational' | 'pattern' | 'feedback';

/** 上下文项接口 */
export interface ContextItem<T> {
  type: ContextType;
  content: string;
  data: T;
  relevanceScore: number;
  priority: number; // 优先级，越高越重要
}

/** 组合选项接口 */
export interface ComposeOptions {
  // 最大上下文长度（字符数）
  maxLength?: number;

  // 包含的上下文类型
  includeTypes?: ContextType[];

  // 时间范围（毫秒）
  timeRange?: number;

  // 情绪标签过滤
  moodTags?: string[];

  // 情境过滤
  contextTags?: string[];

  // 是否应用衰减
  applyDecay?: boolean;
}

/** PromptContextComposer 类 - 从记忆中组合AI提示上下文 */
export class PromptContextComposer {
  /** 组合完整上下文 */
  composePrompt(
    entries: MoodEntry[],
    patterns: EmotionPattern[],
    query?: string,
    options: ComposeOptions = {}
  ): string {
    const {
      maxLength = 2000,
      includeTypes,
      timeRange = 7 * 24 * 60 * 60 * 1000, // 默认7天
    } = options;

    const contextItems: ContextItem<unknown>[] = [];

    // 1. 添加最近的情绪记录
    if (!includeTypes || includeTypes.includes('recent')) {
      const recentEntries = this.getRecentEntries(entries, timeRange);
      for (const entry of recentEntries) {
        contextItems.push({
          type: 'recent',
          content: this.formatMoodEntry(entry),
          data: entry,
          relevanceScore: this.calculateRelevance(entry, query),
          priority: 3,
        });
      }
    }

    // 2. 添加情绪模式
    if (!includeTypes || includeTypes.includes('pattern')) {
      const relevantPatterns = this.getRelevantPatterns(patterns, query);
      for (const pattern of relevantPatterns) {
        contextItems.push({
          type: 'pattern',
          content: this.formatPattern(pattern),
          data: pattern,
          relevanceScore: pattern.confidence,
          priority: 2,
        });
      }
    }

    // 3. 按相关性和优先级排序
    contextItems.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.relevanceScore - a.relevanceScore;
    });

    // 4. 构建最终上下文
    let composedContext = '';
    let currentLength = 0;

    for (const item of contextItems) {
      const itemLength = item.content.length;
      if (currentLength + itemLength > maxLength) break;

      composedContext += item.content + '\n\n';
      currentLength += itemLength;
    }

    // 5. 添加查询信息（如果有）
    if (query) {
      composedContext = `用户当前关注：${query}\n\n` + composedContext;
    }

    return composedContext.trim();
  }

  /** 获取最近的条目 */
  private getRecentEntries(entries: MoodEntry[], timeRange: number): MoodEntry[] {
    const cutoff = Date.now() - timeRange;
    return entries
      .filter(e => e.createdAt.getTime() > cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10); // 最多10条
  }

  /** 获取相关模式 */
  private getRelevantPatterns(patterns: EmotionPattern[], query?: string): EmotionPattern[] {
    if (!query) {
      return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
    }

    const lowerQuery = query.toLowerCase();
    return patterns
      .filter(p =>
        p.description.toLowerCase().includes(lowerQuery) ||
        p.patternType.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /** 计算相关性分数 */
  private calculateRelevance(entry: MoodEntry, query?: string): number {
    let score = 0;

    // 基础分：强度权重
    score += (entry.intensity / 10) * 0.3;

    // 时间权重
    const daysAgo = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - daysAgo / 7) * 0.3; // 7天内线性衰减

    // 查询匹配（如果有查询）
    if (query) {
      const lowerQuery = query.toLowerCase();
      if (entry.mood.toLowerCase().includes(lowerQuery)) score += 0.2;
      if (entry.note && entry.note.toLowerCase().includes(lowerQuery)) score += 0.2;
    }

    return Math.min(score, 1);
  }

  /** 格式化情绪条目 */
  private formatMoodEntry(entry: MoodEntry): string {
    const dateStr = entry.createdAt.toLocaleDateString('zh-CN');
    const timeStr = entry.createdAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    let text = `[${dateStr} ${timeStr}] 情绪：${entry.mood}`;
    text += `，强度：${entry.intensity}/10`;

    if (entry.context && entry.context.length > 0) {
      text += `，情境：${entry.context.join('、')}`;
    }

    if (entry.note) {
      text += `\n备注：${entry.note}`;
    }

    return text;
  }

  /** 格式化模式 */
  private formatPattern(pattern: EmotionPattern): string {
    return `【模式】${pattern.description}\n置信度：${(pattern.confidence * 100).toFixed(0)}%\n首次发现：${pattern.createdAt.toLocaleDateString('zh-CN')}`;
  }

  /** 生成建议上下文 */
  generateSuggestionContext(
    entries: MoodEntry[],
    currentMood: string,
    currentIntensity: number
  ): string {
    const similarEntries = entries
      .filter(e => e.mood === currentMood)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3);

    let context = `当前情绪：${currentMood}，强度：${currentIntensity}/10\n\n`;

    if (similarEntries.length > 0) {
      context += '历史相似情绪记录：\n';
      for (const entry of similarEntries) {
        context += `- ${entry.createdAt.toLocaleDateString('zh-CN')}，强度${entry.intensity}，${entry.note ? `备注：${entry.note}` : ''}\n`;
      }
    }

    return context;
  }

  /** 生成干预建议上下文 */
  generateInterventionContext(
    entries: MoodEntry[],
    triggerType: string,
    preIntensity: number
  ): string {
    const relatedEntries = entries
      .filter(e =>
        e.mood === triggerType ||
        (e.context && e.context.some(c => ['work', 'family', 'relationship'].includes(c)))
      )
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 5);

    let context = `触发类型：${triggerType}，前置强度：${preIntensity}/10\n\n`;

    if (relatedEntries.length > 0) {
      context += '相关历史记录：\n';
      for (const entry of relatedEntries) {
        context += `- ${entry.createdAt.toLocaleDateString('zh-CN')}，${entry.mood}，强度${entry.intensity}\n`;
      }
    }

    return context;
  }

  /** 批量组合上下文 */
  batchCompose(
    queries: Array<{
      entries: MoodEntry[];
      patterns: EmotionPattern[];
      query?: string;
      options?: ComposeOptions;
    }>
  ): string[] {
    return queries.map(({ entries, patterns, query, options }) =>
      this.composePrompt(entries, patterns, query, options)
    );
  }

  /** 获取上下文统计 */
  getContextStats(entries: MoodEntry[], patterns: EmotionPattern[]): {
    totalEntries: number;
    totalPatterns: number;
    recentEntriesCount: number;
    highConfidencePatterns: number;
  } {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.createdAt.getTime() > cutoff);
    const highConfidencePatterns = patterns.filter(p => p.confidence >= 0.7);

    return {
      totalEntries: entries.length,
      totalPatterns: patterns.length,
      recentEntriesCount: recentEntries.length,
      highConfidencePatterns: highConfidencePatterns.length,
    };
  }
}
