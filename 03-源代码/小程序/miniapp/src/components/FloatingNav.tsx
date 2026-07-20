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
  { key: 'pet', label: '宠物', path: '/pages/pet-profile/index', icon: 'pet' },
  { key: 'checkin', label: '打卡', path: '/pagesPet/checkin/index', icon: 'checkin' },
  { key: 'food', label: '食物', path: '/pagesPet/food-query/index', icon: 'food' },
  { key: 'symptom', label: '症状', path: '/pagesPet/symptom-check/index', icon: 'medical' },
  { key: 'vaccine', label: '疫苗', path: '/pagesPet/vaccine/index', icon: 'shield' },
  { key: 'trends', label: '趋势', path: '/pagesPet/trends/index', icon: 'chart' },
  { key: 'profile', label: '我的', path: '/pagesUser/profile/index', icon: 'user' }
]

const NavIcon = ({ name, size = 20, color = '#8C8C8C' }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M9 22V12h6v10',
    pet: 'M12 22c-4 0-8-2-8-6 0-3 2-5 4-6l1-4c0-2 2-4 3-4s3 2 3 4l1 4c2 1 4 3 4 6 0 4-4 6-8 6z M9 14h.01M15 14h.01',
    checkin: 'M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
    food: 'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    medical: 'M12 2v4M12 6l-4 4h8l-4-4M8 14h8M8 14a4 4 0 000 8h8a4 4 0 000-8M10 18h4',
    chart: 'M3 3v18h18M7 16l4-4 4 4 5-5M7 10l4-4 4 4 5-5',
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
      Taro.reLaunch({ url: path })
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
                  color={isActive ? '#B03A2E' : '#8C8C8C'}
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
