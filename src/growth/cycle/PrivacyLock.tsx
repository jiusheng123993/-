import React, { useState, useCallback } from 'react'
import { cycleService } from './cycleService'
import { Lock } from 'lucide-react'

type PrivacyLockProps = {
  onUnlock: () => void
}

export function PrivacyLock({ onUnlock }: PrivacyLockProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (cycleService.verifyPrivacyPin(pin)) {
      onUnlock()
    } else {
      setAttempts(prev => prev + 1)
      setError(attempts >= 2 ? '多次输入错误，请稍后再试' : 'PIN码错误')
      setPin('')
    }
  }, [pin, attempts, onUnlock])

  return (
    <div className="privacy-lock">
      <Lock size={32} />
      <h3>隐私锁</h3>
      <p>请输入PIN码以访问周期管理</p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(null) }}
          placeholder="输入PIN码"
          maxLength={8}
          autoFocus
          disabled={attempts >= 3}
        />
        {error && <p className="privacy-lock-error">{error}</p>}
        <button type="submit" disabled={pin.length < 4 || attempts >= 3}>
          解锁
        </button>
      </form>
    </div>
  )
}
