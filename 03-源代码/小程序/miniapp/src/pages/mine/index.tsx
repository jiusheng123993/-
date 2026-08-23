/**
 * 我的页面
 * 对齐高保真原型 mine.html：渐变横幅用户卡 + 数据概览 3 列 + 分组菜单（数据服务/管理/设置-主题皮肤）+ 退出登录
 * 保留原有业务逻辑：登录校验、打卡/回忆统计、宠物切换、会员状态、退出登录
 */
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { usePetStore } from '../../stores/petStore'
import { useMembershipStore } from '../../stores/membershipStore'
import { useThemeStore, type ThemeKey } from '../../stores/themeStore'
import { getCheckinStats } from '../../services/checkinService'
import { timelineService } from '../../services/timelineService'
import PageLoading from '../../components/PageLoading'
import { useThemeClass } from '../../hooks/useThemeClass'
import './index.scss'

/** 主题配置（对齐原型四季色） */
const THEME_OPTIONS: { key: ThemeKey; label: string; colors: [string, string] }[] = [
  { key: 'spring', label: '春', colors: ['#8AD390', '#54B460'] },
  { key: 'summer', label: '夏', colors: ['#7CC6F0', '#2FA8E8'] },
  { key: 'autumn', label: '秋', colors: ['#FFA082', '#FF6B3D'] },
  { key: 'winter', label: '冬', colors: ['#A5B1F7', '#6C7CF0'] },
]

/** 计算养宠时长（年/月） */
function calcPetDuration(createdAt?: string): string {
  if (!createdAt) return ''
  const start = new Date(createdAt)
  if (isNaN(start.getTime())) return ''
  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (months < 1) return '刚刚开始'
  if (months < 12) return `养宠 ${months} 个月`
  return `养宠 ${Math.floor(months / 12)} 年`
}

/** 菜单分组（对齐原型：数据服务 / 管理 / 设置） */
const MENU_GROUPS: { title: string; items: { icon: string; label: string; url: string }[] }[] = [
  {
    title: '数据服务',
    items: [
      { icon: '📄', label: '健康报告', url: '/pagesPet/trends/index' },
      { icon: '💉', label: '疫苗日历', url: '/pagesPet/vaccine/index' },
      { icon: '👑', label: '会员中心', url: '/pagesUser/member/index' },
      { icon: '🏆', label: '成就墙', url: '/pagesPet/achievement/index' },
    ],
  },
  {
    title: '管理',
    items: [
      { icon: '📈', label: '效果追踪', url: '/pagesUser/effect-tracking/index' },
      { icon: '🎁', label: '邀请好友', url: '/pagesUser/invite/index' },
      { icon: '💬', label: '意见反馈', url: '/pagesUser/feedback/index' },
    ],
  },
  {
    title: '设置',
    items: [
      { icon: '⚙️', label: '设置', url: '/pagesUser/settings/index' },
    ],
  },
]

export default function Mine() {
  const user = useAuthStore(state => state.user)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)
  const isInitialized = useAuthStore(state => state.isInitialized)
  const logout = useAuthStore(state => state.logout)
  const { pets, currentPet, fetchPets, switchPet } = usePetStore()
  const membership = useMembershipStore(state => state.membership)
  const [pageReady, setPageReady] = useState(false)
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [totalMemories, setTotalMemories] = useState(0)
  const [themePanelOpen, setThemePanelOpen] = useState(false)
  // 头像加载失败标记：Image 触发 onError 时置 true 退回昵称占位，避免显示裂图
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const themeClass = useThemeClass()

  // 头像地址变化时重置加载失败标记：mine 是 tab 页常驻，同一会话内在 profile 换头像或
  // 图片瞬断恢复后，如果不重置会一直卡在昵称占位、Image 也不再重试。
  useEffect(() => {
    setAvatarLoadFailed(false)
  }, [user?.avatar])

  useEffect(() => {
    if (!isInitialized) return
    if (!isAuthenticated || !user) {
      const pages = Taro.getCurrentPages()
      const currentPage = pages[pages.length - 1]
      if (currentPage && currentPage.route !== 'pagesUser/login/index') {
        Taro.reLaunch({ url: '/pagesUser/login/index' })
      }
      return
    }
    const loadData = async () => {
      try {
        await fetchPets(user.id)
        const fetchedPets = usePetStore.getState().pets
        let totalC = 0
        if (fetchedPets.length > 0 && user?.id) {
          for (const pet of fetchedPets) {
            try {
              const stats = await getCheckinStats(pet.id, user.id)
              totalC += stats.totalCheckins
            } catch {
              // 单个宠物统计失败不影响整体
            }
          }
        }
        setTotalCheckins(totalC)
        try {
          const moments = await timelineService.getMoments()
          setTotalMemories(moments.length)
        } catch {
          setTotalMemories(0)
        }
      } catch (err) {
        // 静默处理错误
      }
      setPageReady(true)
    }
    loadData()
  }, [isInitialized, isAuthenticated, user])

  const navigateTo = (url: string) => {
    if (!url) {
      Taro.showToast({ title: '功能开发中', icon: 'none' })
      return
    }
    Taro.navigateTo({ url })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout()
          Taro.reLaunch({ url: '/pagesUser/login/index' })
        }
      },
    })
  }

  const handleThemeSelect = (theme: ThemeKey) => {
    useThemeStore.getState().setTheme(theme)
  }

  if (!pageReady) {
    return <PageLoading />
  }

  const isVip = membership?.level !== 'free'
  const currentTheme = useThemeStore.getState().current
  const petDuration = calcPetDuration(pets[0]?.createdAt)

  return (
    <ScrollView className={`mine-page ${themeClass}`} scrollY>
      {/* 全屏动态背景光斑层 */}
      <View className='xhh-bg-layer'>
        <View className='xhh-blob xhh-blob-a' />
        <View className='xhh-blob xhh-blob-b' />
        <View className='xhh-blob xhh-blob-c' />
        <View className='xhh-blob xhh-blob-d' />
      </View>

      {/* ===== 用户信息卡：渐变横幅 + 头像 + 昵称 + 会员徽章（原型对齐） ===== */}
      <View className='mine-user-card'>
        <View className='mine-user-banner' />
        <View className='mine-user-main'>
          <View className='mine-avatar' onClick={() => navigateTo('/pagesUser/profile/index')}>
            {/* 有头像且未加载失败就显示图片；头像为空或加载失败（onError）才退回昵称首字占位 */}
            {/* 点击头像进入资料页：支持选择微信头像或相册上传更换 */}
            {user?.avatar && !avatarLoadFailed ? (
              <Image
                className='mine-avatar-img'
                src={user.avatar}
                mode='aspectFill'
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <Text className='mine-avatar-text'>
                {/* Array.from 按 Unicode 码点取首字符，避免 emoji 代理对被 charAt 截成半个乱码 */}
                {user?.nickname ? Array.from(user.nickname)[0] : '👤'}
              </Text>
            )}
          </View>
          <View className='mine-user-info'>
            <View className='mine-user-name-row'>
              <Text className='mine-user-name'>{user?.nickname || '用户'}</Text>
              {isVip && (
                <View className='mine-vip-badge'>
                  <Text>👑 星钻会员</Text>
                </View>
              )}
            </View>
            <Text className='mine-user-desc'>
              {pets.length > 0 ? `铲屎官 · ${petDuration}` : '还没有添加宠物'}
            </Text>
          </View>
          <View className='mine-edit-btn' onClick={() => navigateTo('/pagesUser/profile/index')}>
            <Text>编辑</Text>
          </View>
        </View>
      </View>

      {/* ===== 数据概览行 3 列（原型对齐） ===== */}
      <View className='mine-stats'>
        <View className='mine-stat-item'>
          <View className='mine-stat-icon mine-stat-icon--coral'>
            <Text>🐾</Text>
          </View>
          <Text className='mine-stat-num'>{pets.length}只</Text>
          <Text className='mine-stat-label'>宠物</Text>
        </View>
        <View className='mine-stat-item'>
          <View className='mine-stat-icon mine-stat-icon--gold'>
            <Text>📅</Text>
          </View>
          <Text className='mine-stat-num'>{totalCheckins}天</Text>
          <Text className='mine-stat-label'>打卡</Text>
        </View>
        <View className='mine-stat-item'>
          <View className='mine-stat-icon mine-stat-icon--info'>
            <Text>📷</Text>
          </View>
          <Text className='mine-stat-num'>{totalMemories}条</Text>
          <Text className='mine-stat-label'>回忆</Text>
        </View>
      </View>

      {/* ===== 宠物切换 chips（保留） ===== */}
      {pets.length > 0 && (
        <View className='mine-pet-chips'>
          <ScrollView className='mine-pet-chips-scroll' scrollX showScrollbar={false}>
            {pets.map(pet => {
              const isActive = currentPet?.id === pet.id
              const emoji = pet.species === 'cat' ? '🐱' : '🐶'
              return (
                <View
                  key={pet.id}
                  className={`mine-pet-chip ${isActive ? 'mine-pet-chip--active' : ''}`}
                  onClick={() => switchPet(pet.id)}
                >
                  <View className='mine-pet-chip-avatar'>
                    <Text>{emoji}</Text>
                  </View>
                  <Text className='mine-pet-chip-name'>{pet.name}</Text>
                  {isActive && (
                    <View className='mine-pet-chip-check'>
                      <Text>✓</Text>
                    </View>
                  )}
                </View>
              )
            })}
            <View
              className='mine-pet-chip mine-pet-chip--add'
              onClick={() => navigateTo('/pagesPet/add/index')}
            >
              <View className='mine-pet-chip-add-icon'>
                <Text>+</Text>
              </View>
              <Text className='mine-pet-chip-name'>添加</Text>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ===== 分组菜单（原型对齐：数据服务 / 管理 / 设置） ===== */}
      {MENU_GROUPS.map((group, groupIndex) => (
        <View key={group.title} className='mine-menu-group'>
          <Text className='mine-menu-group-title'>{group.title}</Text>
          <View className='mine-menu-card'>
            {group.items.map((item, itemIndex) => (
              <View
                key={item.label}
                className={`mine-menu-item ${itemIndex === group.items.length - 1 ? 'mine-menu-item--last' : ''}`}
                onClick={() => navigateTo(item.url)}
              >
                <View className='mine-menu-icon-wrap'>
                  <Text className='mine-menu-icon'>{item.icon}</Text>
                </View>
                <Text className='mine-menu-label'>{item.label}</Text>
                <Text className='mine-menu-arrow'>›</Text>
              </View>
            ))}
            {/* 设置组内追加主题皮肤入口 */}
            {group.title === '设置' && (
              <>
                <View className='mine-menu-item mine-menu-item--last' onClick={() => setThemePanelOpen(!themePanelOpen)}>
                  <View className='mine-menu-icon-wrap mine-menu-icon-wrap--gradient'>
                    <Text className='mine-menu-icon'>🎨</Text>
                  </View>
                  <View className='mine-menu-label-wrap'>
                    <Text className='mine-menu-label'>主题皮肤</Text>
                    <Text className='mine-menu-theme-desc'>跟随季节</Text>
                  </View>
                  <View className='mine-menu-theme-dots'>
                    {THEME_OPTIONS.map(opt => (
                      <View
                        key={opt.key}
                        className='mine-theme-dot'
                        style={{ background: `linear-gradient(135deg, ${opt.colors[0]}, ${opt.colors[1]})` }}
                      />
                    ))}
                  </View>
                  <Text className='mine-menu-arrow'>{themePanelOpen ? '˄' : '›'}</Text>
                </View>
                {themePanelOpen && (
                  <View className='mine-theme-panel'>
                    <Text className='mine-theme-panel-hint'>选一套喜欢的季节配色，整站同步生效</Text>
                    <View className='mine-theme-grid'>
                      {THEME_OPTIONS.map(opt => (
                        <View
                          key={opt.key}
                          className={`mine-theme-choice ${currentTheme === opt.key ? 'mine-theme-choice--active' : ''}`}
                          onClick={() => handleThemeSelect(opt.key)}
                        >
                          <View
                            className='mine-theme-choice-dot'
                            style={{ background: `linear-gradient(135deg, ${opt.colors[0]}, ${opt.colors[1]})` }}
                          />
                          <Text className='mine-theme-choice-label'>{opt.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      ))}

      {/* ===== 退出登录（原型对齐） ===== */}
      <View className='mine-section'>
        <View className='mine-logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>

      <View className='mine-bottom-safe' />
    </ScrollView>
  )
}
