import type { MoodEntry, EmotionPattern } from '../types/memoryBodyTypes';
import { loadConfig } from '../core/memoryBodyConfig';

export interface DecayFactorCalculator {
  calculate(createdAt: Date): number;
}

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

export interface DecayResult<T> {
  data: T;
  originalScore: number;
  decayedScore: number;
  decayFactor: number;
  shouldArchive: boolean;
}

export interface ArchivableEntry {
  id: string;
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount?: number;
}

const DEFAULT_MAX_AGE_DAYS = 90;
const DEFAULT_ARCHIVE_THRESHOLD = 2;

export class MemoryDecay {
  private calculator: DecayFactorCalculator;
  private config = loadConfig();
  private maxAgeDays: number;
  private archiveThreshold: number;

  constructor(
    calculator?: DecayFactorCalculator,
    maxAgeDays: number = DEFAULT_MAX_AGE_DAYS,
    archiveThreshold: number = DEFAULT_ARCHIVE_THRESHOLD,
  ) {
    this.calculator = calculator || new DefaultDecayFactorCalculator(this.config.decayRatePerWeek);
    this.maxAgeDays = maxAgeDays;
    this.archiveThreshold = archiveThreshold;
  }

  shouldArchive(entry: ArchivableEntry): boolean {
    const lastAccessed = entry.lastAccessedAt ?? entry.createdAt;
    const accessCount = entry.accessCount ?? 0;
    const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceAccess > this.maxAgeDays && accessCount < this.archiveThreshold;
  }

  applyDecay<T extends ArchivableEntry>(
    entry: T,
    baseScore: number
  ): DecayResult<T> {
    const decayFactor = this.calculator.calculate(entry.createdAt);
    const rawDecayedScore = baseScore * decayFactor;
    const archiveByDecay = rawDecayedScore < this.config.minRelevanceScore;
    const archiveByAge = this.shouldArchive(entry);

    return {
      data: entry,
      originalScore: baseScore,
      decayedScore: Math.max(rawDecayedScore, this.config.minRelevanceScore),
      decayFactor,
      shouldArchive: archiveByDecay || archiveByAge,
    };
  }

  applyDecayBatch<T extends ArchivableEntry>(
    entries: Array<{ data: T; score: number }>
  ): Array<DecayResult<T>> {
    return entries.map(({ data, score }) => this.applyDecay(data, score));
  }

  applyDecayToMoodEntries(entries: MoodEntry[]): Array<DecayResult<MoodEntry>> {
    return entries.map(entry => {
      const baseScore = entry.intensity / 10;
      return this.applyDecay(entry, baseScore);
    });
  }

  applyDecayToPatterns(patterns: EmotionPattern[]): Array<DecayResult<EmotionPattern>> {
    return patterns.map(pattern => {
      const baseScore = pattern.confidence;
      return this.applyDecay(pattern, baseScore);
    });
  }

  getEntriesToArchive<T extends ArchivableEntry>(
    entries: Array<{ data: T; score: number }>
  ): T[] {
    const decayed = this.applyDecayBatch(entries);
    return decayed
      .filter(r => r.shouldArchive)
      .map(r => r.data);
  }

  calculateDecayBetween(startTime: Date, endTime: Date): number {
    const elapsedMs = endTime.getTime() - startTime.getTime();
    const elapsedWeeks = elapsedMs / (1000 * 60 * 60 * 24 * 7);

    return Math.pow(this.config.decayRatePerWeek, elapsedWeeks);
  }

  getDateBeforeDays(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  getDecayStats(entries: Array<{ data: ArchivableEntry; score: number }>): {
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

  setDecayRate(ratePerWeek: number): void {
    if (ratePerWeek <= 0 || ratePerWeek > 1) {
      throw new Error('衰减率必须在(0, 1]范围内');
    }
    this.config = { ...this.config, decayRatePerWeek: ratePerWeek };
    this.calculator = new DefaultDecayFactorCalculator(ratePerWeek);
  }

  getDecayRate(): number {
    return this.config.decayRatePerWeek;
  }

  setArchiveParams(maxAgeDays: number, archiveThreshold: number): void {
    if (maxAgeDays <= 0) {
      throw new Error('maxAgeDays必须大于0');
    }
    if (archiveThreshold < 0) {
      throw new Error('archiveThreshold不能为负数');
    }
    this.maxAgeDays = maxAgeDays;
    this.archiveThreshold = archiveThreshold;
  }

  resetToDefault(): void {
    this.config = loadConfig();
    this.calculator = new DefaultDecayFactorCalculator(this.config.decayRatePerWeek);
    this.maxAgeDays = DEFAULT_MAX_AGE_DAYS;
    this.archiveThreshold = DEFAULT_ARCHIVE_THRESHOLD;
  }
}
