/**
 * 家族图谱服务
 *
 * 家族图谱数据查询、关系管理、快照保存与血亲树获取
 */
import { api } from './api'

/** 图谱节点 */
export interface TreeNode {
  pet_id: string
  name: string
  avatar_url: string
  species: string
  role: string
}

/** 图谱边 */
export interface TreeEdge {
  id: string
  pet_id_a: string
  pet_id_b: string
  relation_type: string
  direction: string
  label_a: string
  label_b: string
  pet_a_name: string
  pet_b_name: string
}

/** 图谱响应 */
export interface TreeResponse {
  nodes: TreeNode[]
  edges: TreeEdge[]
}

/** 关系记录 */
export interface RelationshipRow {
  id: string
  family_id: string
  pet_id_a: string
  pet_id_b: string
  relation_type: string
  direction: string
  label_a: string
  label_b: string
}

/** 创建关系输入 */
export interface CreateRelationshipInput {
  pet_id_a: string
  pet_id_b: string
  relation_type: string
  direction?: string
  label_a?: string
  label_b?: string
}

/** 更新关系输入 */
export interface UpdateRelationshipInput {
  label_a?: string
  label_b?: string
}

/** 创建血缘输入 */
export interface CreateLineageInput {
  parent_id: string
  child_id: string
  litter_date?: string
}

/** 快照记录 */
export interface SnapshotRow {
  id: string
  family_id: string
  layout_type: string
  graph_data: Record<string, unknown>
  thumbnail_url: string
  created_at: string
}

/** 创建快照输入 */
export interface CreateSnapshotInput {
  layout_type: string
  graph_data: Record<string, unknown>
  thumbnail_url?: string
}

/** 快照列表响应 */
export interface SnapshotListResponse {
  items: SnapshotRow[]
  total: number
  page: number
  page_size: number
}

/** 血亲树响应 */
export interface LineageTreeResponse {
  pet_id: string
  ancestors: TreeNode[]
  descendants: TreeNode[]
  siblings: TreeNode[]
}

export const familyTreeService = {
  /** 获取家族图谱（nodes + edges） */
  async getFamilyTree(familyId: string): Promise<TreeResponse> {
    const data = await api.get<TreeResponse>(`/api/families/${familyId}/tree`)
    return data || { nodes: [], edges: [] }
  },

  /** 保存图谱快照 */
  async saveSnapshot(familyId: string, input: CreateSnapshotInput): Promise<SnapshotRow> {
    const data = await api.post<SnapshotRow>(`/api/families/${familyId}/tree/snapshot`, input)
    return data
  },

  /** 获取历史快照列表 */
  async getSnapshots(
    familyId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<SnapshotListResponse> {
    const data = await api.get<SnapshotListResponse>(`/api/families/${familyId}/tree/snapshots`, {
      page: String(page),
      page_size: String(pageSize),
    })
    return {
      items: data?.items || [],
      total: data?.total || 0,
      page: data?.page || page,
      page_size: data?.page_size || pageSize,
    }
  },

  /** 创建宠物关系 */
  async createRelationship(familyId: string, input: CreateRelationshipInput): Promise<RelationshipRow> {
    const data = await api.post<RelationshipRow>(`/api/families/${familyId}/relationships`, input)
    return data
  },

  /** 更新关系标签 */
  async updateRelationship(
    familyId: string,
    relId: string,
    input: UpdateRelationshipInput,
  ): Promise<RelationshipRow> {
    const data = await api.put<RelationshipRow>(`/api/families/${familyId}/relationships/${relId}`, input)
    return data
  },

  /** 删除关系 */
  async deleteRelationship(familyId: string, relId: string): Promise<void> {
    await api.delete(`/api/families/${familyId}/relationships/${relId}`)
  },

  /** 添加血缘关系 */
  async addLineage(familyId: string, input: CreateLineageInput): Promise<void> {
    await api.post(`/api/families/${familyId}/lineage`, input)
  },

  /** 获取某宠物的血亲树 */
  async getLineageTree(familyId: string, petId: string): Promise<LineageTreeResponse> {
    const data = await api.get<LineageTreeResponse>(`/api/families/${familyId}/lineage/${petId}`)
    return (
      data || {
        pet_id: petId,
        ancestors: [],
        descendants: [],
        siblings: [],
      }
    )
  },
}
