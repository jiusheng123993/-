import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { useMoodStore } from './moodStore';
import { useTreeholeStore } from './treeholeStore';
import { hasAcceptedSubscribe, clearSubscribeStatus } from '../services/subscribeService';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';
import { getStorageArray } from '../utils/storage';

const memoryStore = new MiniProgramMemoryBodyStore();

const SETTINGS_KEY = 'user_settings';
const EMERGENCY_SESSIONS_KEY = 'emergency_sessions';
const TREEHOLE_POSTS_KEY = 'treehole_posts';
const TREEHOLE_REPLIES_KEY = 'treehole_replies';

interface NotificationSettings {
  enabled: boolean;
  followupTime: string;
}

interface SettingsState {
  notification: NotificationSettings;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  clearMoodData: () => void;
  clearEmergencyData: () => void;
  clearTreeholeData: () => void;
  clearAllData: () => void;
  exportData: () => string;
}

function loadFromStorage(): NotificationSettings {
  try {
    const raw = Taro.getStorageSync(SETTINGS_KEY);
    if (!raw) {
      return {
        enabled: hasAcceptedSubscribe('FOLLOWUP_TEMPLATE_ID_PLACEHOLDER'),
        followupTime: '09:00',
      };
    }
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? false,
      followupTime: parsed.followupTime ?? '09:00',
    };
  } catch {
    return {
      enabled: false,
      followupTime: '09:00',
    };
  }
}

function saveToStorage(settings: NotificationSettings): void {
  try {
    Taro.setStorageSync(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('[SettingsStore] 保存设置失败:', err);
  }
}

function clearStorageKey(key: string): void {
  try {
    Taro.removeStorageSync(key);
  } catch (err) {
    console.error(`[SettingsStore] 清除 ${key} 失败:`, err);
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notification: {
    enabled: false,
    followupTime: '09:00',
  },
  isLoading: false,
  error: null,

  loadSettings: () => {
    const settings = loadFromStorage();
    set({ notification: settings });
  },

  updateNotificationSettings: (updates) => {
    const current = get().notification;
    const newSettings = { ...current, ...updates };
    saveToStorage(newSettings);
    set({ notification: newSettings });
  },

  clearMoodData: () => {
    set({ isLoading: true });
    try {
      useMoodStore.getState().clearEntries();
      memoryStore.clearMoodEntries();
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: '清除情绪记录失败' });
    }
  },

  clearEmergencyData: () => {
    set({ isLoading: true });
    try {
      clearStorageKey(EMERGENCY_SESSIONS_KEY);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: '清除急救记录失败' });
    }
  },

  clearTreeholeData: () => {
    set({ isLoading: true });
    try {
      clearStorageKey(TREEHOLE_POSTS_KEY);
      clearStorageKey(TREEHOLE_REPLIES_KEY);
      useTreeholeStore.getState().clearAllData();
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: '清除树洞记录失败' });
    }
  },

  clearAllData: () => {
    set({ isLoading: true });
    try {
      useMoodStore.getState().clearEntries();
      memoryStore.clearAll();
      clearStorageKey(EMERGENCY_SESSIONS_KEY);
      clearStorageKey(TREEHOLE_POSTS_KEY);
      clearStorageKey(TREEHOLE_REPLIES_KEY);
      useTreeholeStore.getState().clearAllData();
      clearSubscribeStatus();
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: '清除所有数据失败' });
    }
  },

  exportData: () => {
    const moodEntries = useMoodStore.getState().entries;
    const emergencySessions = getStorageArray(EMERGENCY_SESSIONS_KEY);
    const treeholePosts = getStorageArray(TREEHOLE_POSTS_KEY);
    const treeholeReplies = getStorageArray(TREEHOLE_REPLIES_KEY);
    const outreachMessages = getStorageArray('outreach_messages');

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      data: {
        moodEntries: moodEntries.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
        emergencySessions,
        treeholePosts,
        treeholeReplies,
        outreachMessages,
        settings: get().notification,
      },
    };

    return JSON.stringify(exportData, null, 2);
  },
}));