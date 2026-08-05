/**
 * 排行榜服务
 *
 * 宠物家庭排行榜数据查询、刷新与角色分配管理
 */
import { api } from './api'

/** 排行榜周期 */
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time'

/** 排行榜单项指标 */
export interface RankingMetrics {
  checkin_count: number
  feed_count: number
  moment_count: number
  health_score: number
}

/** 排行榜单项数据 */
export interface RankingItem {
  rank: number
  pet_id: string
  pet_name: string
  pet_avatar_url: string
  score: number
  metrics: RankingMetrics
  badges: string[]
}

/** 排行榜响应 */
export interface LeaderboardResponse {
  period: LeaderboardPeriod
  rankings: RankingItem[]
  updated_at: string
}

/** 角色类型 */
export type RoleType = 'mvp' | 'caretaker' | 'socialite' | 'health_guardian'

/** 角色分配响应 */
export interface RoleResponse {
  id: string
  pet_id: string
  pet_name: string
  pet_avatar_url: string
  role_type: RoleType
  role_label: string
  assignment: string
  created_at: string
}

/** 可用角色类型定义 */
export interface AvailableRoleType {
  type: RoleType
  label: string
  description: string
  icon: string
}

/** 家庭角色分配响应 */
export interface FamilyRolesResponse {
  roles: RoleResponse[]
  available_types: AvailableRoleType[]
}

/** 排行榜服务 */
export const leaderboardService = {
  /** 获取家庭排行榜 */
  async getLeaderboard(familyId: string, period: LeaderboardPeriod): Promise<LeaderboardResponse> {
    const data = await api.get<LeaderboardResponse>(`/api/families/${familyId}/leaderboard`, { period })
    return data
  },

  /** 手动刷新排行榜 */
  async refreshLeaderboard(familyId: string, period: LeaderboardPeriod): Promise<LeaderboardResponse> {
    const data = await api.post<LeaderboardResponse>(`/api/families/${familyId}/leaderboard/refresh?period=${period}`)
    return data
  },

  /** 获取家庭角色分配 */
  async getRoles(familyId: string): Promise<FamilyRolesResponse> {
    const data = await api.get<FamilyRolesResponse>(`/api/families/${familyId}/roles`)
    return data
  },

  /** 分配角色给宠物 */
  async assignRole(familyId: string, petId: string, roleType: RoleType): Promise<RoleResponse> {
    const data = await api.post<RoleResponse>(`/api/families/${familyId}/roles`, {
      pet_id: petId,
      role_type: roleType,
    })
    return data
  },

  /** 更新角色分配 */
  async updateRole(familyId: string, roleId: string, roleType: RoleType): Promise<RoleResponse> {
    const data = await api.put<RoleResponse>(`/api/families/${familyId}/roles/${roleId}`, {
      role_type: roleType,
    })
    return data
  },

  /** 移除角色分配 */
  async removeRole(familyId: string, roleId: string): Promise<void> {
    await api.delete<void>(`/api/families/${familyId}/roles/${roleId}`)
  },
}
