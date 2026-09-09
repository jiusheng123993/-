/**
 * 前端 agentService 回归测试（2026-09 P2-4 修复）
 *
 * 背景：服务端 /api/agent/chat 在守卫命中（blocked）时返回**普通 JSON**（非 SSE，无 event:/data: 行）。
 * 前端 agentChat 按 \n\n 切分找 event:/data: 行，命中时产出 0 事件，导致"危机/热线"回复被吞。
 * 修复后：0 事件且 buffer 为 blocked JSON 时，转成 done 事件上屏。
 */
import { describe, it, expect, vi } from 'vitest'

// —— mock 顶层依赖 ——
vi.mock('@tarojs/taro', () => ({
  default: {
    request: vi.fn(),
    arrayBufferToBase64: (b: ArrayBuffer) => '',
  },
}))
vi.mock('../../config', () => ({ CONFIG: { API_BASE_URL: 'http://test' } }))
vi.mock('../../utils/storage', () => ({ storage: { getToken: () => 'test-token' } }))
vi.mock('../../logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }))

import Taro from '@tarojs/taro'
import { agentChat } from '../agentService'

describe('agentChat 服务端 blocked 兜底（P2-4）', () => {
  /** 投喂单个响应体 chunk，收集 agentChat 产出的全部事件 */
  async function collectEvents(chunk: string) {
    const requestMock = Taro.request as unknown as ReturnType<typeof vi.fn>
    const requestTask = {
      onChunkReceived: (cb: (res: { data: string | ArrayBuffer }) => void) => {
        cb({ data: chunk })
      },
      then: (cb: (v: unknown) => void) => { cb({}); return Promise.resolve() },
      catch: () => {},
    }
    requestMock.mockReturnValue(requestTask)
    const events: Array<{ type: string; data: Record<string, unknown> }> = []
    for await (const ev of agentChat({ message: '测试' })) {
      events.push(ev as unknown as { type: string; data: Record<string, unknown> })
    }
    return events
  }

  it('服务端返回 blocked 普通 JSON（无 SSE 事件行）时，yield done 事件上屏 reply（含热线）', async () => {
    const events = await collectEvents(JSON.stringify({
      success: true,
      data: { reply: '请拨打24小时心理援助热线：400-161-9995', blocked: true },
    }))
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('done')
    expect(String(events[0].data.content)).toContain('400-161-9995')
    expect(events[0].data.blocked).toBe(true)
  })

  it('负向：非 blocked JSON（blocked:false）→ 兜底不触发，不 yield done', async () => {
    const events = await collectEvents(JSON.stringify({
      success: true,
      data: { reply: '这是一条普通回复', blocked: false },
    }))
    expect(events).toHaveLength(0)
  })

  it('负向：SSE 已产事件 → 兜底不触发（不追加第二个 done）', async () => {
    const events = await collectEvents(`event: done\ndata: {"content":"正常回复","iterations":2}\n\n`)
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('done')
    expect(String(events[0].data.content)).toBe('正常回复')
    expect(events[0].data.blocked).toBeUndefined()
  })
})
