// 星寰海 v2.0 - memory-body 隐私保护守卫
import type { MoodEntry } from '../types/memoryBodyTypes';

/** PII（个人敏感信息）类型 */
export type PiiType = 'phone' | 'email' | 'address' | 'name' | 'id_card' | 'bank_account' | 'other';

/** PII检测结果接口 */
export interface PiiDetectionResult {
  detected: boolean;
  piiType?: PiiType;
  originalText: string;
  redactedText: string;
  positions: Array<{ start: number; end: number }>;
}

/** MemoryPrivacyGuard 类 - 检测和脱敏个人敏感信息 */
export class MemoryPrivacyGuard {
  // 正则表达式模式
  private patterns: Map<PiiType, RegExp[]> = new Map([
    ['phone', [
      /1[3-9]\d{9}/g, // 中国手机号
      /\+?\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}/g, // 国际电话
    ]],
    ['email', [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    ]],
    ['address', [
      /\d{1,5}[号路街巷弄栋室楼层]|[\u4e00-\u9fa5]{2,}(省|市|区|县|镇|乡|村|组)/g,
    ]],
    ['name', [
      /[\u4e00-\u9fa5]{2,4}(先生|女士|小姐|老师|医生|教授)/g,
    ]],
    ['id_card', [
      /\d{17}[\dXx]|\d{18}[\dXx]/g, // 身份证号
    ]],
    ['bank_account', [
      /\d{16,19}/g, // 银行卡号（简化版）
    ]],
  ]);

  /** 检查文本中的PII */
  checkPrivacy(text: string): PiiDetectionResult[] {
    const results: PiiDetectionResult[] = [];

    for (const [piiType, regexes] of this.patterns) {
      for (const regex of regexes) {
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          const positions = this.findMatchPositions(text, regex);
          results.push({
            detected: true,
            piiType,
            originalText: text,
            redactedText: text,
            positions,
          });
        }
      }
    }

    return results;
  }

  /** 查找匹配位置 */
  private findMatchPositions(text: string, regex: RegExp): Array<{ start: number; end: number }> {
    const positions: Array<{ start: number; end: number }> = [];
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    let match;

    while ((match = globalRegex.exec(text)) !== null) {
      positions.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return positions;
  }

  /** 脱敏文本 */
  redactText(text: string): string {
    let redacted = text;

    for (const [_, regexes] of this.patterns) {
      for (const regex of regexes) {
        redacted = redacted.replace(regex, this.getRedactionReplacement());
      }
    }

    return redacted;
  }

  /** 获取脱敏替换字符串 */
  private getRedactionReplacement(): string {
    return '***';
  }

  /** 检查情绪记录的隐私风险 */
  checkMoodEntry(entry: MoodEntry): {
    hasPrivacyRisk: boolean;
    riskyFields: Array<{ field: string; content: string; piiTypes: PiiType[] }>;
  } {
    const riskyFields: Array<{ field: string; content: string; piiTypes: PiiType[] }> = [];

    // 检查备注字段
    if (entry.note) {
      const privacyCheck = this.checkPrivacy(entry.note);
      const detectedPii = privacyCheck
        .filter(r => r.detected)
        .map(r => r.piiType!);

      if (detectedPii.length > 0) {
        riskyFields.push({
          field: 'note',
          content: entry.note,
          piiTypes: detectedPii,
        });
      }
    }

    // 检查情境标签（通常不会有PII，但可以扩展）
    if (entry.context) {
      for (const context of entry.context) {
        const privacyCheck = this.checkPrivacy(context);
        const detectedPii = privacyCheck
          .filter(r => r.detected)
          .map(r => r.piiType!);

        if (detectedPii.length > 0) {
          riskyFields.push({
            field: 'context',
            content: context,
            piiTypes: detectedPii,
          });
        }
      }
    }

    return {
      hasPrivacyRisk: riskyFields.length > 0,
      riskyFields,
    };
  }

  /** 批量检查并脱敏 */
  batchRedact(entries: MoodEntry[]): Array<{
    entry: MoodEntry;
    redacted: boolean;
    fields: string[];
  }> {
    return entries.map(entry => {
      const privacyCheck = this.checkMoodEntry(entry);
      let redactedEntry = { ...entry };
      const redactedFields: string[] = [];

      if (privacyCheck.hasPrivacyRisk) {
        for (const riskyField of privacyCheck.riskyFields) {
          if (riskyField.field === 'note' && entry.note) {
            redactedEntry.note = this.redactText(entry.note);
            redactedFields.push('note');
          } else if (riskyField.field === 'context' && entry.context) {
            redactedEntry.context = entry.context.map(c => this.redactText(c)) as typeof entry.context;
            redactedFields.push('context');
          }
        }
      }

      return {
        entry: redactedEntry,
        redacted: redactedFields.length > 0,
        fields: redactedFields,
      };
    });
  }

  /** 添加自定义PII模式 */
  addCustomPattern(piiType: PiiType, pattern: RegExp): void {
    if (!this.patterns.has(piiType)) {
      this.patterns.set(piiType, []);
    }
    this.patterns.get(piiType)!.push(pattern);
  }

  /** 移除自定义PII模式 */
  removeCustomPattern(piiType: PiiType, patternSource: string): void {
    if (!this.patterns.has(piiType)) return;

    const patterns = this.patterns.get(piiType)!;
    const index = patterns.findIndex(p => p.source === patternSource);
    if (index >= 0) {
      patterns.splice(index, 1);
    }
  }

  /** 获取所有支持的PII类型 */
  getSupportedPiiTypes(): PiiType[] {
    return Array.from(this.patterns.keys());
  }

  /** 清除所有自定义模式 */
  clearCustomPatterns(): void {
    // 保留默认模式，只清除额外的
    for (const [type, patterns] of this.patterns) {
      if (patterns.length > this.getDefaultPatternCount(type)) {
        this.patterns.set(type, patterns.slice(0, this.getDefaultPatternCount(type)));
      }
    }
  }

  /** 获取默认模式数量 */
  private getDefaultPatternCount(piiType: PiiType): number {
    const defaults: Record<PiiType, number> = {
      phone: 2,
      email: 1,
      address: 1,
      name: 1,
      id_card: 1,
      bank_account: 1,
      other: 0,
    };
    return defaults[piiType] || 0;
  }
}
