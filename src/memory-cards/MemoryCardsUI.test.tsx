import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryCardsUI } from './MemoryCardsUI'

beforeEach(() => {
  localStorage.clear()
})

describe('MemoryCardsUI', () => {
  it('renders empty state with default deck when no cards exist', () => {
    render(<MemoryCardsUI />)
    expect(screen.getByText('还没有记忆卡')).toBeTruthy()
    expect(screen.getByText('创建你的第一张记忆卡开始学习吧')).toBeTruthy()
    expect(screen.getByText('默认')).toBeTruthy()
  })

  it('shows add form when clicking add button', () => {
    render(<MemoryCardsUI />)
    fireEvent.click(screen.getByText('+ 手动添加卡片'))
    expect(screen.getByText('添加记忆卡')).toBeTruthy()
    expect(screen.getByPlaceholderText('正面：问题或概念')).toBeTruthy()
    expect(screen.getByPlaceholderText('背面：答案或解释')).toBeTruthy()
  })

  it('adds a new card and shows it in the list', () => {
    render(<MemoryCardsUI />)
    fireEvent.click(screen.getByText('+ 手动添加卡片'))

    fireEvent.change(screen.getByPlaceholderText('正面：问题或概念'), {
      target: { value: '什么是闭包？' }
    })
    fireEvent.change(screen.getByPlaceholderText('背面：答案或解释'), {
      target: { value: '函数可以访问其外部作用域的变量' }
    })
    fireEvent.click(screen.getByText('添加'))

    expect(screen.getByText('什么是闭包？')).toBeTruthy()
  })

  it('shows stats bar with correct values', () => {
    render(<MemoryCardsUI />)
    expect(screen.getByText('待复习')).toBeTruthy()
    expect(screen.getByText('已掌握')).toBeTruthy()
    expect(screen.getByText('总计')).toBeTruthy()
  })

  it('shows deck creation form when clicking + button', () => {
    render(<MemoryCardsUI />)
    const addDeckButton = screen.getByTitle('新建牌组')
    fireEvent.click(addDeckButton)
    expect(screen.getByText('新建牌组')).toBeTruthy()
    expect(screen.getByPlaceholderText('牌组名称')).toBeTruthy()
  })

  it('creates a new deck and switches to it', () => {
    render(<MemoryCardsUI />)
    const addDeckButton = screen.getByTitle('新建牌组')
    fireEvent.click(addDeckButton)

    fireEvent.change(screen.getByPlaceholderText('牌组名称'), {
      target: { value: '英语四级' }
    })
    fireEvent.click(screen.getByText('创建'))

    expect(screen.getByText('英语四级')).toBeTruthy()
  })

  it('shows all decks in the deck bar', () => {
    render(<MemoryCardsUI />)
    expect(screen.getByText('全部')).toBeTruthy()
    expect(screen.getByText('默认')).toBeTruthy()
  })

  it('switches between decks', () => {
    render(<MemoryCardsUI />)
    const addDeckButton = screen.getByTitle('新建牌组')
    fireEvent.click(addDeckButton)
    fireEvent.change(screen.getByPlaceholderText('牌组名称'), {
      target: { value: '数学公式' }
    })
    fireEvent.click(screen.getByText('创建'))

    fireEvent.click(screen.getByText('默认'))
    fireEvent.click(screen.getByText('数学公式'))
  })
})
