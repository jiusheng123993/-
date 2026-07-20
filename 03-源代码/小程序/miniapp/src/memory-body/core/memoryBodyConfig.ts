// 星寰海 v2.0 - memory-body 配置管理
import { getStorage, setStorage, setEncryptionEnabled, setStorageUserId } from '../../utils/storage';

/** 默认配置常量 */
export const DEFAULT_CONFIG = {
  // 存储限制
  maxMoodEntries: 500,
  maxEmergencySessions: 100,
  maxTreeholePosts: 300,
  maxPatterns: 20,

  // 同步间隔（毫秒）
  syncInterval: 30 * 60 * 1000, // 30分钟
  syncRetryDelay: 5 * 60 * 1000, // 5分钟
  syncBatchSize: 50,

  // 衰减参数
  decayRatePerWeek: 0.9, // 每周衰减率
  minRelevanceScore: 0.1, // 最低相关性分数

  // 推送频率控制
  maxDailyPushes: 2,
  pushCooldownHours: 4,

  // 高危检测
  crisisCheckEnabled: true,
  crisisKeywordsUpdateInterval: 7 * 24 * 60 * 60 * 1000, // 每周更新

  // 隐私保护
  enableLocalFirst: true,
  enableEncryption: true,
  autoSyncToCloud: false,
} as const;

/** 配置键名 */
const STORAGE_KEYS = {
  MEMORY_BODY_CONFIG: 'memory_body_config',
};

/** memory-body 配置接口 */
export interface MemoryBodyConfig {
  // 用户ID
  userId: string;

  // 存储限制
  maxMoodEntries: number;
  maxEmergencySessions: number;
  maxTreeholePosts: number;
  maxPatterns: number;

  // 同步设置
  syncInterval: number;
  syncRetryDelay: number;
  syncBatchSize: number;
  lastSyncTime?: number;

  // 衰减设置
  decayRatePerWeek: number;
  minRelevanceScore: number;

  // 推送设置
  maxDailyPushes: number;
  pushCooldownHours: number;
  todayPushCount: number;
  lastPushTime?: number;

  // 安全设置
  crisisCheckEnabled: boolean;
  enableLocalFirst: boolean;
  enableEncryption: boolean;
  autoSyncToCloud: boolean;

  // 元数据
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

/** 加载配置并同步加密设置到 storage 层 */
export function loadConfig(): MemoryBodyConfig {
  try {
    const stored = getStorage<Partial<MemoryBodyConfig>>(STORAGE_KEYS.MEMORY_BODY_CONFIG);
    if (!stored) {
      return createDefaultConfig();
    }

    const config: MemoryBodyConfig = {
      ...createDefaultConfig(),
      ...stored,
      createdAt: stored.createdAt ? new Date(stored.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    syncEncryptionToStorage(config);
    return config;
  } catch (error) {
    return createDefaultConfig();
  }
}

/** 保存配置 */
export function saveConfig(config: MemoryBodyConfig): void {
  try {
    const toSave = {
      ...config,
      updatedAt: new Date(),
    };
    setStorage(STORAGE_KEYS.MEMORY_BODY_CONFIG, toSave);
  } catch (error) {
  }
}

/** 创建默认配置 */
function createDefaultConfig(): MemoryBodyConfig {
  return {
    userId: '',
    maxMoodEntries: DEFAULT_CONFIG.maxMoodEntries,
    maxEmergencySessions: DEFAULT_CONFIG.maxEmergencySessions,
    maxTreeholePosts: DEFAULT_CONFIG.maxTreeholePosts,
    maxPatterns: DEFAULT_CONFIG.maxPatterns,
    syncInterval: DEFAULT_CONFIG.syncInterval,
    syncRetryDelay: DEFAULT_CONFIG.syncRetryDelay,
    syncBatchSize: DEFAULT_CONFIG.syncBatchSize,
    decayRatePerWeek: DEFAULT_CONFIG.decayRatePerWeek,
    minRelevanceScore: DEFAULT_CONFIG.minRelevanceScore,
    maxDailyPushes: DEFAULT_CONFIG.maxDailyPushes,
    pushCooldownHours: DEFAULT_CONFIG.pushCooldownHours,
    todayPushCount: 0,
    crisisCheckEnabled: DEFAULT_CONFIG.crisisCheckEnabled,
    enableLocalFirst: DEFAULT_CONFIG.enableLocalFirst,
    enableEncryption: DEFAULT_CONFIG.enableEncryption,
    autoSyncToCloud: DEFAULT_CONFIG.autoSyncToCloud,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
}

/** 更新部分配置 */
export function updateConfig(partial: Partial<MemoryBodyConfig>): MemoryBodyConfig {
  const current = loadConfig();
  const updated = { ...current, ...partial, updatedAt: new Date() };
  saveConfig(updated);
  syncEncryptionToStorage(updated);
  return updated;
}

/** 重置为默认配置 */
export function resetConfig(): MemoryBodyConfig {
  const defaultConfig = createDefaultConfig();
  saveConfig(defaultConfig);
  syncEncryptionToStorage(defaultConfig);
  return defaultConfig;
}

function syncEncryptionToStorage(config: MemoryBodyConfig): void {
  setEncryptionEnabled(config.enableEncryption);
  if (config.userId) {
    setStorageUserId(config.userId);
  }
}
