// 星寰海 v2.0 - memory-body 记忆衰减机制
import type { MoodEntry, EmotionPattern } from '../types/memoryBodyTypes';
import { loadConfig } from '../core/memoryBodyConfig';

/** 衰减因子计算器接口 */
export interface DecayFactorCalculator {
  calculate(createdAt: Date): number;
}

/** 默认衰减因子计算器 */
export class DefaultDecayFactorCalculator implements DecayFactorCalculator {
  private decayRatePerWeek: number;

  constructor(decayRatePerWeek: number = 0.9) {
    this.decayRatePerWeek = decayRatePerWeek;
  }

  calculate(createdAt: Date): number {
    const now = Date.now();
    const elapsedMs = now - createdAt.getTime();
    const elapsedWeeks = elapsedMs / (1000 * 60 * 60 * 24 * 7);

    return Math.pow(this.decayRatePerWeek, elapsedWeeks);
  }
}

/** 衰减结果接口 */
export interface DecayResult<T> {
  data: T;
  originalScore: number;
  decayedScore: number;
  decayFactor: number;
  shouldArchive: boolean;
}

/** MemoryDecay 类 - 管理记忆的衰减过程 */
export class MemoryDecay {
  private calculator: DecayFactorCalculator;
  private config = loadConfig();

  constructor(calculator?: DecayFactorCalculator) {
    this.calculator = calculator || new DefaultDecayFactorCalculator(this.config.decayRatePerWeek);
  }

  /** 应用衰减到单个条目 */
  applyDecay<T extends { id: string; createdAt: Date }>(
    entry: T,
    baseScore: number
  ): DecayResult<T> {
    const decayFactor = this.calculator.calculate(entry.createdAt);
    const decayedScore = baseScore * decayFactor;

    return {
      data: entry,
      originalScore: baseScore,
      decayedScore: Math.max(decayedScore, this.config.minRelevanceScore),
      decayFactor,
      shouldArchive: decayedScore < this.config.minRelevanceScore,
    };
  }

  /** 批量应用衰减 */
  applyDecayBatch<T extends { id: string; createdAt: Date }>(
    entries: Array<{ data: T; score: number }>
  ): Array<DecayResult<T>> {
    return entries.map(({ data, score }) => this.applyDecay(data, score));
  }

  /** 对情绪记录列表应用衰减 */
  applyDecayToMoodEntries(entries: MoodEntry[]): Array<DecayResult<MoodEntry>> {
    return entries.map(entry => {
      // 基础分数：强度权重
      const baseScore = entry.intensity / 10;
      return this.applyDecay(entry, baseScore);
    });
  }

  /** 对模式列表应用衰减 */
  applyDecayToPatterns(patterns: EmotionPattern[]): Array<DecayResult<EmotionPattern>> {
    return patterns.map(pattern => {
      // 基础分数：置信度
      const baseScore = pattern.confidence;
      return this.applyDecay(pattern, baseScore);
    });
  }

  /** 获取需要归档的条目 */
  getEntriesToArchive<T extends { id: string; createdAt: Date }>(
    entries: Array<{ data: T; score: number }>
  ): T[] {
    const decayed = this.applyDecayBatch(entries);
    return decayed
      .filter(r => r.shouldArchive)
      .map(r => r.data);
  }

  /** 计算两个时间点之间的衰减因子 */
  calculateDecayBetween(startTime: Date, endTime: Date): number {
    const elapsedMs = endTime.getTime() - startTime.getTime();
    const elapsedWeeks = elapsedMs / (1000 * 60 * 60 * 24 * 7);

    return Math.pow(this.config.decayRatePerWeek, elapsedWeeks);
  }

  /** 获取指定天数前的日期 */
  getDateBeforeDays(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  /** 获取衰减统计信息 */
  getDecayStats(entries: Array<{ data: { id: string; createdAt: Date }; score: number }>): {
    totalEntries: number;
    averageDecayFactor: number;
    minDecayFactor: number;
    maxDecayFactor: number;
    entriesBelowThreshold: number;
  } {
    const decayed = this.applyDecayBatch(entries);

    const factors = decayed.map(r => r.decayFactor);
    const belowThreshold = decayed.filter(r => r.shouldArchive).length;

    return {
      totalEntries: entries.length,
      averageDecayFactor: factors.reduce((a, b) => a + b, 0) / factors.length,
      minDecayFactor: Math.min(...factors),
      maxDecayFactor: Math.max(...factors),
      entriesBelowThreshold: belowThreshold,
    };
  }

  /** 设置自定义衰减率 */
  setDecayRate(ratePerWeek: number): void {
    if (ratePerWeek <= 0 || ratePerWeek > 1) {
      throw new Error('衰减率必须在(0, 1]范围内');
    }
    this.config = { ...this.config, decayRatePerWeek: ratePerWeek };
    this.calculator = new DefaultDecayFactorCalculator(ratePerWeek);
  }

  /** 获取当前衰减率 */
  getDecayRate(): number {
    return this.config.decayRatePerWeek;
  }

  /** 重置为默认配置 */
  resetToDefault(): void {
    this.config = loadConfig();
    this.calculator = new DefaultDecayFactorCalculator(this.config.decayRatePerWeek);
  }
}
