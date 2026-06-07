import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { FocusTask, FocusSettings, FocusPhase, CustomBackground } from './types'
import { BACKGROUND_THEMES, getThemeById } from './backgroundThemes'
import { AUDIO_OPTIONS, getAudioById } from './audioOptions'
import {
  loadTasks,
  createTask,
  deleteTask,
  loadRecords,
  saveRecord,
  getTodayPomodoroCount,
  getTodayFocusMinutes,
  loadSettings,
  updateSettings,
  saveCustomBackground,
  loadCustomBackgrounds,
  deleteCustomBackground
} from './focusModeService'
import { playAudio, playAudioFile, stopAll, setVolume, playCompletionSound } from './audioManager'
import { generateTreeSVG } from './treeAnimation'
import './focusMode.css'

interface FocusModeUIProps {
  onClose: () => void
}

export const FocusModeUI: React.FC<FocusModeUIProps> = ({ onClose }) => {
  const [phase, setPhase] = useState<FocusPhase>('idle')
  const [settings, setSettings] = useState<FocusSettings>(loadSettings)
  const [tasks, setTasks] = useState<FocusTask[]>(loadTasks)
  const [activeTaskId, setActiveTaskId] = useState<string | null>(settings.lastTaskId)
  const [remainingSeconds, setRemainingSeconds] = useState(settings.focusDuration * 60)
  const [totalSeconds, setTotalSeconds] = useState(settings.focusDuration * 60)
  const [pomodoroCount, setPomodoroCount] = useState(getTodayPomodoroCount)
  const [todayMinutes, setTodayMinutes] = useState(getTodayFocusMinutes)
  const [showTaskInput, setShowTaskInput] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [showAudioPicker, setShowAudioPicker] = useState(false)
  const [showCustomBgUpload, setShowCustomBgUpload] = useState(false)
  const [customBackgrounds, setCustomBackgrounds] = useState<CustomBackground[]>([])
  const [activeCustomBg, setActiveCustomBg] = useState<string | null>(null)
  const [showAbandonDialog, setShowAbandonDialog] = useState(false)
  const [abandonReason, setAbandonReason] = useState('')
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [focusDurationDraft, setFocusDurationDraft] = useState(settings.focusDuration)
  const [breakDurationDraft, setBreakDurationDraft] = useState(settings.breakDuration)
  const [isNightMode, setIsNightMode] = useState(false)

  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId) || null, [tasks, activeTaskId])
  const activeTheme = useMemo(() => getThemeById(settings.selectedTheme), [settings.selectedTheme])
  const activeAudio = useMemo(() => getAudioById(settings.selectedAudio), [settings.selectedAudio])

  const progress = useMemo(() => {
    if (totalSeconds === 0) return 0
    return 1 - remainingSeconds / totalSeconds
  }, [remainingSeconds, totalSeconds])

  const circumference = 2 * Math.PI * 120
  const strokeDashoffset = circumference * (1 - progress)

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  useEffect(() => {
    loadCustomBackgrounds().then(setCustomBackgrounds).catch(() => {})
  }, [])

  useEffect(() => {
    if (phase !== 'focusing' && phase !== 'break') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    startTimeRef.current = Date.now()
    timerRef.current = window.setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [phase])

  const handleTimerComplete = useCallback(() => {
    if (phase === 'focusing') {
      playCompletionSound()
      setShowCompletionAnimation(true)
      setTimeout(() => setShowCompletionAnimation(false), 3000)

      const record = {
        id: `record-${Date.now()}`,
        taskId: activeTaskId,
        taskTitle: activeTask?.title || '未命名任务',
        durationMinutes: settings.focusDuration,
        completedAt: new Date().toISOString(),
        type: 'focus' as const,
        abandoned: false
      }
      saveRecord(record)
      setPomodoroCount(prev => prev + 1)
      setTodayMinutes(prev => prev + settings.focusDuration)

      if (settings.autoStartBreak) {
        setPhase('break')
        setTotalSeconds(settings.breakDuration * 60)
        setRemainingSeconds(settings.breakDuration * 60)
      } else {
        setPhase('completed')
      }
    } else if (phase === 'break') {
      playCompletionSound()
      if (settings.autoStartFocus) {
        setPhase('focusing')
        setTotalSeconds(settings.focusDuration * 60)
        setRemainingSeconds(settings.focusDuration * 60)
      } else {
        setPhase('completed')
      }
    }
  }, [phase, activeTaskId, activeTask, settings])

  useEffect(() => {
    if (remainingSeconds === 0 && (phase === 'focusing' || phase === 'break')) {
      handleTimerComplete()
    }
  }, [remainingSeconds, handleTimerComplete])

  const handleStart = useCallback(() => {
    if (phase === 'paused') {
      setPhase('focusing')
      return
    }
    setPhase('focusing')
    setTotalSeconds(settings.focusDuration * 60)
    setRemainingSeconds(settings.focusDuration * 60)

    if (settings.selectedAudio !== 'none') {
      const audio = getAudioById(settings.selectedAudio)
      if (audio?.generated) {
        playAudio(settings.selectedAudio, settings.audioVolume)
      } else if (audio?.file) {
        playAudioFile(settings.selectedAudio, audio.file, settings.audioVolume)
      }
    }
  }, [phase, settings])

  const handlePause = useCallback(() => {
    setPhase('paused')
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setRemainingSeconds(settings.focusDuration * 60)
    setTotalSeconds(settings.focusDuration * 60)
    stopAll()
  }, [settings])

  const handleAbandon = useCallback(() => {
    setShowAbandonDialog(true)
  }, [])

  const confirmAbandon = useCallback(() => {
    const record = {
      id: `record-${Date.now()}`,
      taskId: activeTaskId,
      taskTitle: activeTask?.title || '未命名任务',
      durationMinutes: Math.round((totalSeconds - remainingSeconds) / 60),
      completedAt: new Date().toISOString(),
      type: 'focus' as const,
      abandoned: true,
      abandonReason: abandonReason || undefined
    }
    saveRecord(record)
    setShowAbandonDialog(false)
    setAbandonReason('')
    setPhase('idle')
    setRemainingSeconds(settings.focusDuration * 60)
    setTotalSeconds(settings.focusDuration * 60)
    stopAll()
  }, [activeTaskId, activeTask, totalSeconds, remainingSeconds, abandonReason, settings])

  const handleCreateTask = useCallback(() => {
    if (!newTaskTitle.trim()) return
    const task = createTask(newTaskTitle.trim())
    setTasks(loadTasks())
    setActiveTaskId(task.id)
    setNewTaskTitle('')
    setShowTaskInput(false)

    updateSettings({ lastTaskId: task.id })
  }, [newTaskTitle])

  const handleSelectTask = useCallback((taskId: string) => {
    setActiveTaskId(taskId)
    updateSettings({ lastTaskId: taskId })
  }, [])

  const handleDeleteTask = useCallback((taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteTask(taskId)
    setTasks(loadTasks())
    if (activeTaskId === taskId) {
      setActiveTaskId(null)
    }
  }, [activeTaskId])

  const handleSelectTheme = useCallback((themeId: string) => {
    updateSettings({ selectedTheme: themeId })
    setSettings(prev => ({ ...prev, selectedTheme: themeId }))
  }, [])

  const handleSelectAudio = useCallback((audioId: string) => {
    updateSettings({ selectedAudio: audioId })
    setSettings(prev => ({ ...prev, selectedAudio: audioId }))

    if (phase === 'focusing' || phase === 'break') {
      if (audioId === 'none') {
        stopAll()
      } else {
        const audio = getAudioById(audioId)
        if (audio?.generated) {
          playAudio(audioId, settings.audioVolume)
        } else if (audio?.file) {
          playAudioFile(audioId, audio.file, settings.audioVolume)
        }
      }
    }
  }, [phase, settings.audioVolume])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    updateSettings({ audioVolume: vol })
    setSettings(prev => ({ ...prev, audioVolume: vol }))
    setVolume(vol)
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const bg: CustomBackground = {
        id: `custom-bg-${Date.now()}`,
        name: file.name,
        type: 'image',
        data: new Blob([file], { type: file.type }),
        thumbnail: reader.result as string,
        createdAt: new Date().toISOString()
      }
      await saveCustomBackground(bg)
      const bgs = await loadCustomBackgrounds()
      setCustomBackgrounds(bgs)
      setActiveCustomBg(bg.id)
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const videoUrl = URL.createObjectURL(file)
    const bg: CustomBackground = {
      id: `custom-bg-${Date.now()}`,
      name: file.name,
      type: 'video',
      data: new Blob([file], { type: file.type }),
      thumbnail: videoUrl,
      createdAt: new Date().toISOString()
    }
    saveCustomBackground(bg).then(async () => {
      const bgs = await loadCustomBackgrounds()
      setCustomBackgrounds(bgs)
      setActiveCustomBg(bg.id)
    })
    if (videoInputRef.current) videoInputRef.current.value = ''
  }, [])

  const handleDeleteCustomBg = useCallback(async (id: string) => {
    await deleteCustomBackground(id)
    const bgs = await loadCustomBackgrounds()
    setCustomBackgrounds(bgs)
    if (activeCustomBg === id) setActiveCustomBg(null)
  }, [activeCustomBg])

  const handleSaveSettings = useCallback(() => {
    updateSettings({
      focusDuration: focusDurationDraft,
      breakDuration: breakDurationDraft
    })
    setSettings(prev => ({
      ...prev,
      focusDuration: focusDurationDraft,
      breakDuration: breakDurationDraft
    }))
    setShowSettings(false)
    if (phase === 'idle') {
      setRemainingSeconds(focusDurationDraft * 60)
      setTotalSeconds(focusDurationDraft * 60)
    }
  }, [focusDurationDraft, breakDurationDraft, phase])

  const handleShare = useCallback(async () => {
    const text = `🌟 我在星寰海完成了 ${pomodoroCount} 个番茄钟，累计专注 ${todayMinutes} 分钟！`
    if (navigator.share) {
      try {
        await navigator.share({ title: '专注成果', text })
      } catch {
        /* share cancelled or not supported */
      }
    } else {
      await navigator.clipboard.writeText(text)
    }
  }, [pomodoroCount, todayMinutes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        if (phase === 'idle' || phase === 'paused') {
          handleStart()
        } else if (phase === 'focusing' || phase === 'break') {
          handlePause()
        }
      }
      if (e.code === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, handleStart, handlePause, onClose])

  const records = useMemo(() => {
    if (!showHistory) return []
    return loadRecords().slice(-20).reverse()
  }, [showHistory])

  const activeCustomBgData = useMemo(() => {
    return customBackgrounds.find(bg => bg.id === activeCustomBg)
  }, [customBackgrounds, activeCustomBg])

  const treeSVG = useMemo(() => {
    return generateTreeSVG(progress, phase === 'idle' && remainingSeconds < totalSeconds)
  }, [progress, phase, remainingSeconds, totalSeconds])

  return (
    <div className={`focus-mode-container ${activeTheme?.cssClass || 'bg-forest'} ${isNightMode ? 'night-mode' : ''}`}>
      {activeCustomBgData?.type === 'image' && (
        <div className="focus-custom-bg" style={{ backgroundImage: `url(${activeCustomBgData.thumbnail})` }} />
      )}
      {activeCustomBgData?.type === 'video' && (
        <video className="focus-custom-bg" src={activeCustomBgData.thumbnail} autoPlay loop muted playsInline />
      )}

      <div className="focus-mode-overlay" />

      <div className="focus-mode-content">
        <header className="focus-header">
          <button className="focus-btn-icon" onClick={onClose} title="关闭 (Esc)">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="focus-header-actions">
            <button className="focus-btn-icon" onClick={() => setShowHistory(!showHistory)} title="历史记录">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button className="focus-btn-icon" onClick={() => setShowSettings(!showSettings)} title="设置">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 1v3M10 16v3M1 10h3M16 10h3M3.5 3.5l2 2M14.5 14.5l2 2M3.5 16.5l2-2M14.5 5.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <button
              className={`focus-btn-icon ${isNightMode ? 'active' : ''}`}
              onClick={() => setIsNightMode(!isNightMode)}
              title="夜间模式"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17 10.5A7 7 0 013 9.5 7 7 0 0010 17a7 7 0 007-6.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        {showHistory && (
          <div className="focus-panel focus-history-panel">
            <h3>专注记录</h3>
            <div className="focus-history-list">
              {records.length === 0 && <p className="focus-empty">暂无记录</p>}
              {records.map(r => (
                <div key={r.id} className={`focus-history-item ${r.abandoned ? 'abandoned' : ''}`}>
                  <span className="focus-history-task">{r.taskTitle}</span>
                  <span className="focus-history-time">{r.durationMinutes} 分钟</span>
                  <span className="focus-history-date">{new Date(r.completedAt).toLocaleDateString()}</span>
                  {r.abandoned && <span className="focus-history-abandoned">已放弃</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="focus-panel focus-settings-panel">
            <h3>专注设置</h3>
            <div className="focus-setting-group">
              <label>专注时长（分钟）</label>
              <div className="focus-setting-input-row">
                <button onClick={() => setFocusDurationDraft(Math.max(5, focusDurationDraft - 5))}>−</button>
                <span>{focusDurationDraft}</span>
                <button onClick={() => setFocusDurationDraft(Math.min(120, focusDurationDraft + 5))}>+</button>
              </div>
            </div>
            <div className="focus-setting-group">
              <label>休息时长（分钟）</label>
              <div className="focus-setting-input-row">
                <button onClick={() => setBreakDurationDraft(Math.max(1, breakDurationDraft - 1))}>−</button>
                <span>{breakDurationDraft}</span>
                <button onClick={() => setBreakDurationDraft(Math.min(30, breakDurationDraft + 1))}>+</button>
              </div>
            </div>
            <button className="focus-btn-primary" onClick={handleSaveSettings}>保存设置</button>
          </div>
        )}

        <div className="focus-main">
          <div className="focus-timer-section">
            <div className="focus-progress-ring">
              <svg width="280" height="280" viewBox="0 0 280 280">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <circle
                  cx="140"
                  cy="140"
                  r="120"
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  transform="rotate(-90 140 140)"
                  filter="url(#glow)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="focus-tree-container" dangerouslySetInnerHTML={{ __html: treeSVG }} />
              <div className="focus-time-display">
                <span className="focus-time-text">{timeDisplay}</span>
                <span className="focus-phase-label">
                  {phase === 'focusing' ? '专注中' : phase === 'break' ? '休息中' : phase === 'paused' ? '已暂停' : phase === 'completed' ? '已完成' : '准备开始'}
                </span>
              </div>
            </div>

            {showCompletionAnimation && (
              <div className="focus-completion-animation">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span
                    key={i}
                    className="focus-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1}s`,
                      animationDuration: `${1 + Math.random() * 2}s`,
                      '--tx': `${(Math.random() - 0.5) * 200}px`,
                      '--ty': `${-100 - Math.random() * 200}px`
                    } as React.CSSProperties}
                  >
                    {['🌸', '✨', '🌟', '💫', '🎉'][Math.floor(Math.random() * 5)]}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="focus-task-section">
            <div className="focus-task-display">
              {activeTask ? (
                <div className="focus-active-task" style={{ borderLeftColor: activeTask.color }}>
                  <span className="focus-task-dot" style={{ backgroundColor: activeTask.color }} />
                  <span className="focus-task-title">{activeTask.title}</span>
                  <button className="focus-btn-sm" onClick={() => setShowTaskInput(true)}>切换</button>
                </div>
              ) : (
                <button className="focus-btn-secondary" onClick={() => setShowTaskInput(true)}>
                  + 选择或创建任务
                </button>
              )}
            </div>

            {showTaskInput && (
              <div className="focus-task-picker">
                <div className="focus-task-input-row">
                  <input
                    type="text"
                    className="focus-input"
                    placeholder="输入新任务名称..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                    autoFocus
                  />
                  <button className="focus-btn-primary" onClick={handleCreateTask}>创建</button>
                  <button className="focus-btn-ghost" onClick={() => setShowTaskInput(false)}>取消</button>
                </div>
                {tasks.length > 0 && (
                  <div className="focus-task-list">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className={`focus-task-item ${task.id === activeTaskId ? 'active' : ''}`}
                        onClick={() => handleSelectTask(task.id)}
                      >
                        <span className="focus-task-dot" style={{ backgroundColor: task.color }} />
                        <span className="focus-task-title">{task.title}</span>
                        <button
                          className="focus-btn-delete"
                          onClick={e => handleDeleteTask(task.id, e)}
                          title="删除任务"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="focus-controls">
            {phase === 'idle' || phase === 'completed' ? (
              <button className="focus-btn-start" onClick={handleStart}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                开始专注
              </button>
            ) : phase === 'paused' ? (
              <button className="focus-btn-start" onClick={handleStart}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                继续
              </button>
            ) : (
              <button className="focus-btn-pause" onClick={handlePause}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
                暂停
              </button>
            )}

            {(phase === 'focusing' || phase === 'break' || phase === 'paused') && (
              <>
                <button className="focus-btn-reset" onClick={handleReset}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 10a7 7 0 019.5-6.5M17 10a7 7 0 01-9.5 6.5" strokeLinecap="round" />
                    <path d="M10 3v3h3M10 17v-3H7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  重置
                </button>
                <button className="focus-btn-abandon" onClick={handleAbandon}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                  放弃
                </button>
              </>
            )}
          </div>

          <div className="focus-stats">
            <div className="focus-stat-item">
              <span className="focus-stat-icon">🍅</span>
              <span className="focus-stat-value">{pomodoroCount}</span>
              <span className="focus-stat-label">今日番茄</span>
            </div>
            <div className="focus-stat-item">
              <span className="focus-stat-icon">⏱️</span>
              <span className="focus-stat-value">{todayMinutes}</span>
              <span className="focus-stat-label">今日分钟</span>
            </div>
            <button className="focus-stat-item focus-stat-clickable" onClick={handleShare}>
              <span className="focus-stat-icon">📤</span>
              <span className="focus-stat-label">分享成果</span>
            </button>
          </div>

          <div className="focus-bottom-bar">
            <div className="focus-theme-selector">
              <button
                className={`focus-theme-btn ${showThemePicker ? 'active' : ''}`}
                onClick={() => { setShowThemePicker(!showThemePicker); setShowAudioPicker(false) }}
              >
                🎨 背景
              </button>
              <button
                className={`focus-theme-btn ${showAudioPicker ? 'active' : ''}`}
                onClick={() => { setShowAudioPicker(!showAudioPicker); setShowThemePicker(false) }}
              >
                🎵 音乐
              </button>
              <button
                className={`focus-theme-btn ${showCustomBgUpload ? 'active' : ''}`}
                onClick={() => { setShowCustomBgUpload(!showCustomBgUpload); setShowThemePicker(false); setShowAudioPicker(false) }}
              >
                🖼️ 自定义
              </button>
            </div>

            {activeAudio && activeAudio.id !== 'none' && (
              <div className="focus-volume-control">
                <span>🔊</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.audioVolume}
                  onChange={handleVolumeChange}
                  className="focus-volume-slider"
                />
              </div>
            )}
          </div>

          {showThemePicker && (
            <div className="focus-picker-panel">
              <h4>选择背景主题</h4>
              <div className="focus-theme-grid">
                {BACKGROUND_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    className={`focus-theme-card ${settings.selectedTheme === theme.id ? 'active' : ''}`}
                    onClick={() => handleSelectTheme(theme.id)}
                    style={{ background: theme.gradient }}
                  >
                    <span className="focus-theme-icon">{theme.icon}</span>
                    <span className="focus-theme-name">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAudioPicker && (
            <div className="focus-picker-panel">
              <h4>选择背景音乐</h4>
              <div className="focus-audio-grid">
                {AUDIO_OPTIONS.map(audio => (
                  <button
                    key={audio.id}
                    className={`focus-audio-card ${settings.selectedAudio === audio.id ? 'active' : ''}`}
                    onClick={() => handleSelectAudio(audio.id)}
                  >
                    <span className="focus-audio-icon">{audio.icon}</span>
                    <span className="focus-audio-name">{audio.name}</span>
                    {audio.file && !audio.file.startsWith('/audio/') && (
                      <span className="focus-audio-badge">需文件</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showCustomBgUpload && (
            <div className="focus-picker-panel">
              <h4>自定义背景</h4>
              <div className="focus-upload-row">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  style={{ display: 'none' }}
                />
                <button className="focus-btn-secondary" onClick={() => fileInputRef.current?.click()}>
                  📷 上传图片
                </button>
                <button className="focus-btn-secondary" onClick={() => videoInputRef.current?.click()}>
                  🎬 上传视频
                </button>
              </div>
              {customBackgrounds.length > 0 && (
                <div className="focus-custom-bg-grid">
                  {customBackgrounds.map(bg => (
                    <div
                      key={bg.id}
                      className={`focus-custom-bg-card ${activeCustomBg === bg.id ? 'active' : ''}`}
                      onClick={() => setActiveCustomBg(bg.id)}
                    >
                      <div
                        className="focus-custom-bg-thumb"
                        style={{ backgroundImage: `url(${bg.thumbnail})` }}
                      >
                        {bg.type === 'video' && <span className="focus-video-badge">▶</span>}
                      </div>
                      <span className="focus-custom-bg-name">{bg.name}</span>
                      <button
                        className="focus-btn-delete"
                        onClick={e => { e.stopPropagation(); handleDeleteCustomBg(bg.id) }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {activeCustomBg && (
                <button className="focus-btn-ghost" onClick={() => setActiveCustomBg(null)}>
                  清除自定义背景
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAbandonDialog && (
        <div className="focus-dialog-overlay" onClick={() => setShowAbandonDialog(false)}>
          <div className="focus-dialog" onClick={e => e.stopPropagation()}>
            <h3>确定要放弃吗？</h3>
            <p>放弃后本次专注将不会被计入完成记录。</p>
            <textarea
              className="focus-textarea"
              placeholder="放弃原因（可选）..."
              value={abandonReason}
              onChange={e => setAbandonReason(e.target.value)}
              rows={2}
            />
            <div className="focus-dialog-actions">
              <button className="focus-btn-ghost" onClick={() => setShowAbandonDialog(false)}>取消</button>
              <button className="focus-btn-danger" onClick={confirmAbandon}>确认放弃</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
