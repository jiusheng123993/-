import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { IdentityProvider } from './IdentityProvider'
import { IdentitySelector } from './IdentitySelector'

const renderIdentitySelector = () => render(
  <IdentityProvider>
    <IdentitySelector />
  </IdentityProvider>
)

const openCreateForm = () => {
  fireEvent.click(screen.getByRole('button', { name: '创建新身份' }))
}

const createIdentity = (name: string, description: string, tags: string[] = []) => {
  openCreateForm()
  fireEvent.change(screen.getByLabelText('身份名称'), {
    target: { value: name }
  })
  fireEvent.change(screen.getByLabelText('描述（可选）'), {
    target: { value: description }
  })
  tags.forEach(tag => fireEvent.click(screen.getByRole('button', { name: tag })))
  fireEvent.click(screen.getByRole('button', { name: '创建' }))
}

describe('IdentitySelector', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders identity list by default', () => {
    renderIdentitySelector()
    expect(screen.getByRole('heading', { name: '选择身份' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '创建新身份' })).toBeInTheDocument()
  })

  it('shows create form when create button is clicked', () => {
    renderIdentitySelector()
    openCreateForm()
    expect(screen.getByRole('form', { name: '创建新身份' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如：考研党、职场新人、全职妈妈')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('描述一下你的使用场景...')).toBeInTheDocument()
  })

  it('shows accessible validation feedback for empty identity name', () => {
    renderIdentitySelector()
    openCreateForm()

    const nameInput = screen.getByLabelText('身份名称')
    const createButton = screen.getByRole('button', { name: '创建' })

    expect(createButton).toBeDisabled()

    fireEvent.change(nameInput, {
      target: { value: '   ' }
    })
    fireEvent.blur(nameInput)

    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('请输入身份名称')
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')
    expect(nameInput).toHaveAttribute('aria-describedby', error.id)
    expect(createButton).toBeDisabled()
    fireEvent.click(createButton)
    expect(nameInput).toHaveValue('   ')
    expect(screen.queryByRole('button', { name: '创建新身份' })).not.toBeInTheDocument()
  })

  it('clears validation feedback when name becomes valid', () => {
    renderIdentitySelector()
    openCreateForm()

    const nameInput = screen.getByLabelText('身份名称')
    fireEvent.change(nameInput, {
      target: { value: '   ' }
    })
    fireEvent.blur(nameInput)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    fireEvent.change(nameInput, {
      target: { value: '考研党' }
    })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(nameInput).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByRole('button', { name: '创建' })).toBeEnabled()
  })

  it('accepts long name and description without truncating user input', () => {
    renderIdentitySelector()
    const longName = `长期目标身份-${'学习'.repeat(60)}`
    const longDescription = `用于验证超长输入-${'保持专注并持续复盘。'.repeat(80)}`

    createIdentity(longName, longDescription)

    expect(screen.getByText(longName)).toBeInTheDocument()
    expect(screen.getByText(longDescription)).toBeInTheDocument()
  })

  it('selects multiple tags and removes a selected tag when clicked again', () => {
    renderIdentitySelector()
    openCreateForm()

    const studentButton = screen.getByRole('button', { name: '学生' })
    const workerButton = screen.getByRole('button', { name: '打工人' })

    fireEvent.click(studentButton)
    fireEvent.click(workerButton)
    fireEvent.click(studentButton)

    expect(studentButton).toHaveAttribute('aria-pressed', 'false')
    expect(workerButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('creates identity and marks it as the active identity', () => {
    renderIdentitySelector()
    createIdentity('考研党', '正在准备研究生考试', ['学生'])

    const identityCard = screen.getByRole('button', { name: /考研党/ })

    expect(screen.getByText('考研党')).toBeInTheDocument()
    expect(screen.getByText('正在准备研究生考试')).toBeInTheDocument()
    expect(screen.getByText('学生')).toBeInTheDocument()
    expect(identityCard).toHaveAttribute('aria-pressed', 'true')
    expect(identityCard).toHaveClass('identity-card-active')
    expect(screen.queryByPlaceholderText('例如：考研党、职场新人、全职妈妈')).not.toBeInTheDocument()
  })

  it('switches active identity when another identity is clicked', () => {
    renderIdentitySelector()
    createIdentity('考研党', '准备研究生考试', ['学生'])
    createIdentity('职场新人', '适应新的工作节奏', ['打工人'])

    const firstCard = screen.getByRole('button', { name: /考研党/ })
    const secondCard = screen.getByRole('button', { name: /职场新人/ })

    expect(secondCard).toHaveAttribute('aria-pressed', 'true')
    expect(firstCard).toHaveAttribute('aria-pressed', '