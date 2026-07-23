import create from 'zustand';
import Taro from '@tarojs/taro';
import { clearSubscribeStatus } from '../services/subscribeService';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';
import { getStorageArray } from '../utils/storage';

const memoryStore = new MiniProgramMemoryBodyStore();

const NOTIFICATION_KEY = 'xhh_notification_settings';
const PET_DATA_KEY = 'pet_data';
const CHECKIN_DATA_KEY = 'checkin_data';

export interface NotificationSettings {
  checkinReminder: boolean;
  vaccineReminder: boolean;
  healthAlert: boolean;
}

const DEFAULT_NOTIFICATION: NotificationSettings = {
  checkinReminder: true,
  vaccineReminder: true,
  healthAlert: true,
};

interface SettingsState {
  notification: NotificationSettings;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => void;
  updateNotification: (key: keyof NotificationSettings, value: boolean) => void;
  clearCache: () => void;
  clearCheckinData: () => void;
  clearPetData: () => void;
  clearAllData: () => void;
  exportData: () => string;
}

function loadNotificationFromStorage(): NotificationSettings {
  try {
    const raw = Taro.getStorageSync(NOTIFICATION_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION };
    const parsed = JSON.parse(raw);
    return {
      checkinReminder: parsed.checkinReminder ?? true,
      vaccineReminder: parsed.vaccineReminder ?? true,
      healthAlert: parsed.healthAlert ?? true,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION };
  }
}

function saveNotificationToStorage(settings: NotificationSettings): void {
  try {
    Taro.setStorageSync(NOTIFICATION_KEY, JSON.stringify(settings));
  } catch {}
}

function clearStorageKey(key: string): void {
  try {
    Taro.removeStorageSync(key);
  } catch {}
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notification: { ...DEFAULT_NOTIFICATION },
  isLoading: false,
  error: null,

  loadSettings: () => {
    const settings = loadNotificationFromStorage();
    set({ notification: settings });
  },

  updateNotification: (key, value) => {
    const current = get().notification;
    const updated = { ...current, [key]: value };
    saveNotificationToStorage(updated);
    set({ notification: updated });
  },

  clearCache: () => {
    set({ isLoading: true });
    try {
      Taro.clearStorageSync();
      set({ notification: { ...DEFAULT_NOTIFICATION }, isLoading: false });
    } catch {
      set({ isLoading: false, error: '清除缓存失败' });
    }
  },

  clearCheckinData: () => {
    set({ isLoading: true });
    try {
      clearStorageKey(CHECKIN_DATA_KEY);
      memoryStore.clearHealthEntries();
      set({ isLoading: false });
    } catch {
      set({ isLoading: false, error: '清除打卡记录失败' });
    }
  },

  clearPetData: () => {
    set({ isLoading: true });
    try {
      clearStorageKey(PET_DATA_KEY);
      set({ isLoading: false });
    } catch {
      set({ isLoading: false, error: '清除宠物数据失败' });
    }
  },

  clearAllData: () => {
    set({ isLoading: true });
    try {
      memoryStore.clearAll();
      clearStorageKey(PET_DATA_KEY);
      clearStorageKey(CHECKIN_DATA_KEY);
      clearSubscribeStatus();
      set({ notification: { ...DEFAULT_NOTIFICATION }, isLoading: false });
    } catch {
      set({ isLoading: false, error: '清除所有数据失败' });
    }
  },

  exportData: () => {
    const checkinData = getStorageArray(CHECKIN_DATA_KEY);
    const petData = getStorageArray(PET_DATA_KEY);

    const exportPayload = {
      exportDate: new Date().toISOString(),
      version: '2.0.0',
      data: {
        checkinData,
        petData,
        notification: get().notification,
      },
    };

    return JSON.stringify(exportPayload, null, 2);
  },
}));
