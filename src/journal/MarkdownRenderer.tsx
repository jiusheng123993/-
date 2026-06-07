import { useMemo } from 'react'

interface MarkdownRendererProps {
  content: string
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderMarkdown(text: string): string {
  const codeBlocks: string[] = []
  let html = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const idx = codeBlocks.length
    codeBlocks.push(`<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`)
    return `\x00CODEBLOCK${idx}\x00`
  })

  html = escapeHtml(html)

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link" data-target="$1">🔗 $1</span>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;" />')

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
  html = html.replace(/^---$/gm, '<hr />')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  const lines = html.split('\n')
  const resultLines: string[] = []
  let inList = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '')
    const liMatch = line.match(/^- (.+)$/)
    if (liMatch) {
      if (!inList) {
        resultLines.push('<ul>')
        inList = true
      }
      resultLines.push(`<li>${liMatch[1]}</li>`)
    } else {
      if (inList) {
        resultLines.push('</ul>')
        inList = false
      }
      resultLines.push(line)
    }
  }
  if (inList) {
    resultLines.push('</ul>')
  }
  html = resultLines.join('\n')

  const paragraphs = html.split(/\n\n+/)
  html = paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<pre') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
      return p
    }
    return `<p>${p.replace(/\n/g, '<br />')}</p>`
  }).join('\n')

  // eslint-disable-next-line no-control-regex
html = html.replace(/\x00CODEBLOCK(\d+)\x00/g, (_match, idx) => {
    return codeBlocks[parseInt(idx)] || ''
  })

  return html
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <div
      className="markdown-renderer"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
