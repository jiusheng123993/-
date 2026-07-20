import type { MoodEntry, EmotionPattern, PetHealthEntry, HealthRiskLevel } from '../types/memoryBodyTypes';
import { loadConfig } from '../core/memoryBodyConfig';

export interface BaseRetrieveOptions {
  timeRange?: number;
  startTime?: Date;
  endTime?: Date;
  minIntensity?: number;
  limit?: number;
  applyDecay?: boolean;
}

export interface MoodRetrieveOptions extends BaseRetrieveOptions {
  moodTags?: string[];
  contextTags?: string[];
}

export interface HealthRetrieveOptions extends BaseRetrieveOptions {
  petId?: string;
}

export type RetrieveOptions = MoodRetrieveOptions;

export interface RetrievedMemory<T> {
  data: T;
  relevanceScore: number;
  decayedScore: number;
  createdAt: Date;
}

export class MemoryRetriever {
  private config = loadConfig();

  retrieveMoodEntries(entries: MoodEntry[], options: MoodRetrieveOptions): RetrievedMemory<MoodEntry>[] {
    let filtered = [...entries];

    filtered = this.applyTimeFilter(filtered, options);

    if (options.moodTags && options.moodTags.length > 0) {
      filtered = filtered.filter(e => options.moodTags!.includes(e.mood));
    }

    if (options.contextTags && options.contextTags.length > 0) {
      filtered = filtered.filter(e =>
        e.context && e.context.some(c => options.contextTags!.includes(c))
      );
    }

    if (options.minIntensity !== undefined) {
      filtered = filtered.filter(e => e.intensity >= options.minIntensity!);
    }

    const scored = filtered.map(entry => {
      const relevanceScore = this.calculateMoodRelevanceScore(entry);
      const decayedScore = options.applyDecay !== false
        ? this.applyDecayFactor(relevanceScore, entry.createdAt)
        : relevanceScore;

      return {
        data: entry,
        relevanceScore,
        decayedScore,
        createdAt: entry.createdAt,
      };
    });

    scored.sort((a, b) => b.decayedScore - a.decayedScore);

    if (options.limit !== undefined) {
      return scored.slice(0, options.limit);
    }

    return scored;
  }

  retrievePatterns(patterns: EmotionPattern[], query?: string): RetrievedMemory<EmotionPattern>[] {
    let filtered = [...patterns];

    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p =>
        p.description.toLowerCase().includes(lowerQuery) ||
        p.patternType.toLowerCase().includes(lowerQuery)
      );
    }

    return filtered
      .map(pattern => ({
        data: pattern,
        relevanceScore: pattern.confidence,
        decayedScore: pattern.confidence,
        createdAt: pattern.createdAt,
      }))
      .sort((a, b) => b.decayedScore - a.decayedScore);
  }

  getRecentTrend(entries: MoodEntry[], days: number): Array<{
    date: string;
    avgIntensity: number;
    count: number;
    dominantMood: string;
  }> {
    const trendMap = new Map<string, { total: number; count: number; moods: Record<string, number> }>();

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.createdAt.getTime() > cutoff);

    for (const entry of recentEntries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { total: 0, count: 0, moods: {} });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.total += entry.intensity;
      dayData.count++;
      dayData.moods[entry.mood] = (dayData.moods[entry.mood] || 0) + 1;
    }

    return Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        avgIntensity: Math.round(data.total / data.count),
        count: data.count,
        dominantMood: Object.entries(data.moods).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown',
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  findSimilarEntries(entries: MoodEntry[], target: MoodEntry, threshold: number = 0.5): MoodEntry[] {
    return entries
      .filter(e => e.id !== target.id)
      .map(entry => ({
        entry,
        similarity: this.calculateSimilarity(target, entry),
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.entry);
  }

  retrieveHealthEntries(entries: PetHealthEntry[], options: HealthRetrieveOptions): RetrievedMemory<PetHealthEntry>[] {
    let filtered = [...entries];

    if (options.petId) {
      filtered = filtered.filter(e => e.petId === options.petId);
    }

    filtered = this.applyTimeFilter(filtered, options);

    if (options.minIntensity !== undefined) {
      filtered = filtered.filter(e => {
        const avgMetric = (e.poopLevel + e.appetiteLevel + e.spiritLevel + e.exerciseLevel) / 4;
        return avgMetric >= options.minIntensity!;
      });
    }

    const scored = filtered.map(entry => {
      const relevanceScore = this.calculateHealthRelevanceScore(entry);
      const decayedScore = options.applyDecay !== false
        ? this.applyDecayFactor(relevanceScore, entry.createdAt)
        : relevanceScore;

      return {
        data: entry,
        relevanceScore,
        decayedScore,
        createdAt: entry.createdAt,
      };
    });

    scored.sort((a, b) => b.decayedScore - a.decayedScore);

    if (options.limit !== undefined) {
      return scored.slice(0, options.limit);
    }

    return scored;
  }

  getHealthTrend(entries: PetHealthEntry[], petId: string, days: number): Array<{
    date: string;
    poopAvg: number;
    appetiteAvg: number;
    spiritAvg: number;
    exerciseAvg: number;
    anomalyCount: number;
    riskLevel: HealthRiskLevel;
  }> {
    const trendMap = new Map<string, {
      poops: number[];
      appetites: number[];
      spirits: number[];
      exercises: number[];
      anomalies: number;
      risks: HealthRiskLevel[];
    }>();

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const recentEntries = entries.filter(e => e.petId === petId && e.createdAt.getTime() > cutoff);

    for (const entry of recentEntries) {
      const dateKey = entry.createdAt.toISOString().split('T')[0];
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { poops: [], appetites: [], spirits: [], exercises: [], anomalies: 0, risks: [] });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.poops.push(entry.poopLevel);
      dayData.appetites.push(entry.appetiteLevel);
      dayData.spirits.push(entry.spiritLevel);
      dayData.exercises.push(entry.exerciseLevel);
      if (entry.hasAnomaly) dayData.anomalies++;
      dayData.risks.push(entry.riskLevel);
    }

    return Array.from(trendMap.entries())
      .map(([date, data]) => {
        const maxRisk = data.risks.reduce((max, r) => {
          const order: Record<HealthRiskLevel, number> = { low: 0, medium: 1, high: 2, emergency: 3 };
          return order[r] > order[max] ? r : max;
        }, 'low' as HealthRiskLevel);

        return {
          date,
          poopAvg: Math.round((data.poops.reduce((a, b) => a + b, 0) / data.poops.length) * 10) / 10,
          appetiteAvg: Math.round((data.appetites.reduce((a, b) => a + b, 0) / data.appetites.length) * 10) / 10,
          spiritAvg: Math.round((data.spirits.reduce((a, b) => a + b, 0) / data.spirits.length) * 10) / 10,
          exerciseAvg: Math.round((data.exercises.reduce((a, b) => a + b, 0) / data.exercises.length) * 10) / 10,
          anomalyCount: data.anomalies,
          riskLevel: maxRisk,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  findAnomalousEntries(entries: PetHealthEntry[], petId?: string): PetHealthEntry[] {
    let filtered = entries.filter(e => e.hasAnomaly);
    if (petId) {
      filtered = filtered.filter(e => e.petId === petId);
    }
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private applyTimeFilter<T extends { createdAt: Date }>(entries: T[], options: BaseRetrieveOptions): T[] {
    let filtered = [...entries];

    if (options.startTime) {
      filtered = filtered.filter(e => e.createdAt >= options.startTime!);
    }
    if (options.endTime) {
      filtered = filtered.filter(e => e.createdAt <= options.endTime!);
    } else if (options.timeRange) {
      const cutoff = Date.now() - options.timeRange;
      filtered = filtered.filter(e => e.createdAt.getTime() > cutoff);
    }

    return filtered;
  }

  private calculateMoodRelevanceScore(entry: MoodEntry): number {
    let score = 0;

    score += (entry.intensity / 10) * 0.4;

    const daysAgo = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0, 1 - daysAgo / 30);
    score += timeWeight * 0.3;

    if (entry.note && entry.note.length > 0) {
      score += 0.15;
    }

    if (entry.context && entry.context.length > 0) {
      score += Math.min(entry.context.length * 0.05, 0.15);
    }

    return Math.min(score, 1.0);
  }

  private calculateHealthRelevanceScore(entry: PetHealthEntry): number {
    let score = 0;

    const avgMetric = (entry.poopLevel + entry.appetiteLevel + entry.spiritLevel + entry.exerciseLevel) / 4;
    score += (avgMetric / 5) * 0.3;

    const daysAgo = (Date.now() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0, 1 - daysAgo / 30);
    score += timeWeight * 0.3;

    if (entry.hasAnomaly) {
      score += 0.2;
      score += Math.min(entry.anomalyItems.length * 0.05, 0.15);
    }

    if (entry.note && entry.note.length > 0) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  private applyDecayFactor(score: number, createdAt: Date): number {
    const now = Date.now();
    const elapsedMs = now - createdAt.getTime();
    const elapsedWeeks = elapsedMs / (1000 * 60 * 60 * 24 * 7);

    const decayed = score * Math.pow(this.config.decayRatePerWeek, elapsedWeeks);

    return Math.max(decayed, this.config.minRelevanceScore);
  }

  private calculateSimilarity(a: MoodEntry, b: MoodEntry): number {
    let similarity = 0;

    if (a.mood === b.mood) similarity += 0.4;

    const intensityDiff = Math.abs(a.intensity - b.intensity);
    similarity += Math.max(0, 0.3 - intensityDiff * 0.03);

    if (a.context && b.context) {
      const overlap = a.context.filter(c => b.context!.includes(c));
      similarity += overlap.length * 0.1;
    }

    const timeDiff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
      similarity += 0.2;
    }

    return Math.min(similarity, 1.0);
  }
}
