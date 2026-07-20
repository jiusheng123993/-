// 星寰海 v2.0 - memory-body 矛盾检测器
import type { MoodEntry } from '../types/memoryBodyTypes';

/** 矛盾类型 */
export type ContradictionType = 'emotional' | 'temporal' | 'contextual' | 'intensity';

/** 矛盾严重程度 */
export type ContradictionSeverity = 'low' | 'medium' | 'high';

/** 矛盾项接口 */
export interface Contradiction {
  id: string;
  type: ContradictionType;
  severity: ContradictionSeverity;
  sourceId: string;
  targetId: string;
  description: string;
  evidence: string[];
  suggestion?: string;
}

/** 矛盾报告接口 */
export interface ContradictionReport {
  contradictions: Contradiction[];
  summary: {
    total: number;
    bySeverity: Record<ContradictionSeverity, number>;
    byType: Record<ContradictionType, number>;
  };
  hasCritical: boolean;
}

/** 矛盾检测器类 */
export class ContradictionDetector {
  private moodEntries: Map<string, MoodEntry> = new Map();

  /** 添加情绪记录到检测器 */
  addMoodEntry(entry: MoodEntry): void {
    this.moodEntries.set(entry.id, entry);
  }

  /** 批量添加情绪记录 */
  addMoodEntries(entries: MoodEntry[]): void {
    for (const entry of entries) {
      this.addMoodEntry(entry);
    }
  }

  /** 检测所有矛盾 */
  detectAll(): ContradictionReport {
    const contradictions: Contradiction[] = [];

    // 1. 检测情绪矛盾
    contradictions.push(...this.detectEmotionalContradictions());

    // 2. 检测时间矛盾
    contradictions.push(...this.detectTemporalContradictions());

    // 3. 检测情境矛盾
    contradictions.push(...this.detectContextualContradictions());

    // 4. 检测强度矛盾
    contradictions.push(...this.detectIntensityContradictions());

    return this.generateReport(contradictions);
  }

  /** 检测新记忆与现有记忆的矛盾 */
  detectWithNewMemory(newEntry: MoodEntry, existingEntries: MoodEntry[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    for (const existing of existingEntries) {
      // 情绪极性矛盾
      const emotionalContradiction = this.checkEmotionalContradiction(newEntry, existing);
      if (emotionalContradiction) {
        contradictions.push(emotionalContradiction);
      }

      // 强度矛盾（短时间内剧烈变化）
      const intensityContradiction = this.checkIntensityContradiction(newEntry, existing);
      if (intensityContradiction) {
        contradictions.push(intensityContradiction);
      }
    }

    return contradictions;
  }

  /** 检测情绪矛盾 */
  private detectEmotionalContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const entries = Array.from(this.moodEntries.values());

    // 正面情绪列表
    const positiveMoods = ['happy', 'joyful', 'grateful', 'hopeful', 'calm', 'relaxed', 'confident'];
    // 负面情绪列表
    const negativeMoods = ['sad', 'anxious', 'angry', 'fearful', 'lonely', 'frustrated', 'guilty', 'ashamed'];

    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];

        // 检查是否在短时间内出现相反情绪
        const timeDiff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
        if (timeDiff > 24 * 60 * 60 * 1000) continue; // 超过24小时不检测

        const aIsPositive = positiveMoods.includes(a.mood);
        const bIsPositive = positiveMoods.includes(b.mood);
        const aIsNegative = negativeMoods.includes(a.mood);
        const bIsNegative = negativeMoods.includes(b.mood);

        // 如果一个是正面，一个是负面，可能存在矛盾
        if ((aIsPositive && bIsNegative) || (aIsNegative && bIsPositive)) {
          contradictions.push({
            id: `${a.id}-${b.id}`,
            type: 'emotional',
            severity: 'medium',
            sourceId: a.id,
            targetId: b.id,
            description: `短时间内情绪极性相反：${a.mood}(强度${a.intensity}) vs ${b.mood}(强度${b.intensity})`,
            evidence: [
              `记录A: ${a.mood} @ ${a.createdAt.toISOString()}`,
              `记录B: ${b.mood} @ ${b.createdAt.toISOString()}`,
              `时间差: ${Math.round(timeDiff / 60000)}分钟`,
            ],
            suggestion: '可能是情绪波动或记录错误，建议核实',
          });
        }
      }
    }

    return contradictions;
  }

  /** 检测时间矛盾 */
  private detectTemporalContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const entries = Array.from(this.moodEntries.values());

    // 按时间排序
    entries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];

      // 检查是否有重复时间戳的记录
      if (current.createdAt.getTime() === previous.createdAt.getTime()) {
        contradictions.push({
          id: `temp-${current.id}-${previous.id}`,
          type: 'temporal',
          severity: 'low',
          sourceId: previous.id,
          targetId: current.id,
          description: '两条记录具有相同的时间戳',
          evidence: [
            `记录ID: ${previous.id} 和 ${current.id}`,
            `时间: ${current.createdAt.toISOString()}`,
          ],
          suggestion: '可能是重复提交，建议删除一条',
        });
      }
    }

    return contradictions;
  }

  /** 检测情境矛盾 */
  private detectContextualContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const entries = Array.from(this.moodEntries.values());

    for (const entry of entries) {
      if (!entry.context || entry.context.length === 0) continue;

      // 检查同一情境下的情绪一致性
      const sameContextEntries = entries.filter(e =>
        e.id !== entry.id &&
        e.context &&
        e.context.some(c => entry.context!.includes(c))
      );

      for (const other of sameContextEntries) {
        const timeDiff = Math.abs(entry.createdAt.getTime() - other.createdAt.getTime());
        if (timeDiff > 7 * 24 * 60 * 60 * 1000) continue; // 超过7天不检测

        // 简单判断：如果情境相同但情绪完全相反
        const contextOverlap = entry.context!.filter(c => other.context!.includes(c));
        if (contextOverlap.length >= 2) {
          const isOpposite = this.areOppositeMoods(entry.mood, other.mood);
          if (isOpposite) {
            contradictions.push({
              id: `ctx-${entry.id}-${other.id}`,
              type: 'contextual',
              severity: 'low',
              sourceId: entry.id,
              targetId: other.id,
              description: `相同情境下情绪相反: ${entry.mood} vs ${other.mood}`,
              evidence: [
                `共享情境: ${contextOverlap.join(', ')}`,
                `时间差: ${Math.round(timeDiff / 86400000)}天`,
              ],
              suggestion: '正常情绪波动，无需处理',
            });
          }
        }
      }
    }

    return contradictions;
  }

  /** 检测强度矛盾 */
  private detectIntensityContradictions(): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const entries = Array.from(this.moodEntries.values());

    for (let i = 1; i < entries.length; i++) {
      const current = entries[i];
      const previous = entries[i - 1];

      const timeDiff = current.createdAt.getTime() - previous.createdAt.getTime();
      // 只检查24小时内的变化
      if (timeDiff > 24 * 60 * 60 * 1000 || timeDiff < 0) continue;

      const intensityDiff = Math.abs(current.intensity - previous.intensity);

      // 如果强度变化超过5，标记为可能的矛盾
      if (intensityDiff >= 5) {
        contradictions.push({
          id: `int-${current.id}-${previous.id}`,
          type: 'intensity',
          severity: intensityDiff >= 8 ? 'high' : 'medium',
          sourceId: previous.id,
          targetId: current.id,
          description: `短时间内情绪强度剧烈变化: ${previous.intensity} -> ${current.intensity}`,
          evidence: [
            `前次强度: ${previous.intensity} @ ${previous.createdAt.toISOString()}`,
            `当前强度: ${current.intensity} @ ${current.createdAt.toISOString()}`,
            `变化幅度: ${intensityDiff}`,
          ],
          suggestion: intensityDiff >= 8 ? '可能存在异常，建议关注' : '可能是正常情绪波动',
        });
      }
    }

    return contradictions;
  }

  /** 检查两个情绪是否相反 */
  private areOppositeMoods(mood1: string, mood2: string): boolean {
    const oppositePairs: Array<[string, string]> = [
      ['happy', 'sad'],
      ['calm', 'anxious'],
      ['confident', 'nervous'],
      ['relaxed', 'stressed'],
      ['hopeful', 'lonely_deep'],
      ['joyful', 'empty'],
    ];

    return oppositePairs.some(([a, b]) =>
      (a === mood1 && b === mood2) || (a === mood2 && b === mood1)
    );
  }

  /** 检查情绪矛盾 */
  private checkEmotionalContradiction(a: MoodEntry, b: MoodEntry): Contradiction | null {
    const timeDiff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    if (timeDiff > 24 * 60 * 60 * 1000) return null;

    if (this.areOppositeMoods(a.mood, b.mood)) {
      return {
        id: `${a.id}-${b.id}`,
        type: 'emotional',
        severity: 'medium',
        sourceId: a.id,
        targetId: b.id,
        description: `情绪相反: ${a.mood} vs ${b.mood}`,
        evidence: [
          `记录A: ${a.mood} @ ${a.createdAt.toISOString()}`,
          `记录B: ${b.mood} @ ${b.createdAt.toISOString()}`,
        ],
      };
    }

    return null;
  }

  /** 检查强度矛盾 */
  private checkIntensityContradiction(a: MoodEntry, b: MoodEntry): Contradiction | null {
    const timeDiff = Math.abs(a.createdAt.getTime() - b.createdAt.getTime());
    if (timeDiff > 24 * 60 * 60 * 1000) return null;

    const intensityDiff = Math.abs(a.intensity - b.intensity);
    if (intensityDiff >= 5) {
      return {
        id: `int-${a.id}-${b.id}`,
        type: 'intensity',
        severity: intensityDiff >= 8 ? 'high' : 'medium',
        sourceId: a.id,
        targetId: b.id,
        description: `强度剧烈变化: ${Math.min(a.intensity, b.intensity)} -> ${Math.max(a.intensity, b.intensity)}`,
        evidence: [
          `强度差: ${intensityDiff}`,
          `时间差: ${Math.round(timeDiff / 60000)}分钟`,
        ],
      };
    }

    return null;
  }

  /** 生成报告 */
  private generateReport(contradictions: Contradiction[]): ContradictionReport {
    const bySeverity: Record<ContradictionSeverity, number> = { low: 0, medium: 0, high: 0 };
    const byType: Record<ContradictionType, number> = { emotional: 0, temporal: 0, contextual: 0, intensity: 0 };

    for (const c of contradictions) {
      bySeverity[c.severity]++;
      byType[c.type]++;
    }

    return {
      contradictions,
      summary: {
        total: contradictions.length,
        bySeverity,
        byType,
      },
      hasCritical: contradictions.some(c => c.severity === 'high'),
    };
  }

  /** 清除所有数据 */
  clear(): void {
    this.moodEntries.clear();
  }
}
