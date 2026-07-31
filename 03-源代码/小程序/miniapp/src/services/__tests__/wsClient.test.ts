/**
 * wsClient 单元测试
 *
 * 覆盖：
 *   1. connect - URL 构造（ws 协议 + token）、幂等连接
 *   2. 事件分发 - data.event / data.type 提取、pong 忽略、handler 退订
 *   3. 心跳 - 30s 定时发送 ping
 *   4. 重连 - onClose 后指数退避重连、主动 disconnect 不重连
 *
 * 说明：
 *   - @tarojs/taro 已由 test/setup.ts 全局 mock，connectSocket 在此动态挂载
 *   - Taro.connectSocket 返回 Promise<SocketTask>，测试需 flush microtask 后触发回调
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Taro from '@tarojs/taro';
import { CONFIG } from '../../config';
import { wsClient, HEARTBEAT_INTERVAL, RECONNECT_BASE_DELAY } from '../wsClient';

vi.mock('../../config', () => ({
  CONFIG: {
    API_BASE_URL: 'http://api.test.com',
    USE_MOCK: false,
    STORAGE_KEYS: { TOKEN: 'xhh_token', USER: 'xhh_user', REFRESH_TOKEN: 'xhh_refresh_token' },
  },
}));

/** 创建可控的 SocketTask mock */
function createMockSocketTask() {
  return {
    onOpen: vi.fn(),
    onMessage: vi.fn(),
    onClose: vi.fn(),
    onError: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  };
}

type MockTask = ReturnType<typeof createMockSocketTask>;

/** 触发 task 的 onOpen 回调 */
function fireOpen(task: MockTask) {
  task.onOpen.mock.calls[0]?.[0]?.();
}

/** 触发 task 的 onMessage 回调 */
function fireMessage(task: MockTask, data: unknown) {
  task.onMessage.mock.calls[0]?.[0]?.({ data: JSON.stringify(data) });
}

/** 触发 task 的 onClose 回调 */
function fireClose(task: MockTask) {
  task.onClose.mock.calls[0]?.[0]?.();
}

/** flush Promise microtask（connectSocket 为异步返回） */
async function flushAsync() {
  await Promise.resolve();
  await Promise.resolve();
}

/** 挂载并返回 connectSocket mock（setup.ts 的 Taro mock 未提供该方法） */
function mountConnectSocket(task: MockTask) {
  const connectSocket = vi.fn().mockResolvedValue(task);
  (Taro as unknown as { connectSocket: typeof connectSocket }).connectSocket = connectSocket;
  return connectSocket;
}

describe('wsClient', () => {
  let task: MockTask;
  let connectSocket: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    wsClient.disconnect();
    vi.clearAllMocks();
    task = createMockSocketTask();
    connectSocket = mountConnectSocket(task);
  });

  afterEach(() => {
    vi.useRealTimers();
    wsClient.disconnect();
  });

  describe('connect', () => {
    it('拼接 WS 地址并携带 token 建立连接', () => {
      wsClient.connect('test-token');

      expect(connectSocket).toHaveBeenCalledTimes(1);
      expect(connectSocket).toHaveBeenCalledWith({
        url: 'ws://api.test.com/ws?token=test-token',
      });
    });

    it('幂等：已连接时重复 connect 不重复建连', async () => {
      wsClient.connect('token-1');
      await flushAsync();
      fireOpen(task);
      expect(wsClient.connected).toBe(true);

      wsClient.connect('token-2');
      expect(connectSocket).toHaveBeenCalledTimes(1);
    });

    it('空 token 不建连', () => {
      wsClient.connect('');
      expect(connectSocket).not.toHaveBeenCalled();
    });
  });

  describe('事件分发', () => {
    it('按 data.event 分发事件并携带负载', async () => {
      const handler = vi.fn();
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      wsClient.on('memoir_status', handler);

      fireMessage(task, {
        type: 'message',
        data: { event: 'memoir_status', data: { type: 'memoir_completed', taskId: 't-001' } },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'memoir_completed', taskId: 't-001' }),
      );
    });

    it('无 event 时按 data.type 分发（支付事件）', async () => {
      const handler = vi.fn();
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      wsClient.on('payment_success', handler);

      fireMessage(task, {
        type: 'message',
        data: { type: 'payment_success', data: { product_type: 'memoir', order_id: 'o-1' } },
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ order_id: 'o-1' }));
    });

    it('pong 心跳响应不触发事件', async () => {
      const handler = vi.fn();
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      wsClient.on('memoir_status', handler);

      fireMessage(task, { type: 'pong' });

      expect(handler).not.toHaveBeenCalled();
    });

    it('on 返回的退订函数可解除订阅', async () => {
      const handler = vi.fn();
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      const unsubscribe = wsClient.on('memoir_status', handler);
      unsubscribe();

      fireMessage(task, {
        type: 'message',
        data: { event: 'memoir_status', data: { type: 'memoir_completed', taskId: 't-1' } },
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('心跳', () => {
    it('连接建立后每 30s 发送 ping', async () => {
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);

      vi.advanceTimersByTime(HEARTBEAT_INTERVAL);
      expect(task.send).toHaveBeenCalledWith({ data: JSON.stringify({ type: 'ping' }) });

      vi.advanceTimersByTime(HEARTBEAT_INTERVAL);
      expect(task.send).toHaveBeenCalledTimes(2);
    });

    it('断开后停止心跳', async () => {
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      fireClose(task);

      vi.advanceTimersByTime(HEARTBEAT_INTERVAL * 3);
      // 仅重连计时器触发，不产生 ping
      expect(task.send).not.toHaveBeenCalled();
    });
  });

  describe('重连', () => {
    it('连接关闭后按基础延迟重连', async () => {
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      fireClose(task);
      expect(wsClient.connected).toBe(false);

      vi.advanceTimersByTime(RECONNECT_BASE_DELAY);
      expect(connectSocket).toHaveBeenCalledTimes(2);
    });

    it('重连成功后退避重置（成功连接后延迟恢复为 1s）', async () => {
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      fireClose(task);

      // 第一次断开 → 1s 后重连
      vi.advanceTimersByTime(RECONNECT_BASE_DELAY);
      expect(connectSocket).toHaveBeenCalledTimes(2);

      // 触发第 2 次连接的 onOpen，模拟重连成功 → 退避重置
      await flushAsync();
      fireOpen(task);
      fireClose(task);

      // 重连成功后再断开 → 仍按基础延迟 1s 重连
      vi.advanceTimersByTime(RECONNECT_BASE_DELAY);
      expect(connectSocket).toHaveBeenCalledTimes(3);
    });

    it('主动 disconnect 后不再重连', async () => {
      wsClient.connect('token');
      await flushAsync();
      fireOpen(task);
      wsClient.disconnect();

      // 模拟底层关闭事件（disconnect 后不应重连）
      fireClose(task);
      vi.advanceTimersByTime(RECONNECT_BASE_DELAY * 5);

      expect(connectSocket).toHaveBeenCalledTimes(1);
    });
  });

  describe('连接地址协议', () => {
    it('基础地址为 HTTP（HTTP→WS 转换已在首用例验证）', () => {
      expect(CONFIG.API_BASE_URL.startsWith('http://')).toBe(true);
    });
  });
});
