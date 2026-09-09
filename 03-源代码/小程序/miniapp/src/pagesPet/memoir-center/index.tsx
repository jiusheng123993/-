import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'
import { usePetStore } from '../../stores/petStore'

import './index.scss'

/**
 * 回忆录中心页（2026-09-09 B3 提前）：
 * 用户拍板「回忆录要有单独的入口」——本页即回忆录板块首页，
 * 首页大卡直达此处，向内分发两条产品线：
 * - 日常回忆录（memoir-daily，light 轻纪念档，单段流水线）
 * - 纪念Vlog（memoir-vlog，三档可选，标准/完整走多段纪念管线）
 * 进入各子页前先解析当前宠物，无宠物引导添加
 */
const MemoirCenter = () => {
  const currentPet = usePetStore((s) => s.currentPet)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({ title: '星河回忆录' })
  }, [])

  /** 进入前校验宠物：回忆录必须绑定宠物（素材/时间线/档案都按宠物维度取） */
  const guardAndGo = (url: string) => {
    if (!currentPet) {
      Taro.showToast({ title: '请先添加宠物', icon: 'none' })
      setTimeout(() => {
        Taro.navigateTo({ url: '/pagesPet/add/index' })
      }, 600)
      return
    }
    Taro.navigateTo({ url: `${url}?petId=${currentPet.id}` })
  }

  /** 头像优先级与全站一致：真实照片 > AI 形象 > 物种 emoji */
  const avatarUrl = currentPet?.avatarPhotoUrl || currentPet?.avatarCartoonUrl || ''

  return (
    <View className='mcenter'>
      {/* ===== 品牌头 ===== */}
      <View className='mcenter-hero'>
        <View className='mcenter-hero-badge'>
          <Text className='mcenter-hero-badge-text'>MEMOIR</Text>
        </View>
        <Text className='mcenter-hero-title'>星河回忆录</Text>
        <Text className='mcenter-hero-sub'>把和毛孩子的时光，做成会动的回忆</Text>
        {currentPet && (
          <View className='mcenter-hero-pet'>
            {avatarUrl && !avatarFailed ? (
              <Image
                className='mcenter-hero-pet-avatar'
                src={avatarUrl}
                mode='aspectFill'
                lazyLoad
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <Text className='mcenter-hero-pet-emoji'>{currentPet.species === 'cat' ? '🐱' : '🐶'}</Text>
            )}
            <Text className='mcenter-hero-pet-name'>{currentPet.name}</Text>
          </View>
        )}
      </View>

      {/* ===== 产品线入口 ===== */}
      <View className='mcenter-line' onClick={() => guardAndGo('/pagesPet/memoir-daily/index')}>
        <View className='mcenter-line-glow mcenter-line-glow--warm' />
        <View className='mcenter-line-icon mcenter-line-icon--warm'>
          <Text>🎬</Text>
        </View>
        <View className='mcenter-line-body'>
          <View className='mcenter-line-titlerow'>
            <Text className='mcenter-line-title'>日常回忆录</Text>
            <View className='mcenter-line-tag mcenter-line-tag--warm'><Text>轻纪念档</Text></View>
          </View>
          <Text className='mcenter-line-desc'>1-3 张照片 · 5-30 秒温暖短片 · AI 静图动效</Text>
          <View className='mcenter-line-meta'>
            <Text className='mcenter-line-price'>¥18.9 起</Text>
            <Text className='mcenter-line-price-hint'>会员同价 · 单集即出</Text>
          </View>
        </View>
        <Text className='mcenter-line-arrow'>›</Text>
      </View>

      <View className='mcenter-line' onClick={() => guardAndGo('/pagesPet/memoir-vlog/index')}>
        <View className='mcenter-line-glow mcenter-line-glow--violet' />
        <View className='mcenter-line-icon mcenter-line-icon--violet'>
          <Text>💎</Text>
        </View>
        <View className='mcenter-line-body'>
          <View className='mcenter-line-titlerow'>
            <Text className='mcenter-line-title'>纪念Vlog</Text>
            <View className='mcenter-line-tag mcenter-line-tag--violet'><Text>三档可选</Text></View>
          </View>
          <Text className='mcenter-line-desc'>8-15 张照片 · 最长 90 秒 · AI 叙事 + 分镜确认</Text>
          <View className='mcenter-line-meta'>
            <Text className='mcenter-line-price'>¥45 起</Text>
            <Text className='mcenter-line-price-hint'>会员更低至 ¥45 · 深刻催泪</Text>
          </View>
        </View>
        <Text className='mcenter-line-arrow'>›</Text>
      </View>

      {/* ===== 流程说明 ===== */}
      <View className='mcenter-steps'>
        <View className='mcenter-step'>
          <Text className='mcenter-step-num'>1</Text>
          <Text className='mcenter-step-text'>选照片 · 写一句话心情</Text>
        </View>
        <View className='mcenter-step-line' />
        <View className='mcenter-step'>
          <Text className='mcenter-step-num'>2</Text>
          <Text className='mcenter-step-text'>AI 生成 · 确认分镜</Text>
        </View>
        <View className='mcenter-step-line' />
        <View className='mcenter-step'>
          <Text className='mcenter-step-num'>3</Text>
          <Text className='mcenter-step-text'>出片收藏 · 分享家人</Text>
        </View>
      </View>

      <View className='mcenter-foot'>
        <Text className='mcenter-foot-text'>生成失败自动原路退款 · 视频仅家人可见</Text>
      </View>
    </View>
  )
}

export default MemoirCenter
