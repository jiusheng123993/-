// 星寰海 v3.0 - 悬浮液态玻璃导航栏
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './FloatingNav.scss'

interface NavItem {
  key: string
  label: string
  path: string
  icon: string
}

const navItems: NavItem[] = [
  { key: 'home', label: '首页', path: '/pages/index/index', icon: 'home' },
  { key: 'calendar', label: '日历', path: '/pages/calendar/index', icon: 'calendar' },
  { key: 'mood', label: '记录', path: '/pages/mood/index', icon: 'edit' },
  { key: 'profile', label: '我的', path: '/pages/profile/index', icon: 'user' }
]

// SVG 图标
const NavIcon = ({ name, size = 22, color = '#8a8a8a' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
    calendar: 'M8 2v4M16 2v4M3 8h18M3 8v12a2 2 0 002 2h14a2 2 0 002-2V8M8 14h.01M12 14h.01M16 14h.01',
    edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
    user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z'
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || icons.home} />
    </svg>
  )
}

export default function FloatingNav() {
  const [currentPath, setCurrentPath] = useState('')

  useEffect(() => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      setCurrentPath(`/${pages[pages.length - 1].route}`)
    }
  }, [])

  const handleNav = (path: string) => {
    if (currentPath !== path) {
      Taro.redirectTo({ url: path })
    }
  }

  return (
    <View className='floating-nav-container'>
      <View className='floating-nav-glass'>
        {navItems.map((item) => {
          const isActive = currentPath === item.path
          return (
            <View
              key={item.key}
              className={`floating-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <View className='floating-nav-icon-wrap'>
                <NavIcon
                  name={item.icon}
                  size={20}
                  color={isActive ? '#2d2d2d' : '#8a8a8a'}
                />
              </View>
              <Text className={`floating-nav-text ${isActive ? 'active' : ''}`}>
                {item.label}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
