// 星寰海 v2.0 - 模式发现适配器
// 负责发现重复主题、识别情境触发器和建议应对策略

import { getStorage, setStorage } from '../../utils/storage';
import type { DiscoveredPattern, MoodEntry, ContextTag, MoodTag } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  DISCOVERED_PATTERNS: 'discovered_patterns',
  PATTERN_ANALYSIS: 'pattern_analysis'
};

export class PatternDiscoveryAdapter {
  constructor(_userId: string) {
    // userId not used in current implementation
  }

  /**
   * 发现重复模式
   * 分析情绪记录找出重复出现的主题
   * @param days 分析天数，默认60天
   * @param minOccurrences 最小出现次数阈值
   */
  discoverPatterns(days: number = 60, minOccurrences: number = 3): DiscoveredPattern[] {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = this.getMoodEntries().filter(e => e.createdAt.getTime() > cutoff);

      if (entries.length < minOccurrences) {
        return [];
      }

      // 按不同维度分组分析
      const patternsByContext = this.analyzeByContext(entries);
      const patternsByTime = this.analyzeByTime(entries);
      const patternsByMoodSequence = this.analyzeMoodSequences(entries);

      // 合并相似模式
      const mergedPatterns = this.mergeSimilarPatterns([
        ...patternsByContext,
        ...patternsByTime,
        ...patternsByMoodSequence
      ]);

      // 过滤低频率模式
      const filteredPatterns = mergedPatterns.filter(p => p.occurrences >= minOccurrences);

      // 为每个模式生成建议应对策略
      const enrichedPatterns = filteredPatterns.map(pattern => ({
        ...pattern,
        suggestedResponses: this.generateCopingStrategies(pattern)
      }));

      // 保存发现的新模式
      this.saveNewPatterns(enrichedPatterns);

      return enrichedPatterns;
    } catch (error) {
      return [];
    }
  }

  /**
   * 识别情境触发器
   * 检测导致特定情绪的情境因素
   * @param targetMood 目标情绪（可选，不传则分析所有）
   */
  identifyTriggers(targetMood?: MoodTag): Array<{
    context: ContextTag;
    frequency: number;
    intensity: number;
    typicalTime?: string;
    typicalDay?: string;
  }> {
    try {
      const entries = this.getMoodEntries();
      const triggers: Array<{
        context: ContextTag;
        frequency: number;
        intensity: number;
        typicalTime?: string;
        typicalDay?: string;
      }> = [];

      // 按情境分组
      const contextGroups: Record<string, MoodEntry[]> = {};

      entries.forEach(entry => {
        if (!entry.context) return;

        entry.context.forEach(ctx => {
          if (!contextGroups[ctx]) {
            contextGroups[ctx] = [];
          }
          contextGroups[ctx].push(entry);
        });
      });

      // 分析每个情境组
      Object.entries(contextGroups).forEach(([context, groupEntries]) => {
        // 如果指定了目标情绪，只分析该情绪
        let filteredEntries = groupEntries;
        if (targetMood) {
          filteredEntries = groupEntries.filter(e => e.mood === targetMood);
        }

        if (filteredEntries.length < 2) return;

        const avgIntensity = filteredEntries.reduce((sum, e) => sum + e.intensity, 0) / filteredEntries.length;

        // 找出最常见的时间
        const timeCounts: Record<string, number> = {};
        const dayCounts: Record<string, number> = {};

        filteredEntries.forEach(entry => {
          const hours = entry.createdAt.getHours();
          const timeKey = `${hours.toString().padStart(2, '0')}-${(hours + 1).toString().padStart(2, '0')}`;
          timeCounts[timeKey] = (timeCounts[timeKey] || 0) + 1;

          const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          const dayKey = days[entry.createdAt.getDay()];
          dayCounts[dayKey] = (dayCounts[dayKey] || 0) + 1;
        });

        const typicalTime = Object.entries(timeCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        const typicalDay = Object.entries(dayCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        triggers.push({
          context: context as ContextTag,
          frequency: filteredEntries.length,
          intensity: Math.round(avgIntensity),
          typicalTime,
          typicalDay
        });
      });

      // 按频率排序
      triggers.sort((a, b) => b.frequency - a.frequency);

      return triggers;
    } catch (error) {
      return [];
    }
  }

  /**
   * 建议应对策略
   * 基于发现的模式推荐干预措施
   * @param patternName 模式名称
   * @param currentContext 当前情境（可选）
   */
  suggestCopingStrategies(patternName: string, currentContext?: ContextTag): Array<{
    strategy: string;
    effectiveness: number;
    description: string;
  }> {
    try {
      const patterns = getStorage<DiscoveredPattern[]>(STORAGE_KEYS.DISCOVERED_PATTERNS) || [];
      const targetPattern = patterns.find(p => p.name === patternName);

      if (!targetPattern) {
        return this.getDefaultStrategies(patternName);
      }

      // 基于历史效果排序策略
      const strategies = targetPattern.suggestedResponses || [];
      strategies.sort((a, b) => b.effectiveness - a.effectiveness);

      // 根据当前情境调整
      if (currentContext) {
        return strategies
          .filter(s => this.isStrategyRelevant(s.strategy, currentContext))
          .slice(0, 5);
      }

      return strategies.slice(0, 5);
    } catch (error) {
      return this.getDefaultStrategies(patternName);
    }
  }

  /**
   * 获取已发现的模式
   */
  getDiscoveredPatterns(): DiscoveredPattern[] {
    return getStorage<DiscoveredPattern[]>(STORAGE_KEYS.DISCOVERED_PATTERNS) || [];
  }

  /**
   * 更新模式（当有新数据时）
   */
  updatePattern(patternId: string, updates: Partial<DiscoveredPattern>): boolean {
    try {
      const patterns = getStorage<DiscoveredPattern[]>(STORAGE_KEYS.DISCOVERED_PATTERNS) || [];
      const patternIndex = patterns.findIndex(p => p.id === patternId);

      if (patternIndex === -1) {
        return false;
      }

      patterns[patternIndex] = { ...patterns[patternIndex], ...updates };
      setStorage(STORAGE_KEYS.DISCOVERED_PATTERNS, patterns);

      return true;
    } catch (error) {
      return false;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取情绪记录
   */
  private getMoodEntries(): MoodEntry[] {
    return getStorage<MoodEntry[]>('mood_entries') || [];
  }

  /**
   * 按情境分析模式
   */
  private analyzeByContext(entries: MoodEntry[]): Array<Omit<DiscoveredPattern, 'suggestedResponses'>> {
    const patterns: Array<Omit<DiscoveredPattern, 'suggestedResponses'>> = [];

    // 按情境分组
    const contextGroups: Record<string, MoodEntry[]> = {};

    entries.forEach(entry => {
      if (!entry.context) return;

      entry.context.forEach(ctx => {
        if (!contextGroups[ctx]) {
          contextGroups[ctx] = [];
        }
        contextGroups[ctx].push(entry);
      });
    });

    // 为每个情境创建模式
    Object.entries(contextGroups).forEach(([context, groupEntries]) => {
      const dominantMood = this.getDominantMood(groupEntries);

      patterns.push({
        id: `pattern_context_${context}_${Date.now()}`,
        name: `${context}相关情绪`,
        frequency: groupEntries.length / entries.length,
        occurrences: groupEntries.length,
        triggers: [
          {
            context: context as ContextTag,
            mood: dominantMood,
            timeOfDay: this.getTypicalTime(groupEntries),
            dayOfWeek: this.getTypicalDay(groupEntries)
          }
        ],
        typicalDuration: this.estimateDuration(groupEntries),
        firstSeen: new Date(Math.min(...groupEntries.map(e => e.createdAt.getTime()))),
        lastSeen: new Date(Math.max(...groupEntries.map(e => e.createdAt.getTime())))
      });
    });

    return patterns;
  }

  /**
   * 按时间分析模式
   */
  private analyzeByTime(entries: MoodEntry[]): Array<Omit<DiscoveredPattern, 'suggestedResponses'>> {
    const patterns: Array<Omit<DiscoveredPattern, 'suggestedResponses'>> = [];

    // 按时间段分组
    const timeGroups: Record<string, MoodEntry[]> = {};

    entries.forEach(entry => {
      const hour = entry.createdAt.getHours();
      const period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
      if (!timeGroups[period]) {
        timeGroups[period] = [];
      }
      timeGroups[period].push(entry);
    });

    // 为每个时间段创建模式
    Object.entries(timeGroups).forEach(([period, groupEntries]) => {
      const dominantMood = this.getDominantMood(groupEntries);

      patterns.push({
        id: `pattern_time_${period}_${Date.now()}`,
        name: `${period}时段情绪模式`,
        frequency: groupEntries.length / entries.length,
        occurrences: groupEntries.length,
        triggers: [
          {
            context: 'other',
            mood: dominantMood,
            timeOfDay: period
          }
        ],
        typicalDuration: this.estimateDuration(groupEntries),
        firstSeen: new Date(Math.min(...groupEntries.map(e => e.createdAt.getTime()))),
        lastSeen: new Date(Math.max(...groupEntries.map(e => e.createdAt.getTime())))
      });
    });

    return patterns;
  }

  /**
   * 分析情绪序列模式
   */
  private analyzeMoodSequences(entries: MoodEntry[]): Array<Omit<DiscoveredPattern, 'suggestedResponses'>> {
    const patterns: Array<Omit<DiscoveredPattern, 'suggestedResponses'>> = [];

    // 寻找连续相同情绪的序列
    let i = 0;
    while (i < entries.length - 1) {
      const currentMood = entries[i].mood;
      const sequence: MoodEntry[] = [entries[i]];

      while (i < entries.length - 1 && entries[i + 1].mood === currentMood) {
        i++;
        sequence.push(entries[i]);
      }

      if (sequence.length >= 3) {
        patterns.push({
          id: `pattern_seq_${currentMood}_${Date.now()}`,
          name: `连续${currentMood}情绪`,
          frequency: sequence.length / entries.length,
          occurrences: sequence.length,
          triggers: [
            {
              context: sequence[0].context?.[0] || 'other',
              mood: currentMood
            }
          ],
          typicalDuration: this.estimateDuration(sequence),
          firstSeen: sequence[0].createdAt,
          lastSeen: sequence[sequence.length - 1].createdAt
        });
      }

      i++;
    }

    return patterns;
  }

  /**
   * 合并相似模式
   */
  private mergeSimilarPatterns(patterns: Array<Omit<DiscoveredPattern, 'suggestedResponses'>>): Array<Omit<DiscoveredPattern, 'suggestedResponses'>> {
    const merged: Array<Omit<DiscoveredPattern, 'suggestedResponses'>> = [];
    const used = new Set<number>();

    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue;

      const current = patterns[i];
      const similar = [current];

      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue;

        const other = patterns[j];
        // 检查是否相似（相同的主导情绪或情境）
        if (this.arePatternsSimilar(current, other)) {
          similar.push(other);
          used.add(j);
        }
      }

      used.add(i);

      // 合并相似模式
      if (similar.length > 1) {
        merged.push(this.mergePatternGroup(similar));
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * 检查两个模式是否相似
   */
  private arePatternsSimilar(a: Omit<DiscoveredPattern, 'suggestedResponses'>, b: Omit<DiscoveredPattern, 'suggestedResponses'>): boolean {
    // 如果有相同的触发情境或情绪，视为相似
    const aTriggers = a.triggers.map(t => `${t.context}_${t.mood}`);
    const bTriggers = b.triggers.map(t => `${t.context}_${t.mood}`);

    return aTriggers.some(t => bTriggers.includes(t));
  }

  /**
   * 合并模式组
   */
  private mergePatternGroup(patterns: Array<Omit<DiscoveredPattern, 'suggestedResponses'>>): Omit<DiscoveredPattern, 'suggestedResponses'> {
    const totalOccurrences = patterns.reduce((sum, p) => sum + p.occurrences, 0);
    const avgFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0) / patterns.length;

    // 合并触发器
    const allTriggers = patterns.flatMap(p => p.triggers);
    const uniqueTriggers = Array.from(new Set(allTriggers.map(t => JSON.stringify(t))))
      .map(t => JSON.parse(t));

    return {
      id: `pattern_merged_${Date.now()}`,
      name: patterns[0].name,
      frequency: avgFrequency,
      occurrences: totalOccurrences,
      triggers: uniqueTriggers,
      typicalDuration: Math.round(patterns.reduce((sum, p) => sum + p.typicalDuration, 0) / patterns.length),
      firstSeen: new Date(Math.min(...patterns.map(p => p.firstSeen.getTime()))),
      lastSeen: new Date(Math.max(...patterns.map(p => p.lastSeen.getTime())))
    };
  }

  /**
   * 获取主导情绪
   */
  private getDominantMood(entries: MoodEntry[]): MoodTag {
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    });

    return Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as MoodTag;
  }

  /**
   * 获取典型时间
   */
  private getTypicalTime(entries: MoodEntry[]): string | undefined {
    const hourCounts: Record<string, number> = {};
    entries.forEach(e => {
      const hour = e.createdAt.getHours().toString().padStart(2, '0');
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  /**
   * 获取典型星期
   */
  private getTypicalDay(entries: MoodEntry[]): string | undefined {
    const dayCounts: Record<string, number> = {};
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    entries.forEach(e => {
      const day = days[e.createdAt.getDay()];
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  /**
   * 估算持续时间
   */
  private estimateDuration(entries: MoodEntry[]): number {
    if (entries.length < 2) return 0;

    const sorted = entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const duration = sorted[sorted.length - 1].createdAt.getTime() - sorted[0].createdAt.getTime();

    return Math.round(duration / (60 * 1000)); // 转换为分钟
  }

  /**
   * 生成应对策略
   */
  private generateCopingStrategies(pattern: Omit<DiscoveredPattern, 'suggestedResponses'>): Array<{
    strategy: string;
    effectiveness: number;
    description: string;
  }> {
    const strategies: Array<{ strategy: string; effectiveness: number; description: string }> = [];

    // 根据模式类型生成策略
    if (pattern.triggers.some(t => t.mood === 'anxious' || t.mood === 'stressed')) {
      strategies.push({
        strategy: '呼吸练习',
        effectiveness: 85,
        description: '深呼吸可以帮助缓解焦虑和压力感'
      });
      strategies.push({
        strategy: '正念冥想',
        effectiveness: 78,
        description: '专注于当下，减少过度担忧'
      });
    }

    if (pattern.triggers.some(t => t.mood === 'sad' || t.mood === 'lonely')) {
      strategies.push({
        strategy: '社交连接',
        effectiveness: 82,
        description: '与朋友或家人交流可以缓解孤独感'
      });
      strategies.push({
        strategy: '感恩日记',
        effectiveness: 70,
        description: '记录每天值得感恩的事情'
      });
    }

    if (pattern.triggers.some(t => t.mood === 'angry' || t.mood === 'frustrated')) {
      strategies.push({
        strategy: '情绪表达',
        effectiveness: 75,
        description: '通过写作或倾诉表达愤怒情绪'
      });
      strategies.push({
        strategy: '身体活动',
        effectiveness: 80,
        description: '运动可以帮助释放紧张情绪'
      });
    }

    if (pattern.triggers.some(t => t.context === 'work')) {
      strategies.push({
        strategy: '工作边界设定',
        effectiveness: 72,
        description: '明确工作与生活的界限'
      });
      strategies.push({
        strategy: '任务分解',
        effectiveness: 68,
        description: '将大任务分解为小步骤'
      });
    }

    // 通用策略
    strategies.push({
      strategy: '情绪记录',
      effectiveness: 65,
      description: '持续记录情绪变化，了解触发因素'
    });

    return strategies;
  }

  /**
   * 获取默认策略
   */
  private getDefaultStrategies(patternName: string): Array<{
    strategy: string;
    effectiveness: number;
    description: string;
  }> {
    return [
      {
        strategy: '情绪觉察',
        effectiveness: 70,
        description: `注意到"${patternName}"模式的出现`
      },
      {
        strategy: '自我关怀',
        effectiveness: 65,
        description: '以友善的态度对待自己'
      },
      {
        strategy: '寻求支持',
        effectiveness: 75,
        description: '在需要时向信任的人求助'
      }
    ];
  }

  /**
   * 检查策略是否相关
   */
  private isStrategyRelevant(strategy: string, context: ContextTag): boolean {
    const relevanceMap: Record<string, ContextTag[]> = {
      '工作边界设定': ['work'],
      '任务分解': ['work'],
      '社交连接': ['social', 'family'],
      '身体活动': ['health']
    };

    const relevantContexts = relevanceMap[strategy];
    return relevantContexts ? relevantContexts.includes(context) : true;
  }

  /**
   * 保存新模式
   */
  private saveNewPatterns(patterns: DiscoveredPattern[]): void {
    const existingPatterns = getStorage<DiscoveredPattern[]>(STORAGE_KEYS.DISCOVERED_PATTERNS) || [];
    const existingIds = new Set(existingPatterns.map(p => p.id));

    const newPatterns = patterns.filter(p => !existingIds.has(p.id));

    if (newPatterns.length > 0) {
      const updatedPatterns = [...newPatterns, ...existingPatterns];

      // 最多保留100条
      if (updatedPatterns.length > 100) {
        updatedPatterns.splice(100);
      }

      setStorage(STORAGE_KEYS.DISCOVERED_PATTERNS, updatedPatterns);
    }
  }

  /**
   * 清除数据
   */
  clear(): void {
    setStorage(STORAGE_KEYS.DISCOVERED_PATTERNS, []);
    setStorage(STORAGE_KEYS.PATTERN_ANALYSIS, null);
  }
}