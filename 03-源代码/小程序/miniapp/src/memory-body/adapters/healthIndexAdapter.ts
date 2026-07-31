import { getStorage, setStorage } from '../../utils/storage';
import type { PetHealthEntry, HealthProfile, HealthTrendPoint, AnomalyItem, HealthRiskLevel } from '../types/memoryBodyTypes';

/**
 * 健康指数适配器
 * 管理宠物健康打卡记录的本地存储、索引构建和健康画像生成
 */
const STORAGE_KEYS = {
  HEALTH_ENTRIES: 'health_entries',
  HEALTH_INDEX: 'health_index',
  HEALTH_PROFILE: 'health_profile'
};

interface HealthIndexEntry {
  date: string;
  petId: string;
  userId: string;
  poopAvg: number;
  appetiteAvg: number;
  spiritAvg: number;
  exerciseAvg: number;
  weight?: number;
  anomalyCount: number;
  riskLevel: HealthRiskLevel;
}

export class HealthIndexAdapter {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('[HealthIndexAdapter] userId is required');
    }
    this.userId = userId;
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`;
  }

  indexHealthEntry(entry: PetHealthEntry): void {
    try {
      const entries = this.getHealthEntries();
      entries.unshift(entry);

      if (entries.length > 500) {
        entries.splice(500);
      }

      setStorage(this.userKey(STORAGE_KEYS.HEALTH_ENTRIES), entries);
      this.updateHealthIndex(entry);
    } catch (error) {
    }
  }

  private updateHealthIndex(entry: PetHealthEntry): void {
    const index = getStorage<Record<string, HealthIndexEntry>>(this.userKey(STORAGE_KEYS.HEALTH_INDEX)) || {};
    const dateKey = entry.createdAt.toISOString().split('T')[0];
    const petKey = `${dateKey}_${entry.petId}`;

    if (!index[petKey]) {
      index[petKey] = {
        date: dateKey,
        petId: entry.petId,
        userId: this.userId,
        poopAvg: entry.poopLevel,
        appetiteAvg: entry.appetiteLevel,
        spiritAvg: entry.spiritLevel,
        exerciseAvg: entry.exerciseLevel,
        weight: entry.weight,
        anomalyCount: entry.hasAnomaly ? 1 : 0,
        riskLevel: entry.riskLevel
      };
    } else {
      const existing = index[petKey];
      const count = this.getHealthEntries().filter(
        e => e.createdAt.toISOString().split('T')[0] === dateKey && e.petId === entry.petId
      ).length;

      existing.poopAvg = Math.round(((existing.poopAvg * (count - 1) + entry.poopLevel) / count) * 10) / 10;
      existing.appetiteAvg = Math.round(((existing.appetiteAvg * (count - 1) + entry.appetiteLevel) / count) * 10) / 10;
      existing.spiritAvg = Math.round(((existing.spiritAvg * (count - 1) + entry.spiritLevel) / count) * 10) / 10;
      existing.exerciseAvg = Math.round(((existing.exerciseAvg * (count - 1) + entry.exerciseLevel) / count) * 10) / 10;
      if (entry.weight) existing.weight = entry.weight;
      if (entry.hasAnomaly) existing.anomalyCount++;
      if (entry.riskLevel === 'emergency' || (entry.riskLevel === 'high' && existing.riskLevel !== 'emergency')) {
        existing.riskLevel = entry.riskLevel;
      }
    }

    setStorage(this.userKey(STORAGE_KEYS.HEALTH_INDEX), index);
  }

  getHealthEntries(): PetHealthEntry[] {
    return getStorage<PetHealthEntry[]>(this.userKey(STORAGE_KEYS.HEALTH_ENTRIES)) || [];
  }

  getHealthEntriesByPet(petId: string): PetHealthEntry[] {
    return this.getHealthEntries().filter(e => e.petId === petId);
  }

  buildHealthProfile(petId: string, days: number = 30): HealthProfile {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = this.getHealthEntriesByPet(petId)
        .filter(e => e.createdAt.getTime() > cutoff);

      const trends: HealthTrendPoint[] = [];
      const dateMap = new Map<string, PetHealthEntry[]>();

      entries.forEach(entry => {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, []);
        }
        dateMap.get(dateKey)!.push(entry);
      });

      let totalPoop = 0;
      let totalAppetite = 0;
      let totalSpirit = 0;
      let totalExercise = 0;
      let totalAnomalies = 0;
      let firstWeight: number | undefined;
      let lastWeight: number | undefined;

      const recentAnomalies: HealthProfile['recentAnomalies'] = [];

      dateMap.forEach((dayEntries, date) => {
        const poopAvg = dayEntries.reduce((s, e) => s + e.poopLevel, 0) / dayEntries.length;
        const appetiteAvg = dayEntries.reduce((s, e) => s + e.appetiteLevel, 0) / dayEntries.length;
        const spiritAvg = dayEntries.reduce((s, e) => s + e.spiritLevel, 0) / dayEntries.length;
        const exerciseAvg = dayEntries.reduce((s, e) => s + e.exerciseLevel, 0) / dayEntries.length;
        const anomalyCount = dayEntries.filter(e => e.hasAnomaly).length;
        const maxRisk = dayEntries.reduce((max, e) => {
          const order: Record<string, number> = { low: 0, medium: 1, high: 2, emergency: 3 };
          return order[e.riskLevel] > order[max] ? e.riskLevel : max;
        }, 'low' as HealthRiskLevel);

        const lastEntry = dayEntries[dayEntries.length - 1];
        if (lastEntry.weight) {
          if (!firstWeight) firstWeight = lastEntry.weight;
          lastWeight = lastEntry.weight;
        }

        totalPoop += poopAvg;
        totalAppetite += appetiteAvg;
        totalSpirit += spiritAvg;
        totalExercise += exerciseAvg;
        totalAnomalies += anomalyCount;

        trends.push({
          date,
          petId,
          poopAvg: Math.round(poopAvg * 10) / 10,
          appetiteAvg: Math.round(appetiteAvg * 10) / 10,
          spiritAvg: Math.round(spiritAvg * 10) / 10,
          exerciseAvg: Math.round(exerciseAvg * 10) / 10,
          weight: lastEntry.weight,
          anomalyCount,
          riskLevel: maxRisk
        });

        if (anomalyCount > 0) {
          const allAnomalyItems = dayEntries
            .filter(e => e.hasAnomaly)
            .flatMap(e => e.anomalyItems);
          recentAnomalies.push({
            date,
            items: [...new Set(allAnomalyItems)] as AnomalyItem[],
            riskLevel: maxRisk
          });
        }
      });

      trends.sort((a, b) => a.date.localeCompare(b.date));

      const dayCount = dateMap.size || 1;
      const dominantRisk = this.calculateDominantRisk(trends);

      const profile: HealthProfile = {
        petId,
        totalEntries: entries.length,
        dateRange: {
          start: trends[0]?.date || '',
          end: trends[trends.length - 1]?.date || ''
        },
        trends,
        summary: {
          avgPoop: Math.round((totalPoop / dayCount) * 10) / 10,
          avgAppetite: Math.round((totalAppetite / dayCount) * 10) / 10,
          avgSpirit: Math.round((totalSpirit / dayCount) * 10) / 10,
          avgExercise: Math.round((totalExercise / dayCount) * 10) / 10,
          totalAnomalies,
          dominantRiskLevel: dominantRisk,
          weightChange: firstWeight && lastWeight ? Math.round((lastWeight - firstWeight) * 100) / 100 : undefined
        },
        recentAnomalies: recentAnomalies.slice(-10)
      };

      setStorage(this.userKey(STORAGE_KEYS.HEALTH_PROFILE), profile);

      return profile;
    } catch (error) {
      return this.getEmptyProfile(petId);
    }
  }

  private calculateDominantRisk(trends: HealthTrendPoint[]): HealthRiskLevel {
    const counts: Record<HealthRiskLevel, number> = { low: 0, medium: 0, high: 0, emergency: 0 };
    trends.forEach(t => { counts[t.riskLevel]++; });
    return (Object.entries(counts) as [HealthRiskLevel, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  getHealthTrend(petId: string, days: number = 7): HealthTrendPoint[] {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const entries = this.getHealthEntriesByPet(petId)
        .filter(e => e.createdAt.getTime() > cutoff);

      const trendByDate: Record<string, { poops: number[]; appetites: number[]; spirits: number[]; exercises: number[]; anomalies: number; weights: number[]; risks: HealthRiskLevel[] }> = {};

      entries.forEach(entry => {
        const dateKey = entry.createdAt.toISOString().split('T')[0];
        if (!trendByDate[dateKey]) {
          trendByDate[dateKey] = { poops: [], appetites: [], spirits: [], exercises: [], anomalies: 0, weights: [], risks: [] };
        }
        trendByDate[dateKey].poops.push(entry.poopLevel);
        trendByDate[dateKey].appetites.push(entry.appetiteLevel);
        trendByDate[dateKey].spirits.push(entry.spiritLevel);
        trendByDate[dateKey].exercises.push(entry.exerciseLevel);
        if (entry.hasAnomaly) trendByDate[dateKey].anomalies++;
        if (entry.weight) trendByDate[dateKey].weights.push(entry.weight);
        trendByDate[dateKey].risks.push(entry.riskLevel);
      });

      return Object.entries(trendByDate)
        .map(([date, data]) => {
          const maxRisk = data.risks.reduce((max, r) => {
            const order: Record<string, number> = { low: 0, medium: 1, high: 2, emergency: 3 };
            return order[r] > order[max] ? r : max;
          }, 'low' as HealthRiskLevel);

          return {
            date,
            petId,
            poopAvg: Math.round((data.poops.reduce((a, b) => a + b, 0) / data.poops.length) * 10) / 10,
            appetiteAvg: Math.round((data.appetites.reduce((a, b) => a + b, 0) / data.appetites.length) * 10) / 10,
            spiritAvg: Math.round((data.spirits.reduce((a, b) => a + b, 0) / data.spirits.length) * 10) / 10,
            exerciseAvg: Math.round((data.exercises.reduce((a, b) => a + b, 0) / data.exercises.length) * 10) / 10,
            weight: data.weights.length > 0 ? data.weights[data.weights.length - 1] : undefined,
            anomalyCount: data.anomalies,
            riskLevel: maxRisk
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      return [];
    }
  }

  private getEmptyProfile(petId: string): HealthProfile {
    return {
      petId,
      totalEntries: 0,
      dateRange: { start: '', end: '' },
      trends: [],
      summary: {
        avgPoop: 0,
        avgAppetite: 0,
        avgSpirit: 0,
        avgExercise: 0,
        totalAnomalies: 0,
        dominantRiskLevel: 'low'
      },
      recentAnomalies: []
    };
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEYS.HEALTH_ENTRIES), []);
    setStorage(this.userKey(STORAGE_KEYS.HEALTH_INDEX), {});
    setStorage(this.userKey(STORAGE_KEYS.HEALTH_PROFILE), null);
  }
}
