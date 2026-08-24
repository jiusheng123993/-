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

/** 血亲树响应（对齐后端 getLineage 契约：2026-08-24 修复字段名不匹配） */
export interface LineageTreeResponse {
  /** 选中宠物（pet 行：id/name/avatar_url/species） */
  pet: TreeNode | null
  /** 直接父母（如"烧鸭是可乐的妈妈"） */
  parents: TreeNode[]
  /** 直接子女 */
  children: TreeNode[]
  /** 兄弟姐妹（血缘 + 手动添加的兄弟关系） */
  siblings: TreeNode[]
  /** 配偶 */
  mates: TreeNode[]
  /** 多代祖先（按代分组，index 0 为最近一代=父母） */
  ancestors_levels: TreeNode[][]
  /** 多代后代（按代分组，index 0 为最近一代=子女） */
  descendants_levels: TreeNode[][]
}

/**
 * 将后端血亲行（LineageWithPetRow：pet_id/pet_name/pet_avatar_url/pet_species）或
 * 宠物行（pet：id/name/avatar_url/species）统一映射为前端 TreeNode
 */
function toTreeNode(row: Record<string, unknown>): TreeNode {
  return {
    pet_id: String(row.pet_id || row.id || ''),
    name: String(row.pet_name || row.name || ''),
    avatar_url: String(row.pet_avatar_url || row.avatar_url || ''),
    species: String(row.pet_species || row.species || ''),
    role: String(row.role || ''),
  }
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

  /** 获取某宠物的血亲树（后端返回 parents/children/siblings/mates/ancestors_levels/descendants_levels） */
  async getLineageTree(familyId: string, petId: string): Promise<LineageTreeResponse> {
    const empty = (): LineageTreeResponse => ({
      pet: null,
      parents: [],
      children: [],
      siblings: [],
      mates: [],
      ancestors_levels: [],
      descendants_levels: [],
    })
    const data = await api.get<Record<string, unknown>>(`/api/families/${familyId}/lineage/${petId}`)
    if (!data) return empty()
    const mapList = (rows: unknown): TreeNode[] => {
      if (!Array.isArray(rows)) return []
      return (rows as Array<Record<string, unknown>>).map(toTreeNode)
    }
    const mapLevels = (levels: unknown): TreeNode[][] => {
      if (!Array.isArray(levels)) return []
      return (levels as unknown[]).map((level) => mapList(level))
    }
    return {
      pet: data.pet ? toTreeNode(data.pet as Record<string, unknown>) : null,
      parents: mapList(data.parents),
      children: mapList(data.children),
      siblings: mapList(data.siblings),
      mates: mapList(data.mates),
      ancestors_levels: mapLevels(data.ancestors_levels),
      descendants_levels: mapLevels(data.descendants_levels),
    }
  },
}
