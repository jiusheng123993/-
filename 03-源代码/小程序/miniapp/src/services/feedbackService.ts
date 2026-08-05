/**
 * 用户反馈服务
 * NPS 满意度调查提交和历史查询
 */
import { api } from './api'

export interface NpsSubmitParams {
  score: number
  feedback?: string
  trigger_event?: string
}

export interface NpsSubmitResult {
  success: boolean
  message: string
}

export interface FeedbackRecord {
  id: string
  feedback_type: string
  score: number | null
  content: string | null
  trigger_event: string | null
  created_at: string
}

/**
 * 提交 NPS 满意度调查
 */
export async function submitNpsFeedback(params: NpsSubmitParams): Promise<boolean> {
  try {
    const res = await api.post<NpsSubmitResult>('/api/feedback/nps', {
      score: params.score,
      feedback: params.feedback || '',
      trigger_event: params.trigger_event || '',
    })
    return res.success
  } catch {
    return false
  }
}

/**
 * 获取用户反馈历史
 */
export async function getMyFeedbackHistory(): Promise<FeedbackRecord[]> {
  try {
    const res = await api.get<{ success: boolean; data: FeedbackRecord[] }>('/api/feedback/my')
    return res.data || []
  } catch {
    return []
  }
}