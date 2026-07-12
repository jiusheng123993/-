// 星寰海 v2.0 - 干预追踪适配器
// 负责记录干预尝试、检索历史干预和计算成功率

import { getStorage, setStorage } from '../../utils/storage';
import type { InterventionRecordDetail } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  INTERVENTIONS: 'interventions',
  INTERVENTION_STATS: 'intervention_stats'
};

/** 干预类型统计 */
interface InterventionStats {
  total: number;
  byType: Record<string, { count: number; successful: number }>;
  recentSuccessRate: number[]; // 最近N次的成功率
}

export class InterventionTrackerAdapter {
  constructor(_userId: string) {
    // userId not used in current implementation
  }

  /**
   * 追踪干预记录
   * @param record 干预记录详情
   */
  trackIntervention(record: InterventionRecordDetail): void {
    try {
      const interventions = this.getInterventionHistory();
      interventions.unshift(record);

      // 最多保留1000条记录
      if (interventions.length > 1000) {
        interventions.splice(1000);
      }

      setStorage(STORAGE_KEYS.INTERVENTIONS, interventions);
      this.updateStats(record);
    } catch (error) {
      console.error('[InterventionTrackerAdapter] trackIntervention error:', error);
    }
  }

  /**
   * 更新统计数据
   * @param record 新的干预记录
   */
  private updateStats(record: InterventionRecordDetail): void {
    const stats = getStorage<InterventionStats>(STORAGE_KEYS.INTERVENTION_STATS) || {
      total: 0,
      byType: {},
      recentSuccessRate: []
    };

    stats.total++;

    // 按类型统计
    if (!stats.byType[record.interventionType]) {
      stats.byType[record.interventionType] = { count: 0, successful: 0 };
    }
    stats.byType[record.interventionType].count++;

    // 成功判定：outcome为successful或partial
    if (record.outcome === 'successful' || record.outcome === 'partial') {
      stats.byType[record.interventionType].successful++;
    }

    // 记录最近成功率（滑动窗口）
    const isSuccess = record.outcome === 'successful' || record.outcome === 'partial';
    stats.recentSuccessRate.push(isSuccess ? 1 : 0);
    if (stats.recentSuccessRate.length > 50) {
      stats.recentSuccessRate.shift();
    }

    setStorage(STORAGE_KEYS.INTERVENTION_STATS, stats);
  }

  /**
   * 获取干预历史
   * @param limit 返回数量限制，默认50
   * @param interventionType 可选的类型过滤
   */
  getInterventionHistory(limit: number = 50, interventionType?: string): InterventionRecordDetail[] {
    try {
      let history = getStorage<InterventionRecordDetail[]>(STORAGE_KEYS.INTERVENTIONS) || [];

      // 类型过滤
      if (interventionType) {
        history = history.filter(r => r.interventionType === interventionType);
      }

      return history.slice(0, limit);
    } catch (error) {
      console.error('[InterventionTrackerAdapter] getInterventionHistory error:', error);
      return [];
    }
  }

  /**
   * 计算干预成功率
   * @param days 分析天数，默认30天
   * @param interventionType 可选的类型过滤
   */
  calculateSuccessRate(days: number = 30, interventionType?: string): {
    overall: number;
    byType: Record<string, { successRate: number; total: number }>;
    trend: number[];
  } {
    try {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const history = this.getInterventionHistory(1000);
      const filteredHistory = history.filter(h => h.createdAt.getTime() > cutoff);

      // 如果有类型过滤
      let targetHistory = filteredHistory;
      if (interventionType) {
        targetHistory = filteredHistory.filter(h => h.interventionType === interventionType);
      }

      // 计算总体成功率
      const total = targetHistory.length;
      const successful = targetHistory.filter(
        h => h.outcome === 'successful' || h.outcome === 'partial'
      ).length;
      const overall = total > 0 ? Math.round((successful / total) * 100) : 0;

      // 按类型分组计算
      const byType: Record<string, { successRate: number; total: number }> = {};
      const groupedByType: Record<string, Array<{ outcome: string }>> = {};

      filteredHistory.forEach(h => {
        if (!groupedByType[h.interventionType]) {
          groupedByType[h.interventionType] = [];
        }
        groupedByType[h.interventionType].push({ outcome: h.outcome });
      });

      Object.entries(groupedByType).forEach(([type, records]) => {
        const typeTotal = records.length;
        const typeSuccessful = records.filter(
          r => r.outcome === 'successful' || r.outcome === 'partial'
        ).length;
        byType[type] = {
          successRate: typeTotal > 0 ? Math.round((typeSuccessful / typeTotal) * 100) : 0,
          total: typeTotal
        };
      });

      // 计算趋势（按周分组）
      const trend = this.calculateWeeklyTrend(filteredHistory);

      return { overall, byType, trend };
    } catch (error) {
      console.error('[InterventionTrackerAdapter] calculateSuccessRate error:', error);
      return { overall: 0, byType: {}, trend: [] };
    }
  }

  /**
   * 计算每周趋势
   */
  private calculateWeeklyTrend(history: InterventionRecordDetail[]): number[] {
    const weeklyData: Record<string, { total: number; successful: number }> = {};

    history.forEach(record => {
      const date = new Date(record.createdAt);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // 本周开始日期
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, successful: 0 };
      }

      weeklyData[weekKey].total++;
      if (record.outcome === 'successful' || record.outcome === 'partial') {
        weeklyData[weekKey].successful++;
      }
    });

    return Object.entries(weeklyData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, data]) =>
        data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0
      );
  }

  /**
   * 获取干预统计摘要
   */
  getStatsSummary(): {
    totalInterventions: number;
    averageEffectiveness: number;
    bestPerformingType: string | null;
    lastIntervention: Date | null;
  } {
    try {
      const history = this.getInterventionHistory(1000);
      const stats = getStorage<InterventionStats>(STORAGE_KEYS.INTERVENTION_STATS);

      if (history.length === 0) {
        return {
          totalInterventions: 0,
          averageEffectiveness: 0,
          bestPerformingType: null,
          lastIntervention: null
        };
      }

      // 计算平均有效性分数
      const avgEffectiveness = Math.round(
        history.reduce((sum, h) => sum + (h.effectivenessScore || 0), 0) / history.length
      );

      // 找出表现最好的干预类型
      let bestType: string | null = null;
      let bestRate = 0;

      if (stats) {
        Object.entries(stats.byType).forEach(([type, data]) => {
          const rate = data.count > 0 ? (data.successful / data.count) * 100 : 0;
          if (rate > bestRate && data.count >= 3) { // 至少3次才纳入比较
            bestRate = rate;
            bestType = type;
          }
        });
      }

      return {
        totalInterventions: history.length,
        averageEffectiveness: avgEffectiveness,
        bestPerformingType: bestType,
        lastIntervention: history[0].createdAt
      };
    } catch (error) {
      console.error('[InterventionTrackerAdapter] getStatsSummary error:', error);
      return {
        totalInterventions: 0,
        averageEffectiveness: 0,
        bestPerformingType: null,
        lastIntervention: null
      };
    }
  }

  /**
   * 清除数据
   */
  clear(): void {
    setStorage(STORAGE_KEYS.INTERVENTIONS, []);
    setStorage(STORAGE_KEYS.INTERVENTION_STATS, null);
  }
}