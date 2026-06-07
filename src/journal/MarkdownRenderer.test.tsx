import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MarkdownRenderer } from './MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('should render plain text', () => {
    const { container } = render(<MarkdownRenderer content="Hello World" />)
    expect(container.textContent).toContain('Hello World')
  })

  it('should render bold text', () => {
    const { container } = render(<MarkdownRenderer content="**bold**" />)
    expect(container.innerHTML).toContain('<strong>bold</strong>')
  })

  it('should render headings', () => {
    const { container } = render(<MarkdownRenderer content="# Title" />)
    expect(container.innerHTML).toContain('<h1>Title</h1>')
  })

  it('should render code blocks', () => {
    const { container } = render(<MarkdownRenderer content={"```js\nconst x = 1;\n```"} />)
    expect(container.innerHTML).toContain('<pre>')
    expect(container.innerHTML).toContain('const x = 1;')
  })

  it('should render wiki links', () => {
    const { container } = render(<MarkdownRenderer content="[[页面名]]" />)
    expect(container.innerHTML).toContain('wiki-link')
    expect(container.innerHTML).toContain('页面名')
  })

  it('should render unordered lists', () => {
    const { container } = render(<MarkdownRenderer content={'- item 1\n- item 2'} />)
    expect(container.innerHTML).toContain('<ul>')
    expect(container.innerHTML).toContain('<li>item 1</li>')
    expect(container.innerHTML).toContain('<li>item 2</li>')
  })

  it('should escape HTML', () => {
    const { container } = render(<MarkdownRenderer content="<script>alert('xss')</script>" />)
    expect(container.innerHTML).not.toContain('<script>')
    expect(container.innerHTML).toContain('&lt;script&gt;')
  })
})
