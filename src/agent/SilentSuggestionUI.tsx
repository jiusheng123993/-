import { useState, useEffect } from 'react'
import type { SilentSuggestion } from './useSilentSuggestions'

export type { SilentSuggestion } from './useSilentSuggestions'

export interface SilentSuggestionUIProps {
  suggestions: SilentSuggestion[]
  onDismiss?: (id: string) => void
  onAction?: (id: string) => void
}

const PRIORITY_STYLES = {
  low: { bg: 'var(--surface-elevated)', border: 'var(--border)', icon: '💡' },
  medium: { bg: 'var(--surface-elevated)', border: 'var(--warning)', icon: '�? },
  high: { bg: 'var(--surface-elevated)', border: 'var(--error)', icon: '🔥' }
}

export function SilentSuggestionUI({ suggestions, onDismiss, onAction }: SilentSuggestionUIProps) {
  const [visibleSuggestions, setVisibleSuggestions] = useState<SilentSuggestion[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const filtered = suggestions.filter(s => !dismissedIds.has(s.id))
    const sorted = [...filtered].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    setVisibleSuggestions(sorted.slice(0, 3))
  }, [suggestions, dismissedIds])

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    onDismiss?.(id)
  }

  const handleAction = (suggestion: SilentSuggestion) => {
    if (suggestion.action) {
      suggestion.action()
    }
    onAction?.(suggestion.id)
  }

  if (visibleSuggestions.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        width: '320px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 900
      }}
    >
      {visibleSuggestions.map(suggestion => {
        const style = PRIORITY_STYLES[suggestion.priority]
        return (
          <div
            key={suggestion.id}
            style={{
              padding: '14px 16px',
              background: style.bg,
              borderRadius: '12px',
              borderLeft: `3px solid ${style.border}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              animation: 'slideIn 300ms ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{style.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  lineHeight: 1.5, 
                  color: 'var(--text)',
                  wordBreak: 'break-word'
                }}>
                  {suggestion.message}
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '10px',
                  alignItems: 'center'
                }}>
                  {suggestion.actionLabel && (
                    <button
                      onClick={() => handleAction(suggestion)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {suggestion.actionLabel}
                    </button>
                  )}
                  {suggestion.dismissible && (
                    <button
                      onClick={() => handleDismiss(suggestion.id)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--muted)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: 'auto'
                      }}
                    >
                      知道�?
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
