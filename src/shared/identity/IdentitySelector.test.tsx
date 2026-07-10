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

const getIdentityCard = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) })

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

    const identityCard = getIdentityCard('考研党')

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

    const firstCard = getIdentityCard('考研党')
    const secondCard = getIdentityCard('职场新人')

    expect(secondCard).toHaveAttribute('aria-pressed', 'true')
    expect(firstCard).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(within(firstCard).getByText('考研党'))

    expect(firstCard).toHaveAttribute('aria-pressed', 'true')
    expect(secondCard).toHaveAttribute('aria-pressed', 'false')
  })

  it('edits an existing identity and keeps it active', () => {
    renderIdentitySelector()
    createIdentity('考研党', '准备研究生考试', ['学生'])

    fireEvent.click(screen.getByRole('button', { name: '编辑 考研党' }))

    expect(screen.getByRole('form', { name: '编辑身份' })).toBeInTheDocument()
    expect(screen.getByLabelText('身份名称')).toHaveValue('考研党')
    expect(screen.getByLabelText('描述（可选）')).toHaveValue('准备研究生考试')
    expect(screen.getByRole('button', { name: '学生' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(screen.getByLabelText('身份名称'), {
      target: { value: '冲刺备考党' }
    })
    fireEvent.change(screen.getByLabelText('描述（可选）'), {
      target: { value: '最后 30 天冲刺' }
    })
    fireEvent.click(screen.getByRole('button', { name: '创作者' }))
    fireEvent.click(screen.getByRole('button', { name: '保存' }))

    const updatedCard = getIdentityCard('冲刺备考党')
    expect(updatedCard).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('最后 30 天冲刺')).toBeInTheDocument()
    expect(screen.getByText('学生')).toBeInTheDocument()
    expect(screen.getByText('创作者')).toBeInTheDocument()
    expect(screen.queryByText('考研党')).not.toBeInTheDocument()
  })

  it('saves edits with Ctrl Enter and cancels editing with Escape', () => {
    renderIdentitySelector()
    createIdentity('职场新人', '适应新的工作节奏', ['打工人'])

    fireEvent.click(screen.getByRole('button', { name: '编辑 职场新人' }))
    fireEvent.change(screen.getByLabelText('身份名称'), {
      target: { value: '职场成长者' }
    })
    fireEvent.keyDown(screen.getByRole('form', { name: '编辑身份' }), {
      key: 'Enter',
      ctrlKey: true
    })

    expect(screen.getByText('职场成长者')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '编辑 职场成长者' }))
    fireEvent.change(screen.getByLabelText('身份名称'), {
      target: { value: '不应保存' }
    })
    fireEvent.keyDown(screen.getByRole('form', { name: '编辑身份' }), {
      key: 'Escape'
    })

    expect(screen.getByText('职场成长者')).toBeInTheDocument()
    expect(screen.queryByText('不应保存')).not.toBeInTheDocument()
  })

  it('asks for confirmation before deleting and can cancel deletion', () => {
    renderIdentitySelector()
    createIdentity('考研党', '准备研究生考试', ['学生'])

    fireEvent.click(screen.getByRole('button', { name: '删除 考研党' }))

    const dialog = screen.getByRole('alertdialog', { name: '删除身份' })
    expect(dialog).toHaveTextContent('确定删除“考研党”吗？')

    fireEvent.click(within(dialog).getByRole('button', { name: '取消删除' }))

    expect(screen.getByText('考研党')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog', { name: '删除身份' })).not.toBeInTheDocument()
  })

  it('deletes an identity after confirmation and keeps another identity active', () => {
    renderIdentitySelector()
    createIdentity('考研党', '准备研究生考试', ['学生'])
    createIdentity('职场新人', '适应新的工作节奏', ['打工人'])

    fireEvent.click(screen.getByRole('button', { name: '删除 职场新人' }))
    fireEvent.click(screen.getByRole('button', { name: '确认删除' }))

    expect(screen.queryByText('职场新人')).not.toBeInTheDocument()
    expect(getIdentityCard('考研党')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('已删除身份：职场新人')).toBeInTheDocument()
  })

  it('cancels create form with Escape', () => {
    renderIdentitySelector()
    openCreateForm()
    fireEvent.change(screen.getByLabelText('身份名称'), {
      target: { value: '临时身份' }
    })
    fireEvent.keyDown(screen.getByRole('form', { name: '创建新身份' }), {
      key: 'Escape'
    })

    expect(screen.queryByText('临时身份')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '创建新身份' })).toBeInTheDocument()
  })
})
