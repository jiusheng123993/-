// 星寰海 v2.0 - memory-body 本地优先同步策略

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

/** 同步操作类型 */
export type SyncOperation = 'push' | 'pull' | 'merge';

/** 待同步项接口 */
export interface PendingSyncItem<T> {
  id: string;
  operation: SyncOperation;
  data: T;
  createdAt: Date;
  synced: boolean;
  retryCount: number;
}

/** 同步结果接口 */
export interface SyncResult {
  success: boolean;
  status: SyncStatus;
  pushed: number;
  pulled: number;
  errors: string[];
  duration: number;
}

/** LocalFirstSync 类 - 本地优先的同步策略 */
export class LocalFirstSync {
  private pendingQueue: Map<string, PendingSyncItem<unknown>> = new Map();
  private isOnline: boolean = true;
  private lastSyncTime: Date | null = null;
  private syncInProgress: boolean = false;

  constructor() {
    // 初始化时检查网络状态
    this.checkNetworkStatus();
  }

  /** 检查网络状态 */
  async checkNetworkStatus(): Promise<boolean> {
    // 实际项目中应使用 Taro.getNetworkType
    // 这里简化为始终在线
    this.isOnline = true;
    return this.isOnline;
  }

  /** 添加待同步项 */
  addPendingItem<T>(item: Omit<PendingSyncItem<T>, 'createdAt' | 'synced' | 'retryCount'>): void {
    const fullItem: PendingSyncItem<T> = {
      ...item,
      createdAt: new Date(),
      synced: false,
      retryCount: 0,
    };

    this.pendingQueue.set(fullItem.id, fullItem as PendingSyncItem<unknown>);
  }

  /** 批量添加待同步项 */
  addPendingItems<T>(items: Array<Omit<PendingSyncItem<T>, 'createdAt' | 'synced' | 'retryCount'>>): void {
    for (const item of items) {
      this.addPendingItem(item);
    }
  }

  /** 执行同步 */
  async sync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return {
        success: false,
        status: 'syncing',
        pushed: 0,
        pulled: 0,
        errors: ['同步正在进行中'],
        duration: 0,
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        status: 'offline',
        pushed: 0,
        pulled: 0,
        errors: ['网络不可用'],
        duration: 0,
      };
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    const errors: string[] = [];
    let pushed = 0;
    let pulled = 0;

    try {
      // 1. 推送本地变更到云端
      const pushResult = await this.pushChanges();
      pushed = pushResult.count;
      errors.push(...pushResult.errors);

      // 2. 拉取远程变更
      const pullResult = await this.pullChanges();
      pulled = pullResult.count;
      errors.push(...pullResult.errors);

      // 3. 合并冲突（如果有）
      if (pushResult.conflicts || pullResult.conflicts) {
        const mergeResult = await this.mergeConflicts(
          (pushResult.conflicts || []).concat(pullResult.conflicts || [])
        );
        errors.push(...mergeResult.errors);
      }

      // 4. 更新同步状态
      this.lastSyncTime = new Date();
      this.clearSyncedItems();

      this.syncInProgress = false;

      return {
        success: errors.length === 0,
        status: errors.length === 0 ? 'success' : 'error',
        pushed,
        pulled,
        errors,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      this.syncInProgress = false;
      return {
        success: false,
        status: 'error',
        pushed,
        pulled,
        errors: [`同步失败: ${error instanceof Error ? error.message : String(error)}`],
        duration: Date.now() - startTime,
      };
    }
  }

  /** 推送本地变更 */
  private async pushChanges(): Promise<{ count: number; errors: string[]; conflicts?: any[] }> {
    const pendingItems = Array.from(this.pendingQueue.values())
      .filter(item => !item.synced && item.operation === 'push');

    const errors: string[] = [];
    let count = 0;

    for (const item of pendingItems) {
      try {
        // 模拟推送到云端
        await this.simulatePush(item);
        item.synced = true;
        count++;
      } catch (error) {
        errors.push(`推送失败: ${item.id}`);
        item.retryCount++;
        if (item.retryCount >= 3) {
          errors.push(`超过最大重试次数，放弃: ${item.id}`);
        }
      }
    }

    return { count, errors };
  }

  /** 拉取远程变更 */
  private async pullChanges(): Promise<{ count: number; errors: string[]; conflicts?: any[] }> {
    // 模拟拉取远程数据
    const remoteData = await this.simulatePull();

    return {
      count: remoteData.length,
      errors: [],
      conflicts: [],
    };
  }

  /** 合并冲突 */
  private async mergeConflicts(conflicts: any[]): Promise<{ errors: string[] }> {
    const errors: string[] = [];

    for (const conflict of conflicts) {
      try {
        // 简单的最后写入获胜策略
        await this.resolveConflict(conflict);
      } catch (error) {
        errors.push(`冲突解决失败: ${conflict.id}`);
      }
    }

    return { errors };
  }

  /** 模拟推送 */
  private async simulatePush(_item: PendingSyncItem<unknown>): Promise<void> {
    // 实际项目中应调用云端API
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  /** 模拟拉取 */
  private async simulatePull(): Promise<any[]> {
    // 实际项目中应调用云端API
    return new Promise((resolve) => {
      setTimeout(() => resolve([]), 100);
    });
  }

  /** 解决冲突 */
  private async resolveConflict(_conflict: any): Promise<void> {
    // 实际项目中应有更复杂的冲突解决逻辑
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 50);
    });
  }

  /** 清除已同步的项目 */
  private clearSyncedItems(): void {
    for (const [id, item] of this.pendingQueue) {
      if (item.synced) {
        this.pendingQueue.delete(id);
      }
    }
  }

  /** 获取待同步项数量 */
  getPendingCount(): number {
    return Array.from(this.pendingQueue.values()).filter(item => !item.synced).length;
  }

  /** 获取所有待同步项 */
  getAllPendingItems(): PendingSyncItem<unknown>[] {
    return Array.from(this.pendingQueue.values());
  }

  /** 获取同步状态 */
  getSyncStatus(): SyncStatus {
    if (this.syncInProgress) return 'syncing';
    if (!this.isOnline) return 'offline';
    if (this.lastSyncTime) return 'idle';
    return 'idle';
  }

  /** 获取上次同步时间 */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /** 手动设置网络状态 */
  setNetworkStatus(online: boolean): void {
    this.isOnline = online;
  }

  /** 重试失败的同步项 */
  async retryFailedItems(): Promise<number> {
    const failedItems = Array.from(this.pendingQueue.values())
      .filter(item => !item.synced && item.retryCount > 0 && item.retryCount < 3);

    let successCount = 0;

    for (const item of failedItems) {
      try {
        await this.simulatePush(item);
        item.synced = true;
        successCount++;
      } catch {
        item.retryCount++;
      }
    }

    return successCount;
  }

  /** 清除所有数据 */
  clearAll(): void {
    this.pendingQueue.clear();
    this.lastSyncTime = null;
    this.syncInProgress = false;
  }
}
