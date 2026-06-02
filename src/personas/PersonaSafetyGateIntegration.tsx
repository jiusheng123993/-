import { useMemo, useCallback } from 'react'
import { createPersonaSafetyGate, type PersonaSafetyGate, type SafetyCheckResult } from './personaSafetyGate'
import { createSafetyIncidentLog } from './safetyIncidentLog'

const safetyIncidentLog = createSafetyIncidentLog()
const personaSafetyGate: PersonaSafetyGate = createPersonaSafetyGate(safetyIncidentLog)

export function usePersonaSafetyGate() {
  const validateIdentityRole = useCallback((role: string) => {
    return personaSafetyGate.validateIdentityRole(role)
  }, [])

  const validateName = useCallback((name: string) => {
    return personaSafetyGate.validateName(name)
  }, [])

  const validateAddressing = useCallback((addressing: string) => {
    return personaSafetyGate.validateAddressing(addressing)
  }, [])

  const validateContent = useCallback((content: string) => {
    return personaSafetyGate.validateContent(content)
  }, [])

  const validateDialogue = useCallback((userInput: string, agentOutput: string) => {
    return personaSafetyGate.validateDialogue(userInput, agentOutput)
  }, [])

  const checkConversationHealth = useCallback((userId: string, dailyMinutes: number) => {
    return personaSafetyGate.checkConversationHealth(userId, dailyMinutes)
  }, [])

  return {
    validateIdentityRole,
    validateName,
    validateAddressing,
    validateContent,
    validateDialogue,
    checkConversationHealth
  }
}

export function PersonaSafetyValidator({ 
  type, 
  value, 
  onResult 
}: { 
  type: 'identityRole' | 'name' | 'addressing' | 'content'
  value: string
  onResult: (result: SafetyCheckResult) => void
}) {
  const result = useMemo(() => {
    switch (type) {
      case 'identityRole':
        return personaSafetyGate.validateIdentityRole(value)
      case 'name':
        return personaSafetyGate.validateName(value)
      case 'addressing':
        return personaSafetyGate.validateAddressing(value)
      case 'content':
        return personaSafetyGate.validateContent(value)
    }
  }, [type, value])

  useMemo(() => {
    onResult(result)
  }, [result, onResult])

  if (result.ok) return null

  return (
    <div style={{
      padding: '8px 12px',
      borderRadius: 8,
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid #ef4444',
      color: '#ef4444',
      fontSize: 13,
      marginTop: 8
    }}>
      <strong>⚠️ 安全检查未通过</strong>
      <p style={{ margin: '4px 0 0' }}>{result.reason}</p>
      {result.violatedRules && (
        <p style={{ margin: '4px 0 0', fontSize: 12 }}>
          违规规则: {result.violatedRules.join(', ')}
        </p>
      )}
    </div>
  )
}

export function DialogueSafetyGuard({ 
  userInput, 
  agentOutput, 
  children,
  onBlock 
}: { 
  userInput: string
  agentOutput: string
  children: React.ReactNode
  onBlock?: (reason: string) => void
}) {
  const result = useMemo(() => {
    return personaSafetyGate.validateDialogue(userInput, agentOutput)
  }, [userInput, agentOutput])

  if (!result.ok) {
    onBlock?.(result.reason || '安全检查未通过')
    return (
      <div style={{
        padding: 24,
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12
      }}>
        <span style={{ fontSize: 32 }}>🛡️</span>
        <h3 style={{ margin: '12px 0 8px', color: '#ef4444' }}>内容安全拦截</h3>
        <p style={{ color: 'var(--muted)' }}>{result.reason}</p>
      </div>
    )
  }

  return <>{children}</>
}

export function ConversationHealthGuard({ 
  userId, 
  dailyMinutes, 
  children,
  onWarning 
}: { 
  userId: string
  dailyMinutes: number
  children: React.ReactNode
  onWarning?: (reason: string) => void
}) {
  const result = useMemo(() => {
    return personaSafetyGate.checkConversationHealth(userId, dailyMinutes)
  }, [userId, dailyMinutes])

  if (!result.ok) {
    onWarning?.(result.reason || '健康检查提醒')
  }

  return (
    <div>
      {children}
      {!result.ok && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid #f59e0b',
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>⚠️</span>
          <span style={{ color: '#f59e0b', fontSize: 13 }}>{result.reason}</span>
        </div>
      )}
    </div>
  )
}

export { safetyIncidentLog, personaSafetyGate }
