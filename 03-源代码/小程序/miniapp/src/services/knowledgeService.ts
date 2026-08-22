/**
 * 知识图谱服务（Phase 3）
 * 1. syncKnowledgeGraph：拉取服务端最新图谱（热更新）→ setActiveGraph + 本地缓存；失败用缓存/静态兜底
 * 2. submitKnowledgeFeedback：用户纠错提交（进 knowledge_feedback 表，管理后台人工审核）
 */
import { api } from './api'
import { getStorage, setStorage } from '../utils/storage'
import { setActiveGraph } from '../data/petKnowledge/medicalGraph'
import type { MedicalKnowledgeGraph } from '../data/petKnowledge/medicalGraph'

/** 图谱缓存 key（storage 内部带 xhh_ 前缀） */
const CACHE_KEY = 'knowledge_graph'

/** 服务端图谱响应（body.data 结构） */
interface KnowledgeLatestResponse {
  version: string
  data: MedicalKnowledgeGraph
}

/**
 * 同步最新图谱（热更新，页面启动时调用一次，失败不阻塞）
 * 优先级：网络成功（校验结构）→ 本地缓存 → 静态兜底（不切换）
 * @returns 是否成功切换到有效图谱
 */
export async function syncKnowledgeGraph(): Promise<boolean> {
  try {
    const res = await api.get<KnowledgeLatestResponse>('/knowledge/latest')
    if (res && res.data && Array.isArray(res.data.riskRules) && Array.isArray(res.data.diseases)) {
      setActiveGraph(res.data)
      setStorage(CACHE_KEY, res)
      return true
    }
  } catch {
    // 网络失败：走本地缓存兜底
  }
  const cached = getStorage<KnowledgeLatestResponse>(CACHE_KEY)
  if (cached && cached.data && Array.isArray(cached.data.riskRules)) {
    setActiveGraph(cached.data)
    return true
  }
  return false
}

/**
 * 提交纠错反馈（登录态）
 * @param params - 纠错内容（实体类型/名称/建议 + 可选上下文）
 */
export async function submitKnowledgeFeedback(params: {
  entityType: 'disease' | 'risk_level' | 'advice' | 'other'
  entityName: string
  suggestion: string
  checkId?: string
  petId?: string
}): Promise<void> {
  await api.post('/knowledge/feedback', {
    entity_type: params.entityType,
    entity_name: params.entityName,
    suggestion: params.suggestion,
    check_id: params.checkId,
    pet_id: params.petId,
  })
}
