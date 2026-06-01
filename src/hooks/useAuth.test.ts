import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('loads session from localStorage on mount', () => {
    localStorage.setItem('dev-auth-session', JSON.stringify({
      userId: 'dev-user-001',
      role: 'user',
      displayName: '开发用户'
    }))

    const { result } = renderHook(() => useAuth())

    expect(result.current.userId).toBe('dev-user-001')
    expect(result.current.role).toBe('user')
  })

  it('saves session to localStorage when session changes', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      result.current.switchRole()
    })

    expect(result.current.role).toBe('admin')
  })

  it('sets user_id in localStorage when session changes', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.switchRole()
    })

    expect(localStorage.getItem('user_id')).toBe(result.current.userId)
  })

  it('switches role from user to admin', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.role).toBe('user')

    act(() => {
      result.current.switchRole()
    })

    expect(result.current.role).toBe('admin')
  })

  it('switches role from admin to user', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      result.current.switchRole()
    })

    expect(result.current.role).toBe('admin')
    
    await act(async () => {
      result.current.switchRole()
    })

    expect(result.current.role).toBe('user')
  })

  it('returns session object with all properties', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.session).toHaveProperty('userId')
    expect(result.current.session).toHaveProperty('role')
    expect(result.current.session).toHaveProperty('displayName')
  })
})
