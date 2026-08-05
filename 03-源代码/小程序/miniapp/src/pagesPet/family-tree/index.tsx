/**
 * 家族图谱页面 - 三代树形图 + 家庭成员列表 + 关系管理
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useFamilyStore } from '../../stores/familyStore'
import { familyTreeService } from '../../services/familyTreeService'
import type { TreeNode, TreeEdge } from '../../services/familyTreeService'
import './index.scss'

const REL_TYPES = [
  { value: 'parent_child', label: '亲子' },
  { value: 'sibling', label: '兄弟姐妹' },
  { value: 'mate', label: '伴侣' },
  { value: 'friend', label: '好友' },
  { value: 'rival', label: '对手' },
]

const EMOJI: Record<string, string> = { cat: '🐱', dog: '🐕' }
const emoji = (s: string) => EMOJI[s] || '🐾'

/** 三代树形图行配置 */
const TREE_ROWS = [
  { key: 'ancestors', title: '第一代 · 祖辈' },
  { key: 'siblings', title: '第二代 · 同代' },
  { key: 'descendants', title: '第三代 · 后代' },
] as const

interface LineageData {
  ancestors: TreeNode[]
  descendants: TreeNode[]
  siblings: TreeNode[]
}

export default function FamilyTree() {
  const { currentFamily } = useFamilyStore()
  const [nodes, setNodes] = useState<TreeNode[]>([])
  const [edges, setEdges] = useState<TreeEdge[]>([])
  const [selPid, setSelPid] = useState('')
  const [lineage, setLineage] = useState<LineageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRel, setShowRel] = useState(false)
  const [rf, setRf] = useState({ pet_id_a: '', pet_id_b: '', relation_type: 'friend', label_a: '', label_b: '' })
  const fid = currentFamily?.id || ''

  const loadLineage = useCallback(async (pid: string) => {
    if (!fid || !pid) return
    setSelPid(pid)
    try {
      const d = await familyTreeService.getLineageTree(fid, pid)
      setLineage(d)
    } catch {
      setLineage(null)
    }
  }, [fid])

  const loadTree = useCallback(async () => {
    if (!fid) return
    setLoading(true)
    try {
      const d = await familyTreeService.getFamilyTree(fid)
      setNodes(d.nodes)
      setEdges(d.edges)
      if (d.nodes.length > 0) {
        await loadLineage(d.nodes[0].pet_id)
      } else {
        setLineage(null)
        setSelPid('')
      }
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [fid, loadLineage])

  useEffect(() => {
    if (currentFamily) {
      loadTree()
    }
  }, [currentFamily, loadTree])

  const doCreateRel = useCallback(async () => {
    if (!fid || !rf.pet_id_a || !rf.pet_id_b) return
    try {
      await familyTreeService.createRelationship(fid, rf)
      Taro.showToast({ title: '关系已创建', icon: 'success' })
      setShowRel(false)
      setRf({ pet_id_a: '', pet_id_b: '', relation_type: 'friend', label_a: '', label_b: '' })
      loadTree()
    } catch {
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }, [fid, rf, loadTree])

  const doSaveSnapshot = useCallback(async () => {
    if (!fid || nodes.length === 0) return
    try {
      await familyTreeService.saveSnapshot(fid, { layout_type: 'lineage', graph_data: { nodes } as Record<string, unknown> })
      Taro.showToast({ title: '快照已保存', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    }
  }, [fid, nodes])

  const pickPet = (field: 'pet_id_a' | 'pet_id_b') => {
    const names = nodes.map(n => n.name)
    if (names.length === 0) { Taro.showToast({ title: '暂无宠物', icon: 'none' }); return }
    Taro.showActionSheet({ itemList: names, success: (res) => setRf(f => ({ ...f, [field]: nodes[res.tapIndex].pet_id })) })
  }

  const selectedNode = useMemo(() => nodes.find(n => n.pet_id === selPid) || null, [nodes, selPid])

  /** 每个成员的关系描述（如：爸爸、妈妈） */
  const memberRelation = useMemo(() => {
    const map: Record<string, string> = {}
    for (const edge of edges) {
      if (edge.label_a) map[edge.pet_id_a] = edge.label_a
      if (edge.label_b) map[edge.pet_id_b] = edge.label_b
    }
    return map
  }, [edges])

  const renderTreeNode = (n: TreeNode, role?: string) => (
    <View key={n.pet_id} className='ft-node'>
      <View className='ft-avatar-wrap'>
        <View className='ft-avatar'>
          {n.avatar_url ? (
            <Image src={n.avatar_url} className='ft-avatar-img' mode='aspectFill' />
          ) : (
            <Text className='ft-avatar-emoji'>{emoji(n.species)}</Text>
          )}
        </View>
      </View>
      <Text className='ft-node-name'>{n.name}</Text>
      {role ? (
        <Text className='ft-node-role'>{role}</Text>
      ) : n.role ? (
        <Text className='ft-node-role'>{n.role}</Text>
      ) : null}
    </View>
  )

  if (!currentFamily) {
    return (
      <View className='family-tree'>
        <View className='family-tree__empty'>
          <Text className='family-tree__empty-icon'>🏡</Text>
          <Text className='family-tree__empty-text'>请先创建或加入一个家庭</Text>
          <View
            className='family-tree__empty-btn'
            onClick={() => Taro.navigateTo({ url: '/pagesPet/family/dashboard/index' })}
          >
            <Text>前往创建家庭</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className='family-tree'>
      {/* 全屏动态背景层 */}
      <View className='xhh-bg-layer'>
        <View className='xhh-blob xhh-blob-a' />
        <View className='xhh-blob xhh-blob-b' />
        <View className='xhh-blob xhh-blob-c' />
        <View className='xhh-blob xhh-blob-d' />
        <View className='xhh-bg-glow' />
      </View>

      <View className='family-tree__content'>
        {/* ===== 图谱头部卡 ===== */}
        <View className='ft-card'>
          <View className='ft-card__head'>
            <View className='ft-card__avatar'>
              <Text className='ft-card__avatar-icon'>🐾</Text>
            </View>
            <View className='ft-card__info'>
              <Text className='ft-card__name'>{currentFamily.name}</Text>
              <View className='ft-card__meta'>
                <Text className='ft-card__meta-icon'>🐾</Text>
                <Text className='ft-card__meta-text'>{nodes.length} 位成员</Text>
              </View>
            </View>
            <View
              className='ft-card__edit'
              onClick={() => Taro.navigateTo({ url: '/pagesPet/family/dashboard/index' })}
            >
              <Text className='ft-card__edit-icon'>✏️</Text>
              <Text className='ft-card__edit-text'>编辑</Text>
            </View>
          </View>
        </View>

        {/* ===== 家族图谱树形图卡 ===== */}
        <View className='ft-card'>
          <Text className='ft-card__section-title'>🌿 家族图谱</Text>

          {loading ? (
            <View className='family-tree__loading'>
              <Text className='family-tree__loading-text'>加载中...</Text>
            </View>
          ) : nodes.length === 0 ? (
            <View className='family-tree__empty'>
              <Text className='family-tree__empty-icon'>🧬</Text>
              <Text className='family-tree__empty-text'>暂无成员数据，添加宠物后可生成图谱</Text>
            </View>
          ) : (
            <>
              <View className='ft-tree'>
                {TREE_ROWS.map((row, rowIndex) => {
                  const rowNodes = lineage?.[row.key] || []
                  const isEmpty = rowNodes.length === 0
                  const isCurrentRow = row.key === 'siblings'
                  return (
                    <View key={row.key}>
                      {rowIndex > 0 && (
                        <View className='ft-connector'>
                          <View className={`ft-connector-v${rowIndex >= 2 ? ' ft-connector-v--dash' : ''}`} />
                        </View>
                      )}
                      <Text className='ft-tree-row-title'>{row.title}</Text>
                      <View className={isCurrentRow ? 'ft-tree-parents' : 'ft-tree-row'}>
                        {isCurrentRow && selectedNode ? (
                          renderTreeNode(selectedNode)
                        ) : (
                          <>
                            {isEmpty ? (
                              <Text className='ft-tree-empty-row'>暂无数据</Text>
                            ) : (
                              rowNodes.map(n => renderTreeNode(n))
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  )
                })}
              </View>

              {/* 图例说明 */}
              <View className='ft-legend'>
                <View className='ft-legend__item'>
                  <View className='ft-legend__line ft-legend__line--solid' />
                  <Text className='ft-legend__text'>实线 · 血缘</Text>
                </View>
                <View className='ft-legend__item'>
                  <View className='ft-legend__line ft-legend__line--dash' />
                  <Text className='ft-legend__text'>虚线 · 非血缘</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ===== 家庭成员列表卡 ===== */}
        <View className='ft-card'>
          <Text className='ft-card__section-title'>❤️ 家庭成员</Text>
          {nodes.length === 0 ? (
            <View className='family-tree__empty'>
              <Text className='family-tree__empty-text'>暂无成员</Text>
            </View>
          ) : (
            <View className='ft-member-list'>
              {nodes.map(n => (
                <View
                  key={n.pet_id}
                  className={`ft-member-row${n.pet_id === selPid ? ' ft-member-row--active' : ''}`}
                  onClick={() => loadLineage(n.pet_id)}
                >
                  <View className='ft-member-avatar'>
                    {n.avatar_url ? (
                      <Image src={n.avatar_url} className='ft-member-avatar-img' mode='aspectFill' />
                    ) : (
                      <Text className='ft-member-avatar-emoji'>{emoji(n.species)}</Text>
                    )}
                  </View>
                  <View className='ft-member-info'>
                    <Text className='ft-member-name'>{n.name}</Text>
                    <Text className='ft-member-rel'>{memberRelation[n.pet_id] || '家庭成员'}</Text>
                  </View>
                  {n.role && (
                    <View className='ft-member-role'>
                      <Text className='ft-member-role-text'>{n.role}</Text>
                    </View>
                  )}
                  <Text className='ft-member-arrow'>›</Text>
                </View>
              ))}
            </View>
          )}

          {/* 关系管理入口 */}
          <View className='ft-actions'>
            <View className='ft-action ft-action--primary' onClick={() => setShowRel(true)}>
              <Text className='ft-action__text'>➕ 添加关系</Text>
            </View>
            <View className='ft-action ft-action--outline' onClick={doSaveSnapshot}>
              <Text className='ft-action__text'>💾 保存快照</Text>
            </View>
          </View>
        </View>

        <View className='family-tree__safe' />
      </View>

      {/* 添加关系面板 */}
      {showRel && (
        <>
          <View className='overlay' onClick={() => setShowRel(false)} />
          <View className='relation-panel'>
            <View className='relation-panel__header'>
              <Text className='relation-panel__title'>添加关系</Text>
              <Text className='relation-panel__close' onClick={() => setShowRel(false)}>✕</Text>
            </View>
            <View className='relation-panel__body'>
              <View className='relation-form__field'>
                <Text className='relation-form__label'>宠物 A</Text>
                <View className='relation-form__picker' onClick={() => pickPet('pet_id_a')}>
                  <Text className={rf.pet_id_a ? '' : 'relation-form__picker-placeholder'}>
                    {rf.pet_id_a ? nodes.find(n => n.pet_id === rf.pet_id_a)?.name || '已选择' : '请选择宠物 A'}
                  </Text>
                  <Text>›</Text>
                </View>
              </View>
              <View className='relation-form__field'>
                <Text className='relation-form__label'>宠物 B</Text>
                <View className='relation-form__picker' onClick={() => pickPet('pet_id_b')}>
                  <Text className={rf.pet_id_b ? '' : 'relation-form__picker-placeholder'}>
                    {rf.pet_id_b ? nodes.find(n => n.pet_id === rf.pet_id_b)?.name || '已选择' : '请选择宠物 B'}
                  </Text>
                  <Text>›</Text>
                </View>
              </View>
              <View className='relation-form__field'>
                <Text className='relation-form__label'>关系类型</Text>
                <View className='relation-form__type-list'>
                  {REL_TYPES.map(t => (
                    <View
                      key={t.value}
                      className={`relation-form__type-item ${rf.relation_type === t.value ? 'relation-form__type-item--active' : ''}`}
                      onClick={() => setRf(f => ({ ...f, relation_type: t.value }))}
                    >
                      <Text>{t.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View className='relation-form__submit' onClick={doCreateRel}>
                <Text>确认添加</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
