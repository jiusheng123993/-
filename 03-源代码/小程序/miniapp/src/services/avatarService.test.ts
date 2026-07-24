import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 确保 mock 对象在 vi.mock 工厂执行时可用
const { mockTaro, eventCenter } = vi.hoisted(() => {
  const eventCenter = { on: vi.fn(), off: vi.fn(), trigger: vi.fn() };
  const mockTaro = {
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    showToast: vi.fn(),
    showModal: vi.fn(),
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    switchTab: vi.fn(),
    eventCenter,
  };
  return { mockTaro, eventCenter };
});

vi.mock('@tarojs/taro', () => ({
  default: mockTaro,
  eventCenter,
}));

// 模拟依赖模块
vi.mock('../engines/petAvatar/svgRenderer', () => ({
  getPetFaceDataUri: vi.fn(() => 'data:image/svg+xml,mock'),
}));

vi.mock('../engines/petAvatar/expressionEngine', () => ({
  calculateExpression: vi.fn(() => ({ expression: 'happy', accessories: [] })),
}));

vi.mock('../engines/petAvatar/diaryEngine', () => ({
  generateDiaryForToday: vi.fn(() => 'mock diary'),
}));

vi.mock('../engines/petAvatar/seedreamAdapter', () => ({
  seedreamAdapter: {
    generatePetImage: vi.fn(),
  },
}));

vi.mock('./api', () => ({
  api: {
    upload: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../config', () => ({
  CONFIG: {
    apiBaseUrl: 'https://mock-api.example.com',
  },
}));

import {
  getPhotoGenerationCount,
  canGeneratePhoto,
  incrementPhotoGenerationCount,
  get3DGenerationCount,
  canGenerate3D,
  increment3DGenerationCount,
} from './avatarService';
import { AVATAR_PHOTO_FREE_COUNT, AVATAR_3D_MONTHLY_LIMIT } from '../constants';

beforeEach(() => {
  vi.clearAllMocks();
  mockTaro.getStorageSync.mockReturnValue(0);
  mockTaro.setStorageSync.mockImplementation(() => {});
});

describe('avatarService - 配额管理（前端缓存）', () => {
  describe('getPhotoGenerationCount', () => {
    it('未存储时应返回 0', () => {
      mockTaro.getStorageSync.mockReturnValue(null);
      expect(getPhotoGenerationCount()).toBe(0);
    });

    it('存储为数字时应返回对应值', () => {
      mockTaro.getStorageSync.mockReturnValue(3);
      expect(getPhotoGenerationCount()).toBe(3);
    });

    it('存储为非数字时应返回 0', () => {
      mockTaro.getStorageSync.mockReturnValue('invalid');
      expect(getPhotoGenerationCount()).toBe(0);
    });
  });

  describe('canGeneratePhoto', () => {
    it('会员应始终返回 true', () => {
      mockTaro.getStorageSync.mockReturnValue(999);
      expect(canGeneratePhoto(true)).toBe(true);
    });

    it('免费用户未达上限应返回 true', () => {
      mockTaro.getStorageSync.mockReturnValue(0);
      expect(canGeneratePhoto(false)).toBe(true);
    });

    it('免费用户达到上限应返回 false', () => {
      mockTaro.getStorageSync.mockReturnValue(AVATAR_PHOTO_FREE_COUNT);
      expect(canGeneratePhoto(false)).toBe(false);
    });

    it('免费用户超过上限应返回 false', () => {
      mockTaro.getStorageSync.mockReturnValue(AVATAR_PHOTO_FREE_COUNT + 5);
      expect(canGeneratePhoto(false)).toBe(false);
    });
  });

  describe('incrementPhotoGenerationCount', () => {
    it('应将计数+1 并写入存储', () => {
      mockTaro.getStorageSync.mockReturnValue(2);
      incrementPhotoGenerationCount();
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_avatar_photo_count', 3);
    });

    it('未存储时应从 0 开始+1', () => {
      mockTaro.getStorageSync.mockReturnValue(null);
      incrementPhotoGenerationCount();
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_avatar_photo_count', 1);
    });
  });
});

describe('avatarService - 3D 配额（按月重置）', () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  describe('get3DGenerationCount', () => {
    it('月份不匹配时应重置为 0', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return '2020-01';
        if (key === 'xhh_avatar_3d_count') return 5;
        return null;
      });

      const count = get3DGenerationCount();

      expect(count).toBe(0);
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_avatar_3d_count', 0);
      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_avatar_3d_count_date', currentMonth);
    });

    it('月份匹配时应返回已存储的计数', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return currentMonth;
        if (key === 'xhh_avatar_3d_count') return 2;
        return null;
      });

      expect(get3DGenerationCount()).toBe(2);
    });
  });

  describe('canGenerate3D', () => {
    it('非会员应始终返回 false（3D 为会员专享）', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return currentMonth;
        if (key === 'xhh_avatar_3d_count') return 0;
        return null;
      });

      expect(canGenerate3D(false)).toBe(false);
    });

    it('会员未达上限应返回 true', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return currentMonth;
        if (key === 'xhh_avatar_3d_count') return 1;
        return null;
      });

      expect(canGenerate3D(true)).toBe(true);
    });

    it('会员达到上限应返回 false', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return currentMonth;
        if (key === 'xhh_avatar_3d_count') return AVATAR_3D_MONTHLY_LIMIT;
        return null;
      });

      expect(canGenerate3D(true)).toBe(false);
    });
  });

  describe('increment3DGenerationCount', () => {
    it('应将计数+1 并写入存储', () => {
      mockTaro.getStorageSync.mockImplementation((key: string) => {
        if (key === 'xhh_avatar_3d_count_date') return currentMonth;
        if (key === 'xhh_avatar_3d_count') return 1;
        return null;
      });

      increment3DGenerationCount();

      expect(mockTaro.setStorageSync).toHaveBeenCalledWith('xhh_avatar_3d_count', 2);
    });
  });
});

describe('avatarService - 配额一致性验证', () => {
  it('AVATAR_PHOTO_FREE_COUNT 应为 1（免费用户每月 1 次 2D）', () => {
    expect(AVATAR_PHOTO_FREE_COUNT).toBe(1);
  });

  it('AVATAR_3D_MONTHLY_LIMIT 应为 3（会员每月 3 次 3D）', () => {
    expect(AVATAR_3D_MONTHLY_LIMIT).toBe(3);
  });
});
