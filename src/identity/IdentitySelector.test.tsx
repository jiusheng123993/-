import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { IdentityProvider } from './IdentityProvider'
import { IdentitySelector } from './IdentitySelector'

describe('IdentitySelector', () => {
  it('renders identity list by default', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    expect(screen.getByText('选择身份')).toBeInTheDocument()
    expect(screen.getByText('+ 创建新身份')).toBeInTheDocument()
  })

  it('shows create form when create button is clicked', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    fireEvent.click(screen.getByText('+ 创建新身份'))
    expect(screen.getByPlaceholderText('例如：考研党、职场新人、全职妈妈')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('描述一下你的使用场景...')).toBeInTheDocument()
  })

  it('creates identity when form is submitted', () => {
    render(
      <IdentityProvider>
        <IdentitySelector />
      </IdentityProvider>
    )
    fireEvent.click(screen.getByText('+ 创建新身份'))
    
    fireEvent.change(screen.getByPlaceholderText('例如：考研党、职场新人、全职妈妈'), {
      target: { value: '考研党' }
    })
    fireEvent.change(screen.getByPlaceholderText('描述一下你的使用场景...'), {
      target: { value: '正在准备研究生考试' }
    })
    
    fireEvent.click(screen.getByText('学生'))
    fireEvent.click(screen.getByText('创建'))
    
    expect(screen.getByText('考研党')).toBeInTheDocument()
  })
})
