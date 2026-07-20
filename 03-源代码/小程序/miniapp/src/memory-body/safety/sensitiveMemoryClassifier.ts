// 星寰海 v2.0 - memory-body 敏感度分类器
import type { MoodEntry } from '../types/memoryBodyTypes';
import { ForbiddenMemoryFilter } from './forbiddenMemoryFilter';
import { MemoryPrivacyGuard } from './memoryPrivacyGuard';

/** 敏感度等级 */
export type SensitivityLevel = 'public' | 'private' | 'sensitive' | 'critical';

/** 分类结果接口 */
export interface ClassificationResult {
  level: SensitivityLevel;
  score: number; // 0-1，越高越敏感
  reasons: string[];
  recommendations: string[];
}

/** 敏感关键词配置 */
interface SensitiveKeyword {
  keywords: string[];
  weight: number; // 权重
  level: SensitivityLevel;
}

/** SensitiveMemoryClassifier 类 - 分类记忆的敏感程度 */
export class SensitiveMemoryClassifier {
  private forbiddenFilter: ForbiddenMemoryFilter;
  private privacyGuard: MemoryPrivacyGuard;

  // 敏感关键词配置
  private sensitiveKeywords: SensitiveKeyword[] = [
    {
      keywords: ['自杀', '想死', '不想活', '伤害自己', '自残', '割腕'],
      weight: 1.0,
      level: 'critical',
    },
    {
      keywords: ['抑郁', '焦虑症', '心理疾病', '精神科', '心理咨询'],
      weight: 0.8,
      level: 'sensitive',
    },
    {
      keywords: ['分手', '离婚', '失恋', '被抛弃', '背叛'],
      weight: 0.6,
      level: 'sensitive',
    },
    {
      keywords: ['工作压力', '失业', '经济困难', '债务', '破产'],
      weight: 0.5,
      level: 'private',
    },
    {
      keywords: ['家庭矛盾', '父母吵架', '婆媳关系', '亲子关系'],
      weight: 0.4,
      level: 'private',
    },
    {
      keywords: ['考试', '学习', '工作', '运动', '旅行', '美食'],
      weight: 0.1,
      level: 'public',
    },
  ];

  constructor() {
    this.forbiddenFilter = new ForbiddenMemoryFilter();
    this.privacyGuard = new MemoryPrivacyGuard();
  }

  /** 分类文本敏感度 */
  classifyText(text: string): ClassificationResult {
    const reasons: string[] = [];
    let totalScore = 0;
    let detectedLevel: SensitivityLevel = 'public';

    // 1. 检查禁止内容
    const filterResult = this.forbiddenFilter.filterForbidden(text);
    if (!filterResult.allowed) {
      totalScore += 1.0;
      detectedLevel = 'critical';
      reasons.push(`包含禁止内容: ${filterResult.forbiddenTypes.join(', ')}`);
    }

    // 2. 检查PII
    const privacyResults = this.privacyGuard.checkPrivacy(text);
    const hasPii = privacyResults.some(r => r.detected);
    if (hasPii) {
      totalScore += 0.7;
      detectedLevel = maxLevel(detectedLevel, 'sensitive');
      reasons.push('包含个人敏感信息');
    }

    // 3. 检查敏感关键词
    for (const config of this.sensitiveKeywords) {
      for (const keyword of config.keywords) {
        if (text.includes(keyword)) {
          totalScore += config.weight;
          detectedLevel = maxLevel(detectedLevel, config.level);
          reasons.push(`检测到关键词: "${keyword}" (${config.level})`);
        }
      }
    }

    // 4. 计算最终分数
    const finalScore = Math.min(totalScore, 1);

    return {
      level: detectedLevel,
      score: finalScore,
      reasons,
      recommendations: this.generateRecommendations(detectedLevel, finalScore),
    };
  }

  /** 分类情绪记录敏感度 */
  classifyMoodEntry(entry: MoodEntry): ClassificationResult {
    const textParts: string[] = [];

    if (entry.note) textParts.push(entry.note);
    if (entry.context && entry.context.length > 0) textParts.push(entry.context.join(' '));

    const combinedText = textParts.join(' ');

    if (combinedText.trim().length === 0) {
      return {
        level: 'public',
        score: 0,
        reasons: ['无具体内容'],
        recommendations: ['可公开分享'],
      };
    }

    return this.classifyText(combinedText);
  }

  /** 批量分类 */
  batchClassify(entries: MoodEntry[]): Array<{
    entry: MoodEntry;
    result: ClassificationResult;
  }> {
    return entries.map(entry => ({
      entry,
      result: this.classifyMoodEntry(entry),
    }));
  }

  /** 根据敏感度过滤 */
  filterBySensitivity(
    entries: MoodEntry[],
    maxLevel: SensitivityLevel
  ): MoodEntry[] {
    const levelOrder: Record<SensitivityLevel, number> = {
      public: 0,
      private: 1,
      sensitive: 2,
      critical: 3,
    };

    const maxLevelValue = levelOrder[maxLevel];

    return entries.filter(entry => {
      const classification = this.classifyMoodEntry(entry);
      return levelOrder[classification.level] <= maxLevelValue;
    });
  }

  /** 获取指定敏感度的条目 */
  getBySensitivityLevel(
    entries: MoodEntry[],
    level: SensitivityLevel
  ): MoodEntry[] {
    return entries.filter(entry => {
      const classification = this.classifyMoodEntry(entry);
      return classification.level === level;
    });
  }

  /** 生成建议 */
  private generateRecommendations(level: SensitivityLevel, score: number): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case 'public':
        recommendations.push('可以安全分享');
        break;
      case 'private':
        recommendations.push('建议仅自己可见');
        if (score > 0.5) {
          recommendations.push('考虑加密存储');
        }
        break;
      case 'sensitive':
        recommendations.push('强烈建议加密存储');
        recommendations.push('避免云端同步');
        if (score > 0.7) {
          recommendations.push('建议定期审查并删除');
        }
        break;
      case 'critical':
        recommendations.push('必须加密存储');
        recommendations.push('禁止云端同步');
        recommendations.push('建议立即寻求专业帮助');
        recommendations.push('设置访问密码保护');
        break;
    }

    return recommendations;
  }

  /** 添加自定义敏感关键词 */
  addCustomKeyword(keyword: string, weight: number, level: SensitivityLevel): void {
    this.sensitiveKeywords.push({
      keywords: [keyword],
      weight,
      level,
    });
  }

  /** 移除自定义敏感关键词 */
  removeCustomKeyword(keyword: string): void {
    const index = this.sensitiveKeywords.findIndex(k => k.keywords.includes(keyword));
    if (index >= 0) {
      this.sensitiveKeywords.splice(index, 1);
    }
  }

  /** 获取所有敏感级别 */
  getSensitivityLevels(): SensitivityLevel[] {
    return ['public', 'private', 'sensitive', 'critical'];
  }

  /** 获取级别描述 */
  getLevelDescription(level: SensitivityLevel): string {
    const descriptions: Record<SensitivityLevel, string> = {
      public: '公开 - 可安全分享的内容',
      private: '私密 - 仅自己可见的内容',
      sensitive: '敏感 - 需要加密保护的内容',
      critical: '高危 - 涉及生命安全的内容',
    };
    return descriptions[level];
  }
}

/** 辅助函数：比较两个级别的大小 */
function maxLevel(a: SensitivityLevel, b: SensitivityLevel): SensitivityLevel {
  const order: Record<SensitivityLevel, number> = {
    public: 0,
    private: 1,
    sensitive: 2,
    critical: 3,
  };
  return order[a] >= order[b] ? a : b;
}
