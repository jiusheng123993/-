import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FocusBriefStylePicker } from './FocusBriefStylePicker'
import { focusBriefStyles } from './focusBriefRegistry'

describe('FocusBriefStylePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders style picker button', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    expect(screen.getByRole('button', { name: /切换专注概览样式/ })).toBeInTheDocument()
  })

  it('opens menu when button is clicked', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    
    expect(screen.getByText('选择概览样式')).toBeInTheDocument()
  })

  it('renders all available styles', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    
    focusBriefStyles.forEach(style => {
      expect(screen.getByText(style.name)).toBeInTheDocument()
    })
  })

  it('calls onStyleChange when style is selected', () => {
    const onStyleChange = vi.fn()
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={onStyleChange} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    
    const firstStyle = focusBriefStyles[0]
    fireEvent.click(screen.getByText(firstStyle.name))
    
    expect(onStyleChange).toHaveBeenCalledWith(firstStyle.id)
  })

  it('closes menu after selection', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    
    const firstStyle = focusBriefStyles[0]
    fireEvent.click(screen.getByText(firstStyle.name))
    
    expect(screen.queryByText('选择概览样式')).not.toBeInTheDocument()
  })

  it('closes menu when clicking outside', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    expect(screen.getByText('选择概览样式')).toBeInTheDocument()
    
    fireEvent.mouseDown(document.body)
    
    expect(screen.queryByText('选择概览样式')).not.toBeInTheDocument()
  })

  it('closes menu on Escape key', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    expect(screen.getByText('选择概览样式')).toBeInTheDocument()
    
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(screen.queryByText('选择概览样式')).not.toBeInTheDocument()
  })

  it('shows checkmark on current style', () => {
    const currentStyle = focusBriefStyles[0]
    render(
      <FocusBriefStylePicker 
        currentStyleId={currentStyle.id} 
        onStyleChange={() => {}} 
      />
    )
    
    fireEvent.click(screen.getByRole('button', { name: /切换专注概览样式/ }))
    
    const checkmark = document.querySelector('.focus-brief-style-option svg')
    expect(checkmark).toBeInTheDocument()
  })

  it('toggles menu when button is clicked again', () => {
    render(
      <FocusBriefStylePicker 
        currentStyleId="arc" 
        onStyleChange={() => {}} 
      />
    )
    
    const button = screen.getByRole('button', { name: /切换专注概览样式/ })
    
    fireEvent.click(button)
    expect(screen.getByText('选择概览样式')).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(screen.queryByText('选择概览样式')).not.toBeInTheDocument()
  })
})
