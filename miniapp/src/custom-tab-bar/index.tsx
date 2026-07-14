import { CoverView, CoverImage, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

interface TabItem {
  pagePath: string
  text: string
  iconPath: string
  selectedIconPath: string
}

const TAB_LIST: TabItem[] = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    iconPath: '../assets/tabbar/home.png',
    selectedIconPath: '../assets/tabbar/home-active.png'
  },
  {
    pagePath: '/pages/calendar/index',
    text: '日历',
    iconPath: '../assets/tabbar/calendar.png',
    selectedIconPath: '../assets/tabbar/calendar-active.png'
  },
  {
    pagePath: '/pages/mood/index',
    text: '记录',
    iconPath: '../assets/tabbar/mood.png',
    selectedIconPath: '../assets/tabbar/mood-active.png'
  },
  {
    pagePath: '/pages/profile/index',
    text: '我的',
    iconPath: '../assets/tabbar/profile.png',
    selectedIconPath: '../assets/tabbar/profile-active.png'
  }
]

export default function CustomTabBar() {
  const [selected, setSelected] = useState<string>('')

  useDidShow(() => {
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage) {
      const route = currentPage.route
        ? `/${currentPage.route}`
        : `/${currentPage.__route__ || ''}`
      setSelected(route)
    }
  })

  const switchTab = (pagePath: string) => {
    if (selected === pagePath) return
    Taro.switchTab({ url: pagePath })
  }

  return (
    <CoverView className='custom-tab-bar'>
      <CoverView className='tab-bar-glass'>
        {TAB_LIST.map((item) => {
          const isSelected = selected === item.pagePath
          return (
            <CoverView
              key={item.pagePath}
              className={`tab-bar-item ${isSelected ? 'active' : ''}`}
              onClick={() => switchTab(item.pagePath)}
            >
              <CoverImage
                className='tab-bar-icon'
                src={isSelected ? item.selectedIconPath : item.iconPath}
              />
              <Text className='tab-bar-text'>{item.text}</Text>
            </CoverView>
          )
        })}
      </CoverView>
      <CoverView className='tab-bar-safe-area' />
    </CoverView>
  )
}
