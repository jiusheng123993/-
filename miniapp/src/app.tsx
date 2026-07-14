import { PropsWithChildren, useEffect } from 'react'
import { useLaunch } from '@tarojs/taro'
import { useScheduleStore } from './stores/scheduleStore'
import { loadMoodEntriesFromStorage } from './stores/moodStore'
import { useMoodStore } from './stores/moodStore'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('星寰海 v3.0 启动')
  })

  // 加载存储的数据
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载日程事件
        await useScheduleStore.getState().loadFromStorage()
        // 加载情绪记录
        const moodEntries = loadMoodEntriesFromStorage()
        useMoodStore.setState({ entries: moodEntries })
        console.log('[App] 数据加载完成')
      } catch (err) {
        console.error('[App] 数据加载失败:', err)
      }
    }
    loadData()
  }, [])

  return children
}

export default App
