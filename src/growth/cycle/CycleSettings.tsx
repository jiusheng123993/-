import { useState, useCallback } from 'react'
import type { CycleSettings } from './cycleTypes'
import { cycleService } from './cycleService'
import { Download, Trash2, AlertCircle } from 'lucide-react'

type CycleSettingsPageProps = {
  onBack: () => void
}

export function CycleSettingsPage({ onBack: _onBack }: CycleSettingsPageProps) {
  const [settings, setSettings] = useState<CycleSettings>(cycleService.getSettings())
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [showPinSetup, setShowPinSetup] = useState(false)

  const handleSettingChange = useCallback(<K extends keyof CycleSettings>(key: K, value: CycleSettings[K]) => {
    const updated = cycleService.updateSettings({ [key]: value })
    setSettings(updated)
  }, [])

  const handlePinSetup = useCallback(() => {
    if (pinInput.length < 4) {
      setPinError('PIN码至少4位')
      return
    }
    if (pinInput !== pinConfirm) {
      setPinError('两次输入不一致')
      return
    }
    cycleService.setPrivacyPin(pinInput)
    setSettings(cycleService.getSettings())
    setShowPinSetup(false)
    setPinInput('')
    setPinConfirm('')
    setPinError(null)
  }, [pinInput, pinConfirm])

  const handleExport = useCallback(() => {
    const data = cycleService.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cycle_data_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleClearData = useCallback(() => {
    if (window.confirm('确定要删除所有周期数据吗？此操作不可恢复。')) {
      cycleService.clearAllData()
      setSettings(cycleService.getSettings())
    }
  }, [])

  return (
    <div className="cycle-settings">
      <div className="cycle-settings-header">
        <h3>周期管理设置</h3>
      </div>

      <div className="cycle-disclaimer">
        <AlertCircle size={16} />
        <p>
          本功能仅提供周期记录和生活建议，不构成任何医学诊断。
          如有健康问题，请咨询专业医生。
        </p>
      </div>

      <div className="cycle-setting-group">
        <label className="cycle-setting-label">
          <span>经期前提醒天数</span>
          <select
            value={settings.reminderDaysBefore}
            onChange={e => handleSettingChange('reminderDaysBefore', Number(e.target.value))}
          >
            {[1, 2, 3, 5, 7].map(d => (
              <option key={d} value={d}>{d}天</option>
            ))}
          </select>
        </label>

        <label className="cycle-setting-label">
          <span>提醒时间</span>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={e => handleSettingChange('reminderTime', e.target.value)}
          />
        </label>

        <label className="cycle-setting-toggle">
          <span>在首页显示周期信息</span>
          <input
            type="checkbox"
            checked={settings.showInDashboard}
            onChange={e => handleSettingChange('showInDashboard', e.target.checked)}
          />
        </label>

        <label className="cycle-setting-toggle">
          <span>显示能量建议</span>
          <input
            type="checkbox"
            checked={settings.showEnergySuggestion}
            onChange={e => handleSettingChange('showEnergySuggestion', e.target.checked)}
          />
        </label>
      </div>

      <div className="cycle-setting-group">
        <h4>隐私保护</h4>
        <label className="cycle-setting-toggle">
          <span>隐私锁</span>
          <input
            type="checkbox"
            checked={settings.privacyLockEnabled}
            onChange={e => {
              if (e.target.checked && !settings.privacyPin) {
                setShowPinSetup(true)
              } else {
                handleSettingChange('privacyLockEnabled', e.target.checked)
              }
            }}
          />
        </label>

        {showPinSetup && (
          <div className="cycle-pin-setup">
            <input
              type="password"
              placeholder="输入PIN码（至少4位）"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              maxLength={8}
            />
            <input
              type="password"
              placeholder="确认PIN码"
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value)}
              maxLength={8}
            />
            {pinError && <p className="cycle-pin-error">{pinError}</p>}
            <button onClick={handlePinSetup} type="button">确认设置</button>
            <button onClick={() => { setShowPinSetup(false); setPinError(null) }} type="button">取消</button>
          </div>
        )}
      </div>

      <div className="cycle-setting-group">
        <h4>数据管理</h4>
        <button className="cycle-data-btn" onClick={handleExport} type="button">
          <Download size={14} />
          <span>导出数据</span>
        </button>
        <button className="cycle-data-btn danger" onClick={handleClearData} type="button">
          <Trash2 size={14} />
          <span>删除所有数据</span>
        </button>
      </div>
    </div>
  )
}
