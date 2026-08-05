/**
 * 分享卡片服务
 *
 * 对接后端 /api/share-cards 路由，提供卡片生成/列表/详情/删除/分享记录功能
 */
import { api } from './api'

/** 分享卡片来源数据 */
export interface ShareCardSourceData {
  report_id?: string
  memoir_id?: string
  pet_id?: string
  milestone_id?: string
  snapshot_id?: string
  name_history_id?: string
  feed_id?: string
  custom_text?: string
  custom_photos?: string[]
}

/** 分享卡片样式 */
export interface ShareCardStyle {
  theme?: 'warm' | 'elegant' | 'cute' | 'minimal'
  background_color?: string
  font_family?: string
}

/** 分享渠道 */
export type ShareChannel = 'wechat' | 'moments' | 'save' | 'copy'

/** 分享卡片数据行 */
export interface ShareCardRow {
  id: string
  user_id: string
  card_type: string
  source_data: ShareCardSourceData
  style: ShareCardStyle
  card_url: string
  card_data: Record<string, unknown>
  share_count: number
  created_at: string
}

/** 生成分享卡片输入 */
export interface GenerateShareCardInput {
  card_type: string
  source_data: ShareCardSourceData
  style?: ShareCardStyle
}

/** 分页响应结构 */
export interface PaginatedShareCards {
  data: ShareCardRow[]
  total: number
  page: number
  page_size: number
}

/** 获取卡片列表查询参数 */
export interface GetShareCardsParams {
  page?: number
  page_size?: number
  card_type?: string
}

/** 记录分享行为输入 */
export interface RecordShareInput {
  channel: ShareChannel
}

export const shareCardService = {
  /** 生成分享卡片 */
  async generateShareCard(input: GenerateShareCardInput): Promise<ShareCardRow> {
    const body: Record<string, unknown> = {
      card_type: input.card_type,
      source_data: input.source_data,
    }
    if (input.style) body.style = input.style

    const data = await api.post<ShareCardRow>('/api/share-cards/generate', body)
    return data
  },

  /** 获取分享卡片列表（分页） */
  async getShareCards(params?: GetShareCardsParams): Promise<PaginatedShareCards> {
    const query: Record<string, string> = {}
    if (params?.page !== undefined) query.page = String(params.page)
    if (params?.page_size !== undefined) query.page_size = String(params.page_size)
    if (params?.card_type) query.card_type = params.card_type

    const data = await api.get<PaginatedShareCards>('/api/share-cards', query)
    return data
  },

  /** 获取分享卡片详情 */
  async getShareCardById(id: string): Promise<ShareCardRow> {
    const data = await api.get<ShareCardRow>(`/api/share-cards/${id}`)
    return data
  },

  /** 删除分享卡片 */
  async deleteShareCard(id: string): Promise<void> {
    await api.delete(`/api/share-cards/${id}`)
  },

  /** 记录分享行为 */
  async recordShare(id: string, input: RecordShareInput): Promise<ShareCardRow> {
    const body: Record<string, unknown> = {
      channel: input.channel,
    }

    const data = await api.post<ShareCardRow>(`/api/share-cards/${id}/share`, body)
    return data
  },
}
