// 星寰海 v2.0 - memory-body 禁止内容过滤器
// PiiType not needed in this file

/** 禁止内容类型 */
export type ForbiddenType = 'self_harm' | 'violence' | 'illegal' | 'harassment' | 'hate_speech' | 'other';

/** 过滤结果接口 */
export interface FilterResult {
  allowed: boolean;
  forbiddenTypes: ForbiddenType[];
  originalText: string;
  filteredText?: string;
  reason?: string;
}

/** 禁止内容模式配置 */
interface ForbiddenPattern {
  type: ForbiddenType;
  patterns: RegExp[];
  severity: 'low' | 'medium' | 'high';
}

/** FORBIDDEN_PATTERNS - 禁止内容正则表达式数组 */
export const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  // 自伤相关
  {
    type: 'self_harm',
    severity: 'high',
    patterns: [
      /自杀|想死|不想活了|结束生命|结束自己/i,
      /伤害自己|自残|割腕|划手|吞药|跳楼|跳下去/i,
      /站在天台|站在楼顶|爬上栏杆/i,
      /没有意义活下去|活着没意思|不如死了/i,
    ],
  },
  // 暴力相关
  {
    type: 'violence',
    severity: 'high',
    patterns: [
      /杀人|杀死|杀害|捅人|砍人/i,
      /爆炸|炸弹|制造爆炸物/i,
      /绑架|劫持|非法拘禁/i,
      /虐待|家暴|殴打他人/i,
    ],
  },
  // 违法活动
  {
    type: 'illegal',
    severity: 'high',
    patterns: [
      /贩毒|卖毒品|买毒品|吸毒/i,
      /赌博|开设赌场|网络赌博/i,
      /诈骗|电信诈骗|网络诈骗/i,
      /洗钱|非法集资|传销/i,
    ],
  },
  // 骚扰相关
  {
    type: 'harassment',
    severity: 'medium',
    patterns: [
      /跟踪|尾随|偷拍|偷窥/i,
      /威胁|恐吓|勒索钱财/i,
      /性骚扰|猥亵|侵犯隐私/i,
    ],
  },
  // 仇恨言论
  {
    type: 'hate_speech',
    severity: 'medium',
    patterns: [
      /种族歧视|白人至上|黑人都是/i,
      /性别歧视|女人就是|男人都不是好东西/i,
      /地域歧视|某省人都|某地人都/i,
    ],
  },
];

/** ForbiddenMemoryFilter 类 - 过滤禁止内容 */
export class ForbiddenMemoryFilter {
  private customPatterns: Map<ForbiddenType, ForbiddenPattern> = new Map();

  constructor() {
    // 初始化默认模式
    this.initializeDefaultPatterns();
  }

  /** 初始化默认模式 */
  private initializeDefaultPatterns(): void {
    for (const pattern of FORBIDDEN_PATTERNS) {
      this.customPatterns.set(pattern.type, pattern);
    }
  }

  /** 过滤文本 */
  filterForbidden(text: string): FilterResult {
    const detectedTypes: ForbiddenType[] = [];
    let filteredText = text;
    let hasHighSeverity = false;

    for (const patternConfig of FORBIDDEN_PATTERNS) {
      for (const regex of patternConfig.patterns) {
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          detectedTypes.push(patternConfig.type);

          // 高严重度直接拒绝
          if (patternConfig.severity === 'high') {
            hasHighSeverity = true;
          } else {
            // 中低严重度尝试脱敏
            filteredText = filteredText.replace(regex, this.getRedactionReplacement());
          }
        }
      }
    }

    // 检查自定义模式
    for (const [type, patternConfig] of this.customPatterns) {
      for (const regex of patternConfig.patterns) {
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          detectedTypes.push(type);
          if (patternConfig.severity === 'high') {
            hasHighSeverity = true;
          } else {
            filteredText = filteredText.replace(regex, this.getRedactionReplacement());
          }
        }
      }
    }

    return {
      allowed: !hasHighSeverity && detectedTypes.length === 0,
      forbiddenTypes: detectedTypes,
      originalText: text,
      filteredText: hasHighSeverity ? undefined : filteredText,
      reason: hasHighSeverity
        ? `检测到高危内容: ${detectedTypes.join(', ')}`
        : detectedTypes.length > 0
          ? `检测到敏感内容，已自动脱敏: ${detectedTypes.join(', ')}`
          : undefined,
    };
  }

  /** 批量过滤 */
  batchFilter(texts: string[]): Array<{
    index: number;
    result: FilterResult;
  }> {
    return texts.map((text, index) => ({
      index,
      result: this.filterForbidden(text),
    }));
  }

  /** 添加自定义禁止模式 */
  addCustomPattern(type: ForbiddenType, pattern: RegExp, severity: 'low' | 'medium' | 'high' = 'medium'): void {
    if (!this.customPatterns.has(type)) {
      this.customPatterns.set(type, { type, patterns: [], severity });
    }
    this.customPatterns.get(type)!.patterns.push(pattern);
  }

  /** 移除自定义禁止模式 */
  removeCustomPattern(type: ForbiddenType, patternSource: string): void {
    const config = this.customPatterns.get(type);
    if (!config) return;

    const index = config.patterns.findIndex(p => p.source === patternSource);
    if (index >= 0) {
      config.patterns.splice(index, 1);
    }
  }

  /** 获取所有禁止类型 */
  getForbiddenTypes(): ForbiddenType[] {
    return Array.from(new Set([...FORBIDDEN_PATTERNS.map(p => p.type), ...this.customPatterns.keys()]));
  }

  /** 获取指定类型的严重程度 */
  getSeverity(type: ForbiddenType): 'low' | 'medium' | 'high' {
    const config = this.customPatterns.get(type);
    return config?.severity || 'medium';
  }

  /** 检查是否为高危内容 */
  isHighSeverity(type: ForbiddenType): boolean {
    return this.getSeverity(type) === 'high';
  }

  /** 获取脱敏替换字符串 */
  private getRedactionReplacement(): string {
    return '[已过滤]';
  }

  /** 清除所有自定义模式 */
  clearCustomPatterns(): void {
    this.customPatterns.clear();
    this.initializeDefaultPatterns();
  }

  /** 重置为默认配置 */
  resetToDefault(): void {
    this.clearCustomPatterns();
  }
}
