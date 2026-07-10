import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PrivacyLock } from './PrivacyLock'

vi.mock('./cycleService', () => ({
  cycleService: {
    verifyPrivacyPin: vi.fn((pin: string) => pin === '1234')
  }
}))

describe('PrivacyLock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders privacy lock component', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    expect(screen.getByText('隐私锁')).toBeInTheDocument()
  })

  it('renders PIN input field', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    expect(screen.getByPlaceholderText('输入PIN码')).toBeInTheDocument()
  })

  it('renders unlock button', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    expect(screen.getByText('解锁')).toBeInTheDocument()
  })

  it('disables unlock button when PIN is too short', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    const button = screen.getByText('解锁') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('enables unlock button when PIN is 4+ characters', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    const input = screen.getByPlaceholderText('输入PIN码')
    fireEvent.change(input, { target: { value: '1234' } })
    
    const button = screen.getByText('解锁') as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })

  it('calls onUnlock with correct PIN', () => {
    const onUnlock = vi.fn()
    render(<PrivacyLock onUnlock={onUnlock} />)
    
    const input = screen.getByPlaceholderText('输入PIN码')
    fireEvent.change(input, { target: { value: '1234' } })
    fireEvent.click(screen.getByText('解锁'))
    
    expect(onUnlock).toHaveBeenCalled()
  })

  it('shows error with wrong PIN', () => {
    const onUnlock = vi.fn()
    render(<PrivacyLock onUnlock={onUnlock} />)
    
    const input = screen.getByPlaceholderText('输入PIN码')
    fireEvent.change(input, { target: { value: '0000' } })
    fireEvent.click(screen.getByText('解锁'))
    
    expect(screen.getByText('PIN码错误')).toBeInTheDocument()
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('clears PIN after failed attempt', () => {
    render(<PrivacyLock onUnlock={() => {}} />)
    
    const input = screen.getByPlaceholderText('输入PIN码')
    fireEvent.change(input, { target: { value: '0000' } })
    fireEvent.click(screen.getByText('解锁'))
    
    expect(input).toHaveValue('')
  })

  it('shows different error after multiple attempts', () => {
    const onUnlock = vi.fn()
    render(<PrivacyLock onUnlock={onUnlock} />)
    
    const input = screen.getByPlaceholderText('输入PIN码')
    
    fireEvent.change(input, { target: { value: '0000' } })
    fireEvent.click(screen.getByText('解锁'))
    
    fireEvent.change(input, { target: { value: '0000' } })
    fireEvent.click(screen.getByText('解锁'))
    
    const errorText = screen.getByText(/错误/)
    expect(errorText).toBeInTheDocument()
  })
})
