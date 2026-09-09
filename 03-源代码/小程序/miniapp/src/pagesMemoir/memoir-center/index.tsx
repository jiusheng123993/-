import { useState, useEffect } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { usePetStore } from '../../stores/petStore'
import { getMaterialCheck, getMemoirPricing } from '../../services/memoirService'
import type { MaterialCheck } from '../../services/memoirService'
import { pickTierPrice, formatYuan, isTierAvailable } from '../../utils/memoirTier'

import './index.scss'

/**
 * 回忆录馆（2026-09-09 对齐高保真原型 creative-hub-prototype.html 屏3）：
 * 「创作板块」IA 中的回忆录聚合页——米白暖色主题（与全 App 主视觉一致，非深色风）。
 * 结构：紫渐变 hero → 素材盘点 banner（前置：告诉用户能做什么档、缺什么素材）
 *       → 三档定价卡同屏（轻纪念/标准/完整，点击直达对应流程）→ 更多（年度回顾/我的回忆录）
 * 档位卡路由规则：轻纪念 → memoir-daily（light 单段流水线）；
 *                标准/完整 → memoir-vlog?tier=standard|full（多段纪念管线，确认页可改档）
 */
const SUGGESTION_LABEL: Record<string, string> = {
  light: '轻纪念',
  standard: '标准回忆录',
  full: '完整回忆录',
}

const MemoirCenter = () => {
  const router = useRouter()
  const petId = router.params.petId || ''
  const currentPet = usePetStore((s) => s.currentPet)
  const petName = currentPet?.name || '毛孩子'

  const [material, setMaterial] = useState<MaterialCheck | null>(null)
  const [pricing, setPricing] = useState<Awaited<ReturnType<typeof getMemoirPricing>> | null>(null)

  // 挂载拉素材盘点（banner 前置：能做什么档/缺什么素材）与三档价格；失败静默降级静态文案
  useEffect(() => {
    if (!petId) return
    let cancelled = false
    getMaterialCheck(petId).then((m) => {
      if (!cancelled) setMaterial(m)
    }).catch(() => {})
    getMemoirPricing(petId).then((p) => {
      if (!cancelled) setPricing(p)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [petId])

  /** 三档价格：动态优先（B1 实时价），失败回退定稿静态价 */
  const priceOf = (tier: 'light' | 'standard' | 'full') => {
    if (pricing?.prices) {
      return {
        normal: `¥${formatYuan(pickTierPrice(pricing.prices, tier, false))}`,
        member: `会员 ¥${formatYuan(pickTierPrice(pricing.prices, tier, true))}`,
      }
    }
    const fallback: Record<string, { normal: string; member: string }> = {
      light: { normal: '¥25.9', member: '会员 ¥18.9' },
      standard: { normal: '¥59', member: '会员 ¥45' },
      full: { normal: '¥99', member: '会员 ¥79' },
    }
    return fallback[tier]
  }

  /** 档位卡点击：轻纪念→日常回忆录（light 单段）；标准→标准回忆录页；完整→完整回忆录页（各自独立流程） */
  const goTier = (tier: 'light' | 'standard' | 'full') => {
    if (!petId) {
      if (!currentPet) {
        Taro.showToast({ title: '请先添加宠物', icon: 'none' })
        return
      }
      // 中心页被直接打开（无 petId）时回退用当前宠物
      const base = tier === 'light' ? '/pagesMemoir/memoir-daily/index' : (tier === 'full' ? '/pagesMemoir/memoir-full/index' : '/pagesMemoir/memoir-vlog/index')
      Taro.navigateTo({ url: `${base}?petId=${currentPet.id}${tier !== 'light' ? `&tier=${tier}` : ''}` })
      return
    }
    const base = tier === 'light' ? '/pagesMemoir/memoir-daily/index' : (tier === 'full' ? '/pagesMemoir/memoir-full/index' : '/pagesMemoir/memoir-vlog/index')
    Taro.navigateTo({ url: `${base}?petId=${petId}${tier !== 'light' ? `&tier=${tier}` : ''}` })
  }

  /** 档位不可用提示：素材不足时轻提示仍允许进入（流程内可补素材/降档） */
  const tierDisabled = (tier: 'light' | 'standard' | 'full') => {
    if (!material) return false
    const photoCount = material.profile_photo_count + material.moment_photo_count
    return !isTierAvailable(tier, photoCount)
  }

  const lightP = priceOf('light')
  const standardP = priceOf('standard')
  const fullP = priceOf('full')

  return (
    <View className='mhall'>
      {/* ===== 紫渐变 hero（原型屏3） ===== */}
      <View className='mhall-hero'>
        <Text className='mhall-hero-face'>🎞️</Text>
        <Text className='mhall-hero-title'>回忆录馆</Text>
        <Text className='mhall-hero-sub'>把和{petName}的日子，讲成一部小电影</Text>
      </View>

      {/* ===== 素材盘点 banner（前置：能做什么档/缺什么素材） ===== */}
      {material && (
        <View className='mhall-banner'>
          <Text className='mhall-banner-text'>
            📸 素材盘点：{petName}现有照片 {material.profile_photo_count + material.moment_photo_count} 张
            {' · '}时光线回忆 {material.moment_count} 条
            {material.suggested_tier ? ` → 建议先做「${SUGGESTION_LABEL[material.suggested_tier] || material.suggested_tier}」` : ''}
          </Text>
        </View>
      )}

      {/* ===== 选择档位（三档同屏，原型 wide 卡） ===== */}
      <View className='mhall-sectitle'>选择档位</View>

      <View
        className={`mhall-card${tierDisabled('light') ? ' mhall-card--dim' : ''}`}
        onClick={() => goTier('light')}
      >
        <Text className='mhall-card-em'>🍃</Text>
        <View className='mhall-card-txt'>
          <View className='mhall-card-titlerow'>
            <Text className='mhall-card-title'>轻纪念</Text>
            <Text className='mhall-card-sub'>1-3 张照片</Text>
          </View>
          <Text className='mhall-card-desc'>一段真实影像+空镜+暖白收尾 · 约 20 秒{'\n'}本尊出镜率 100%</Text>
          <View className='mhall-card-pricerow'>
            <Text className='mhall-card-price'>{lightP.normal}</Text>
            <Text className='mhall-card-mprice'>{lightP.member}</Text>
          </View>
        </View>
      </View>

      <View
        className={`mhall-card${tierDisabled('standard') ? ' mhall-card--dim' : ''}`}
        onClick={() => goTier('standard')}
      >
        <Text className='mhall-card-em'>📖</Text>
        <View className='mhall-card-txt'>
          <View className='mhall-card-titlerow'>
            <Text className='mhall-card-title'>标准回忆录</Text>
            <Text className='mhall-card-sub'>5-7 张照片</Text>
          </View>
          <Text className='mhall-card-desc'>六个章节 · 空镜衔接 · 约 45 秒</Text>
          <View className='mhall-card-pricerow'>
            <Text className='mhall-card-price'>{standardP.normal}</Text>
            <Text className='mhall-card-mprice'>{standardP.member}</Text>
          </View>
        </View>
      </View>

      <View
        className={`mhall-card${tierDisabled('full') ? ' mhall-card--dim' : ''}`}
        onClick={() => goTier('full')}
      >
        <Text className='mhall-card-em'>🎬</Text>
        <View className='mhall-card-txt'>
          <View className='mhall-card-titlerow'>
            <Text className='mhall-card-title'>完整回忆录</Text>
            <Text className='mhall-card-sub'>8-15 张 + 勾选记忆</Text>
          </View>
          <Text className='mhall-card-desc'>十幕剧结构 · 旁白讲真实故事 · 约 75 秒{'\n'}TTS 语音 + 字幕 + 转场 + BGM</Text>
          <View className='mhall-card-pricerow'>
            <Text className='mhall-card-price'>{fullP.normal}</Text>
            <Text className='mhall-card-mprice'>{fullP.member}</Text>
          </View>
        </View>
      </View>

      {/* ===== 更多 ===== */}
      <View className='mhall-sectitle'>更多</View>
      <View className='mhall-grid2'>
        <View
          className='mhall-mini'
          onClick={() => Taro.showToast({ title: '年度回顾即将上线', icon: 'none' })}
        >
          <Text className='mhall-mini-em'>🎊</Text>
          <Text className='mhall-mini-title'>年度回顾</Text>
          <Text className='mhall-mini-desc'>这一年 TA 的档案大片</Text>
        </View>
        <View
          className='mhall-mini'
          onClick={() => Taro.showToast({ title: '生成记录即将上线', icon: 'none' })}
        >
          <Text className='mhall-mini-em'>🎬</Text>
          <Text className='mhall-mini-title'>我的回忆录</Text>
          <Text className='mhall-mini-desc'>生成记录 · 再次观看</Text>
        </View>
      </View>
    </View>
  )
}

export default MemoirCenter
