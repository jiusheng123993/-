// 星寰海 v2.0 - memory-body 记忆演化模式检测
import type { MoodEntry, PetHealthEntry, HealthEvolutionReport, HealthEvolutionPattern, HealthPatternType } from '../types/memoryBodyTypes';

/** 模式类型 */
export type PatternType = 'recurring_emotion' | 'trigger' | 'coping_mechanism' | 'trend';

/** 模式接口 */
export interface EvolutionPattern {
  id: string;
  type: PatternType;
  description: string;
  frequency: number; // 出现频率
  confidence: number; // 置信度 0-1
  firstSeen: Date;
  lastSeen: Date;
  relatedMoods: string[];
  relatedContexts: string[];
  evidence: Array<{
    entryId: string;
    timestamp: Date;
    intensity: number;
  }>;
}

/** 演化报告接口 */
export interface EvolutionReport {
  patterns: EvolutionPattern[];
  insights: string[];
  recommendations: string[];
  summary: {
    totalPatterns: number;
    byType: Record<PatternType, number>;
    averageConfidence: number;
  };
}

/** MemoryEvolution 类 - 检测记忆演化模式 */
export class MemoryEvolution {
  private moodEntries: MoodEntry[] = [];
  private detectedPatterns: Map<string, EvolutionPattern> = new Map();

  /** 添加情绪记录 */
  addMoodEntry(entry: MoodEntry): void {
    this.moodEntries.push(entry);
  }

  /** 批量添加情绪记录 */
  addMoodEntries(entries: MoodEntry[]): void {
    this.moodEntries.push(...entries);
  }

  /** 检测所有模式 */
  detectPatterns(): EvolutionReport {
    const patterns: EvolutionPattern[] = [];

    // 1. 检测重复情绪模式
    patterns.push(...this.detectRecurringEmotions());

    // 2. 检测触发因素
    patterns.push(...this.detectTriggers());

    // 3. 检测应对机制
    patterns.push(...this.detectCopingMechanisms());

    // 4. 检测趋势变化
    patterns.push(...this.detectTrends());

    // 生成洞察和建议
    const insights = this.generateInsights(patterns);
    const recommendations = this.generateRecommendations(patterns);

    return {
      patterns,
      insights,
      recommendations,
      summary: {
        totalPatterns: patterns.length,
        byType: this.countByType(patterns),
        averageConfidence: patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length,
      },
    };
  }

  /** 检测重复情绪模式 */
  private detectRecurringEmotions(): EvolutionPattern[] {
    const patterns: EvolutionPattern[] = [];
    const moodCounts = new Map<string, { count: number; entries: MoodEntry[] }>();

    // 统计每种情绪的出现次数
    for (const entry of this.moodEntries) {
      if (!moodCounts.has(entry.mood)) {
        moodCounts.set(entry.mood, { count: 0, entries: [] });
      }
      const data = moodCounts.get(entry.mood)!;
      data.count++;
      data.entries.push(entry);
    }

    // 找出高频情绪（出现超过3次）
    for (const [mood, data] of moodCounts) {
      if (data.count >= 3) {
        const pattern: EvolutionPattern = {
          id: `recurring-${mood}`,
          type: 'recurring_emotion',
          description: `频繁出现的情绪：${mood}（${data.count}次）`,
          frequency: data.count,
          confidence: Math.min(data.count / 10, 1),
          firstSeen: data.entries[0].createdAt,
          lastSeen: data.entries[data.entries.length - 1].createdAt,
          relatedMoods: [mood],
          relatedContexts: this.extractCommonContexts(data.entries),
          evidence: data.entries.map(e => ({
            entryId: e.id,
            timestamp: e.createdAt,
            intensity: e.intensity,
          })),
        };
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  /** 检测触发因素 */
  private detectTriggers(): EvolutionPattern[] {
    const patterns: EvolutionPattern[] = [];
    const contextMoodMap = new Map<string, Map<string, { count: number; entries: MoodEntry[] }>>();

    // 按情境分组
    for (const entry of this.moodEntries) {
      if (!entry.context || entry.context.length === 0) continue;

      for (const context of entry.context) {
        if (!contextMoodMap.has(context)) {
          contextMoodMap.set(context, new Map());
        }
        const moodMap = contextMoodMap.get(context)!;
        if (!moodMap.has(entry.mood)) {
          moodMap.set(entry.mood, { count: 0, entries: [] });
        }
        const data = moodMap.get(entry.mood)!;
        data.count++;
        data.entries.push(entry);
      }
    }

    // 找出特定情境下反复出现的情绪
    for (const [context, moodMap] of contextMoodMap) {
      for (const [mood, data] of moodMap) {
        if (data.count >= 3) {
          const pattern: EvolutionPattern = {
            id: `trigger-${context}-${mood}`,
            type: 'trigger',
            description: `情境"${context}"可能触发情绪"${mood}"（${data.count}次）`,
            frequency: data.count,
            confidence: Math.min(data.count / 8, 1),
            firstSeen: data.entries[0].createdAt,
            lastSeen: data.entries[data.entries.length - 1].createdAt,
            relatedMoods: [mood],
            relatedContexts: [context],
            evidence: data.entries.map(e => ({
              entryId: e.id,
              timestamp: e.createdAt,
              intensity: e.intensity,
            })),
          };
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /** 检测应对机制 */
  private detectCopingMechanisms(): EvolutionPattern[] {
    const patterns: EvolutionPattern[] = [];

    // 简化版：检测负面情绪后是否出现正面情绪
    const negativeMoods = ['sad', 'anxious', 'angry', 'fearful', 'lonely'];
    const positiveMoods = ['happy', 'calm', 'joyful', 'grateful', 'hopeful'];

    for (let i = 1; i < this.moodEntries.length; i++) {
      const current = this.moodEntries[i];
      const previous = this.moodEntries[i - 1];

      const timeDiff = current.createdAt.getTime() - previous.createdAt.getTime();
      // 只检查24小时内的变化
      if (timeDiff > 24 * 60 * 60 * 1000) continue;

      const wasNegative = negativeMoods.includes(previous.mood);
      const isPositive = positiveMoods.includes(current.mood);

      if (wasNegative && isPositive) {
        // 可能是应对机制生效
        const key = `coping-${previous.mood}-${current.mood}`;
        if (!this.detectedPatterns.has(key)) {
          const pattern: EvolutionPattern = {
            id: key,
            type: 'coping_mechanism',
            description: `从${previous.mood}到${current.mood}的积极转变`,
            frequency: 1,
            confidence: 0.6,
            firstSeen: previous.createdAt,
            lastSeen: current.createdAt,
            relatedMoods: [previous.mood, current.mood],
            relatedContexts: [...new Set([...(previous.context || []), ...(current.context || [])])],
            evidence: [
              { entryId: previous.id, timestamp: previous.createdAt, intensity: previous.intensity },
              { entryId: current.id, timestamp: current.createdAt, intensity: current.intensity },
            ],
          };
          patterns.push(pattern);
          this.detectedPatterns.set(key, pattern);
        } else {
          const existing = this.detectedPatterns.get(key)!;
          existing.frequency++;
          existing.lastSeen = current.createdAt;
          existing.evidence.push({
            entryId: current.id,
            timestamp: current.createdAt,
            intensity: current.intensity,
          });
        }
      }
    }

    return patterns;
  }

  /** 检测趋势变化 */
  private detectTrends(): EvolutionPattern[] {
    const patterns: EvolutionPattern[] = [];

    if (this.moodEntries.length < 7) return patterns;

    const weeklyAvg = new Map<string, { avgIntensity: number; count: number; entries: MoodEntry[] }>();

    for (const entry of this.moodEntries) {
      const weekKey = this.getWeekKey(entry.createdAt);
      if (!weeklyAvg.has(weekKey)) {
        weeklyAvg.set(weekKey, { avgIntensity: 0, count: 0, entries: [] });
      }
      const data = weeklyAvg.get(weekKey)!;
      data.avgIntensity += entry.intensity;
      data.count++;
      data.entries.push(entry);
    }

    const weeklyData = Array.from(weeklyAvg.entries())
      .map(([week, data]) => ({
        week,
        avgIntensity: data.avgIntensity / data.count,
        entries: data.entries,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    if (weeklyData.length < 2) return patterns;

    const recent = weeklyData[weeklyData.length - 1].avgIntensity;
    const older = weeklyData[weeklyData.length - 4]?.avgIntensity || recent;

    const trend = recent - older;
    const absTrend = Math.abs(trend);

    if (absTrend >= 2) {
      const direction = trend > 0 ? 'improving' : 'declining';
      const firstWeekEntries = weeklyData[0].entries;
      const lastWeekEntries = weeklyData[weeklyData.length - 1].entries;
      patterns.push({
        id: `trend-${direction}`,
        type: 'trend',
        description: `情绪状态${direction}：近期平均强度${recent.toFixed(1)}，较之前${older.toFixed(1)}`,
        frequency: weeklyData.length,
        confidence: Math.min(absTrend / 5, 1),
        firstSeen: firstWeekEntries[0].createdAt,
        lastSeen: lastWeekEntries[lastWeekEntries.length - 1].createdAt,
        relatedMoods: [],
        relatedContexts: [],
        evidence: weeklyData.flatMap(w =>
          w.entries.map(e => ({
            entryId: e.id,
            timestamp: e.createdAt,
            intensity: e.intensity,
          }))
        ),
      });
    }

    return patterns;
  }

  /** 提取共同情境 */
  private extractCommonContexts(entries: MoodEntry[]): string[] {
    const contextCounts = new Map<string, number>();

    for (const entry of entries) {
      if (!entry.context) continue;
      for (const c of entry.context) {
        contextCounts.set(c, (contextCounts.get(c) || 0) + 1);
      }
    }

    return Array.from(contextCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([ctx]) => ctx);
  }

  /** 获取周键值 */
  private getWeekKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = this.getWeekNumber(d);
    return `${year}-W${week}`;
  }

  /** 获取周数 */
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  /** 生成洞察 */
  private generateInsights(patterns: EvolutionPattern[]): string[] {
    const insights: string[] = [];

    const recurring = patterns.filter(p => p.type === 'recurring_emotion');
    if (recurring.length > 0) {
      const topMood = recurring.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`最常出现的情绪是"${topMood.relatedMoods[0]}"，共${topMood.frequency}次`);
    }

    const triggers = patterns.filter(p => p.type === 'trigger');
    if (triggers.length > 0) {
      const topTrigger = triggers.sort((a, b) => b.confidence - a.confidence)[0];
      insights.push(`发现潜在触发因素："${topTrigger.relatedContexts[0]}"可能导致"${topTrigger.relatedMoods[0]}"`);
    }

    const coping = patterns.filter(p => p.type === 'coping_mechanism');
    if (coping.length > 0) {
      insights.push(`已识别${coping.length}种有效的应对机制`);
    }

    const trends = patterns.filter(p => p.type === 'trend');
    if (trends.length > 0) {
      insights.push('检测到情绪状态的趋势性变化');
    }

    return insights;
  }

  /** 生成建议 */
  private generateRecommendations(patterns: EvolutionPattern[]): string[] {
    const recommendations: string[] = [];

    const highFrequencyNegative = patterns.filter(
      p => p.type === 'recurring_emotion' &&
        ['sad', 'anxious', 'lonely'].some(m => p.relatedMoods.includes(m)) &&
        p.frequency >= 5
    );

    if (highFrequencyNegative.length > 0) {
      recommendations.push('考虑寻求专业心理咨询，探索深层原因');
    }

    const triggers = patterns.filter(p => p.type === 'trigger');
    if (triggers.length > 0) {
      const avoidableTriggers = triggers.filter(p =>
        ['work', 'social', 'finance'].some(c => p.relatedContexts.includes(c))
      );
      if (avoidableTriggers.length > 0) {
        recommendations.push('可以尝试调整或避免某些触发情境');
      }
    }

    const coping = patterns.filter(p => p.type === 'coping_mechanism');
    if (coping.length > 0) {
      recommendations.push('继续保持当前有效的应对方式');
    }

    const decliningTrend = patterns.find(p =>
      p.type === 'trend' && p.description.includes('declining')
    );
    if (decliningTrend) {
      recommendations.push('情绪状态呈下降趋势，建议增加自我关怀活动');
    }

    return recommendations;
  }

  /** 按类型计数 */
  private countByType(patterns: EvolutionPattern[]): Record<PatternType, number> {
    const counts: Record<PatternType, number> = {
      recurring_emotion: 0,
      trigger: 0,
      coping_mechanism: 0,
      trend: 0,
    };

    for (const p of patterns) {
      counts[p.type]++;
    }

    return counts;
  }

  private healthEntries: PetHealthEntry[] = [];

  addHealthEntry(entry: PetHealthEntry): void {
    this.healthEntries.push(entry);
  }

  addHealthEntries(entries: PetHealthEntry[]): void {
    this.healthEntries.push(...entries);
  }

  detectHealthPatterns(petId: string): HealthEvolutionReport {
    const petEntries = this.healthEntries.filter(e => e.petId === petId);
    const patterns: HealthEvolutionPattern[] = [];

    patterns.push(...this.detectRecurringAnomalies(petId, petEntries));
    patterns.push(...this.detectHealthTrends(petId, petEntries));
    patterns.push(...this.detectWeightTrends(petId, petEntries));

    const insights = this.generateHealthInsights(patterns);
    const recommendations = this.generateHealthRecommendations(patterns);

    return {
      petId,
      patterns,
      insights,
      recommendations,
      summary: {
        totalPatterns: patterns.length,
        byType: this.countHealthByType(patterns),
        averageConfidence: patterns.length > 0
          ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length
          : 0,
      },
    };
  }

  private detectRecurringAnomalies(petId: string, entries: PetHealthEntry[]): HealthEvolutionPattern[] {
    const patterns: HealthEvolutionPattern[] = [];
    const anomalyEntries = entries.filter(e => e.hasAnomaly);

    if (anomalyEntries.length < 3) return patterns;

    const itemCounts = new Map<string, { count: number; entries: PetHealthEntry[] }>();
    for (const entry of anomalyEntries) {
      for (const item of entry.anomalyItems) {
        if (!itemCounts.has(item)) {
          itemCounts.set(item, { count: 0, entries: [] });
        }
        const data = itemCounts.get(item)!;
        data.count++;
        data.entries.push(entry);
      }
    }

    for (const [item, data] of itemCounts) {
      if (data.count >= 3) {
        patterns.push({
          id: `anomaly-${petId}-${item}`,
          petId,
          type: 'recurring_anomaly',
          description: `反复出现的异常指标：${item}（${data.count}次）`,
          frequency: data.count,
          confidence: Math.min(data.count / 10, 1),
          firstSeen: data.entries[0].createdAt,
          lastSeen: data.entries[data.entries.length - 1].createdAt,
          relatedMetrics: [item],
          evidence: data.entries.map(e => ({
            entryId: e.id,
            timestamp: e.createdAt,
            metrics: { [item]: item === 'poop' ? e.poopLevel : item === 'appetite' ? e.appetiteLevel : item === 'spirit' ? e.spiritLevel : e.exerciseLevel },
          })),
        });
      }
    }

    return patterns;
  }

  private detectHealthTrends(petId: string, entries: PetHealthEntry[]): HealthEvolutionPattern[] {
    const patterns: HealthEvolutionPattern[] = [];

    if (entries.length < 7) return patterns;

    const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half);
    const secondHalf = sorted.slice(half);

    const avgFirst = {
      poop: firstHalf.reduce((s, e) => s + e.poopLevel, 0) / firstHalf.length,
      appetite: firstHalf.reduce((s, e) => s + e.appetiteLevel, 0) / firstHalf.length,
      spirit: firstHalf.reduce((s, e) => s + e.spiritLevel, 0) / firstHalf.length,
      exercise: firstHalf.reduce((s, e) => s + e.exerciseLevel, 0) / firstHalf.length,
    };

    const avgSecond = {
      poop: secondHalf.reduce((s, e) => s + e.poopLevel, 0) / secondHalf.length,
      appetite: secondHalf.reduce((s, e) => s + e.appetiteLevel, 0) / secondHalf.length,
      spirit: secondHalf.reduce((s, e) => s + e.spiritLevel, 0) / secondHalf.length,
      exercise: secondHalf.reduce((s, e) => s + e.exerciseLevel, 0) / secondHalf.length,
    };

    const metrics = ['poop', 'appetite', 'spirit', 'exercise'] as const;
    for (const metric of metrics) {
      const diff = avgSecond[metric] - avgFirst[metric];
      if (Math.abs(diff) >= 1) {
        const direction = diff > 0 ? 'decline' : 'improvement';
        patterns.push({
          id: `trend-${petId}-${metric}-${direction}`,
          petId,
          type: direction === 'decline' ? 'decline' : 'improvement',
          description: `${metric}指标呈${direction === 'decline' ? '下降' : '改善'}趋势（${avgFirst[metric].toFixed(1)} → ${avgSecond[metric].toFixed(1)}）`,
          frequency: entries.length,
          confidence: Math.min(Math.abs(diff) / 3, 1),
          firstSeen: sorted[0].createdAt,
          lastSeen: sorted[sorted.length - 1].createdAt,
          relatedMetrics: [metric],
          evidence: sorted.map(e => ({
            entryId: e.id,
            timestamp: e.createdAt,
            metrics: { [metric]: metric === 'poop' ? e.poopLevel : metric === 'appetite' ? e.appetiteLevel : metric === 'spirit' ? e.spiritLevel : e.exerciseLevel },
          })),
        });
      }
    }

    return patterns;
  }

  private detectWeightTrends(petId: string, entries: PetHealthEntry[]): HealthEvolutionPattern[] {
    const patterns: HealthEvolutionPattern[] = [];
    const weightEntries = entries.filter(e => e.weight !== undefined && e.weight > 0)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (weightEntries.length < 3) return patterns;

    const firstWeight = weightEntries[0].weight!;
    const lastWeight = weightEntries[weightEntries.length - 1].weight!;
    const change = lastWeight - firstWeight;
    const changePercent = (change / firstWeight) * 100;

    if (Math.abs(changePercent) >= 5) {
      const direction = changePercent > 0 ? 'increase' : 'decrease';
      patterns.push({
        id: `weight-${petId}-${direction}`,
        petId,
        type: 'weight_trend',
        description: `体重${direction === 'increase' ? '增加' : '下降'}${Math.abs(changePercent).toFixed(1)}%（${firstWeight}kg → ${lastWeight}kg）`,
        frequency: weightEntries.length,
        confidence: Math.min(Math.abs(changePercent) / 15, 1),
        firstSeen: weightEntries[0].createdAt,
        lastSeen: weightEntries[weightEntries.length - 1].createdAt,
        relatedMetrics: ['weight'],
        evidence: weightEntries.map(e => ({
          entryId: e.id,
          timestamp: e.createdAt,
          metrics: { weight: e.weight! },
        })),
      });
    }

    return patterns;
  }

  private generateHealthInsights(patterns: HealthEvolutionPattern[]): string[] {
    const insights: string[] = [];

    const anomalies = patterns.filter(p => p.type === 'recurring_anomaly');
    if (anomalies.length > 0) {
      const topAnomaly = anomalies.sort((a, b) => b.frequency - a.frequency)[0];
      insights.push(`最常出现的异常指标是"${topAnomaly.relatedMetrics[0]}"，共${topAnomaly.frequency}次`);
    }

    const declines = patterns.filter(p => p.type === 'decline');
    if (declines.length > 0) {
      insights.push(`检测到${declines.length}项健康指标呈下降趋势，建议关注`);
    }

    const improvements = patterns.filter(p => p.type === 'improvement');
    if (improvements.length > 0) {
      insights.push(`检测到${improvements.length}项健康指标呈改善趋势`);
    }

    const weightTrends = patterns.filter(p => p.type === 'weight_trend');
    if (weightTrends.length > 0) {
      insights.push(weightTrends[0].description);
    }

    return insights;
  }

  private generateHealthRecommendations(patterns: HealthEvolutionPattern[]): string[] {
    const recommendations: string[] = [];

    const anomalies = patterns.filter(p => p.type === 'recurring_anomaly');
    if (anomalies.length > 0) {
      recommendations.push('建议记录异常发生时的环境和饮食情况，便于兽医诊断');
    }

    const declines = patterns.filter(p => p.type === 'decline');
    if (declines.length > 0) {
      recommendations.push('多个指标持续下降，建议安排一次全面体检');
    }

    const weightLoss = patterns.find(p => p.type === 'weight_trend' && p.description.includes('下降'));
    if (weightLoss) {
      recommendations.push('体重持续下降，建议检查饮食和消化系统健康');
    }

    const weightGain = patterns.find(p => p.type === 'weight_trend' && p.description.includes('增加'));
    if (weightGain) {
      recommendations.push('体重持续增加，建议控制饮食并增加运动量');
    }

    return recommendations;
  }

  private countHealthByType(patterns: HealthEvolutionPattern[]): Record<HealthPatternType, number> {
    const counts: Record<HealthPatternType, number> = {
      recurring_anomaly: 0,
      improvement: 0,
      decline: 0,
      seasonal: 0,
      weight_trend: 0,
    };

    for (const p of patterns) {
      counts[p.type]++;
    }

    return counts;
  }

  clear(): void {
    this.moodEntries = [];
    this.healthEntries = [];
    this.detectedPatterns.clear();
  }
}
