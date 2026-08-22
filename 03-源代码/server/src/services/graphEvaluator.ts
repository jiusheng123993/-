/**
 * 图谱评估器（服务端版，Phase 3 收尾）
 * 目的：聊天路径 check_symptom 消费权威图谱（设计文档 §8 迁移对照），
 *       与前端 medicalGraph.evaluateRiskLevel 同构，保证两条路径判断一致
 * 策略：文本能映射到图谱症状名 → 用图谱规则评估（draft 过滤）；映射不上 → 调用方回落关键词兜底
 * 安全底线：紧急关键词检测仍在调用方保留（chat 输入为自由文本，关键词是可依赖的最低保障）
 */
import { KnowledgeGraphRepository } from '../repositories/knowledgeRepository.js';

const graphRepository = new KnowledgeGraphRepository();

/** 风险等级（与前端 RiskLevel 对齐） */
export type RiskLevel = 'normal' | 'caution' | 'warning' | 'emergency';

/** 图谱规则（只取评估需要的字段；导出供测试夹具标注） */
export interface GraphRule {
  id: string;
  name: string;
  level: RiskLevel;
  priority: number;
  match: {
    type: string;
    symptomIds: string[];
    conditions?: { durationIn?: string[]; appetite?: string; energy?: string };
  };
  sourceRef: { sourceId: string; reviewStatus?: string };
}

/** 图谱数据（只取评估需要的顶层键；导出供测试夹具标注） */
export interface GraphData {
  version: string;
  riskRules: GraphRule[];
  diseases: unknown[];
  symptoms: Array<{ id: string; name: string }>;
}

/**
 * 加载最新权威图谱（已过滤 draft 由评估时处理；DB 不可用返回 null，调用方回落关键词逻辑）
 * @returns 图谱数据（结构不完整返回 null）
 */
export async function loadActiveGraph(): Promise<GraphData | null> {
  try {
    const latest = await graphRepository.getLatestGraph();
    if (!latest) return null;
    const g = latest.data as unknown as GraphData;
    if (!g || !Array.isArray(g.riskRules) || !Array.isArray(g.symptoms)) return null;
    return g;
  } catch {
    return null;
  }
}

/**
 * 自由文本症状 → 图谱症状 ID（按症状名包含匹配，如"呕吐腹泻"→ ['vomiting','diarrhea']）
 * @param graph - 图谱数据
 * @param text - 用户描述的症状文本
 * @returns 命中的症状 ID 列表（可能为空）
 */
export function mapSymptomTextToIds(graph: GraphData, text: string): string[] {
  return graph.symptoms.filter((s) => text.includes(s.name)).map((s) => s.id);
}

/**
 * 图谱规则评估（与前端 evaluateRiskLevel 同构）
 * - single 规则：任一症状命中即算（OR）
 * - combo / with_condition：全部命中才算（AND），时长条件不满足则继续低优先级
 * - draft 规则过滤；normal 档规则不参与（聊天场景保守观察档由默认值兜底）
 * @param graph - 图谱数据
 * @param symptomIds - 已映射的症状 ID
 * @param duration - 持续时长（可选，chat 传入的自由文本，匹配不上则规则跳过）
 * @returns 风险等级 + 命中的规则名（用于提示依据）
 */
export function evaluateSymptomLevel(
  graph: GraphData,
  symptomIds: string[],
  duration?: string,
): { level: RiskLevel; ruleName?: string } {
  const rules = graph.riskRules
    .filter((r) => r.sourceRef?.reviewStatus !== 'draft' && r.level !== 'normal')
    .sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    const present = (id: string) => symptomIds.includes(id);
    const matched = rule.match.type === 'single'
      ? rule.match.symptomIds.some(present)
      : rule.match.symptomIds.every(present);
    if (!matched) continue;

    // 时长条件：命中任一才成立，否则继续低优先级（等价前端"回落"语义）
    if (rule.match.conditions?.durationIn) {
      if (duration && rule.match.conditions.durationIn.includes(duration)) {
        return { level: rule.level, ruleName: rule.name };
      }
      continue;
    }
    return { level: rule.level, ruleName: rule.name };
  }
  // 映射到已知症状但无规则命中 → 保守观察档（与原聊天行为一致，不降级）
  return { level: 'caution' };
}
