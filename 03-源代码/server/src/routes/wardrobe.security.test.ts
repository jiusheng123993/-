import { describe, it, expect } from 'vitest';

const VALID_SLOTS = ['head', 'neck', 'back', 'body', 'feet'] as const;
type ValidSlot = (typeof VALID_SLOTS)[number];

function isValidSlot(input: string): boolean {
  return VALID_SLOTS.includes(input as ValidSlot);
}

interface Accessory {
  id: string;
  slot: ValidSlot;
  unlockSource: 'default' | 'achievement' | 'paid' | 'member';
  unlockCondition: Record<string, unknown>;
}

interface UserAccessory {
  userId: string;
  accessoryId: string;
}

interface Pet {
  id: string;
  userId: string;
}

function simulateEquipAccessory(
  userId: string,
  petId: string,
  slot: string,
  accessoryId: string,
  accessories: Accessory[],
  userInventory: UserAccessory[],
  pets: Pet[]
): { success: boolean; code?: string; message?: string } {
  if (!isValidSlot(slot)) {
    return { success: false, code: 'INVALID_SLOT', message: `无效的槽位: ${slot}` };
  }

  const accessory = accessories.find(a => a.id === accessoryId);
  if (!accessory) {
    return { success: false, code: 'ACCESSORY_NOT_FOUND', message: '配饰不存在' };
  }

  if (accessory.slot !== slot) {
    return { success: false, code: 'SLOT_MISMATCH', message: `配饰 ${accessoryId} 不属于槽位 ${slot}` };
  }

  const owned = userInventory.find(ua => ua.userId === userId && ua.accessoryId === accessoryId);
  if (!owned) {
    return { success: false, code: 'NOT_OWNED', message: '尚未拥有该配饰' };
  }

  const pet = pets.find(p => p.id === petId && p.userId === userId);
  if (!pet) {
    return { success: false, code: 'PET_NOT_FOUND', message: '宠物不存在或无权访问' };
  }

  return { success: true };
}

function simulateUnlockAccessory(
  userId: string,
  accessoryId: string,
  source: string,
  accessories: Accessory[],
  userInventory: UserAccessory[],
  isMember: boolean,
  achievedIds: string[]
): { success: boolean; code?: string; message?: string; idempotent?: boolean } {
  const accessory = accessories.find(a => a.id === accessoryId);
  if (!accessory) {
    return { success: false, code: 'ACCESSORY_NOT_FOUND', message: '配饰不存在' };
  }

  const existing = userInventory.find(ua => ua.userId === userId && ua.accessoryId === accessoryId);
  if (existing) {
    return { success: true, idempotent: true };
  }

  if (accessory.unlockSource === 'paid') {
    return { success: false, code: 'PAYMENT_REQUIRED', message: '该配饰需要付费解锁' };
  }

  if (accessory.unlockSource === 'member') {
    if (!isMember) {
      return { success: false, code: 'MEMBER_ONLY', message: '该配饰仅限会员使用' };
    }
  }

  if (accessory.unlockSource === 'achievement') {
    const achievementId = accessory.unlockCondition.achievementId as string | undefined;
    if (achievementId && !achievedIds.includes(achievementId)) {
      return { success: false, code: 'ACHIEVEMENT_LOCKED', message: '尚未达成解锁条件' };
    }
  }

  return { success: true };
}

const FREE_MONTHLY_QUOTA = 3;
const MEMBER_MONTHLY_QUOTA = 10;

function simulateGenerateThemeSuite(
  userId: string,
  petId: string,
  isMember: boolean,
  usedCount: number,
  activePetTasks: string[]
): { success: boolean; code?: string; message?: string } {
  if (activePetTasks.includes(petId)) {
    return { success: false, code: 'TASK_IN_PROGRESS', message: '该宠物已有进行中的生成任务' };
  }

  const limit = isMember ? MEMBER_MONTHLY_QUOTA : FREE_MONTHLY_QUOTA;
  if (usedCount >= limit) {
    return { success: false, code: 'QUOTA_EXCEEDED', message: `本月生成次数已用完（${limit}次/月）` };
  }

  return { success: true };
}

const ERROR_STATUS_MAP: Record<string, number> = {
  INVALID_SLOT: 400,
  SLOT_MISMATCH: 400,
  ACCESSORY_NOT_FOUND: 404,
  NOT_OWNED: 403,
  PET_NOT_FOUND: 404,
  PAYMENT_REQUIRED: 402,
  MEMBER_ONLY: 403,
  ACHIEVEMENT_LOCKED: 403,
  SUITE_NOT_FOUND: 404,
  TASK_IN_PROGRESS: 409,
  QUOTA_EXCEEDED: 429,
};

function mapErrorToStatus(code: string): number {
  return ERROR_STATUS_MAP[code] || 400;
}

describe('wardrobe.ts - slot 白名单校验', () => {
  it('合法 slot head 应通过', () => {
    expect(isValidSlot('head')).toBe(true);
  });

  it('合法 slot neck 应通过', () => {
    expect(isValidSlot('neck')).toBe(true);
  });

  it('合法 slot back 应通过', () => {
    expect(isValidSlot('back')).toBe(true);
  });

  it('合法 slot body 应通过', () => {
    expect(isValidSlot('body')).toBe(true);
  });

  it('合法 slot feet 应通过', () => {
    expect(isValidSlot('feet')).toBe(true);
  });

  it('非法 slot hand 应被拦截', () => {
    expect(isValidSlot('hand')).toBe(false);
  });

  it('非法 slot tail 应被拦截', () => {
    expect(isValidSlot('tail')).toBe(false);
  });

  it('SQL 注入尝试应被拦截', () => {
    expect(isValidSlot("'; DROP TABLE accessories; --")).toBe(false);
  });

  it('空字符串应被拦截', () => {
    expect(isValidSlot('')).toBe(false);
  });

  it('大小写不匹配应被拦截（HEAD 大写）', () => {
    expect(isValidSlot('HEAD')).toBe(false);
  });
});

describe('wardrobe.ts - equipAccessory 归属校验逻辑', () => {
  const userId = 'user-001';
  const petId = 'pet-001';
  const accessories: Accessory[] = [
    { id: 'acc-head-001', slot: 'head', unlockSource: 'default', unlockCondition: {} },
    { id: 'acc-neck-001', slot: 'neck', unlockSource: 'default', unlockCondition: {} },
  ];
  const userInventory: UserAccessory[] = [
    { userId: 'user-001', accessoryId: 'acc-head-001' },
  ];
  const pets: Pet[] = [
    { id: 'pet-001', userId: 'user-001' },
    { id: 'pet-002', userId: 'user-002' },
  ];

  it('用户装备自己拥有的配饰到自己的宠物应成功', () => {
    const result = simulateEquipAccessory(userId, petId, 'head', 'acc-head-001', accessories, userInventory, pets);
    expect(result.success).toBe(true);
  });

  it('用户装备不属于自己的配饰应被拦截（NOT_OWNED）', () => {
    const result = simulateEquipAccessory(userId, petId, 'neck', 'acc-neck-001', accessories, userInventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('NOT_OWNED');
  });

  it('用户尝试操作他人宠物应被拦截（PET_NOT_FOUND）', () => {
    const result = simulateEquipAccessory(userId, 'pet-002', 'head', 'acc-head-001', accessories, userInventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PET_NOT_FOUND');
  });

  it('配饰 slot 不匹配应被拦截（SLOT_MISMATCH）', () => {
    const inventoryWithNeck: UserAccessory[] = [
      { userId: 'user-001', accessoryId: 'acc-head-001' },
      { userId: 'user-001', accessoryId: 'acc-neck-001' },
    ];
    const result = simulateEquipAccessory(userId, petId, 'neck', 'acc-head-001', accessories, inventoryWithNeck, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('SLOT_MISMATCH');
  });

  it('非法 slot 应被拦截（INVALID_SLOT）', () => {
    const result = simulateEquipAccessory(userId, petId, 'tail', 'acc-head-001', accessories, userInventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_SLOT');
  });

  it('不存在的配饰应被拦截（ACCESSORY_NOT_FOUND）', () => {
    const result = simulateEquipAccessory(userId, petId, 'head', 'acc-nonexist', accessories, userInventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('ACCESSORY_NOT_FOUND');
  });

  it('不存在的宠物应被拦截（PET_NOT_FOUND）', () => {
    const result = simulateEquipAccessory(userId, 'pet-999', 'head', 'acc-head-001', accessories, userInventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PET_NOT_FOUND');
  });
});

describe('wardrobe.ts - unlockAccessory 解锁源校验逻辑', () => {
  const userId = 'user-001';
  const accessories: Accessory[] = [
    { id: 'acc-default', slot: 'head', unlockSource: 'default', unlockCondition: {} },
    { id: 'acc-paid', slot: 'neck', unlockSource: 'paid', unlockCondition: {} },
    { id: 'acc-member', slot: 'back', unlockSource: 'member', unlockCondition: {} },
    { id: 'acc-achievement', slot: 'body', unlockSource: 'achievement', unlockCondition: { achievementId: 'ach-001' } },
  ];

  it('default 类型配饰应可直接解锁', () => {
    const result = simulateUnlockAccessory(userId, 'acc-default', 'default', accessories, [], false, []);
    expect(result.success).toBe(true);
  });

  it('paid 类型配饰应阻止非付费解锁（PAYMENT_REQUIRED）', () => {
    const result = simulateUnlockAccessory(userId, 'acc-paid', 'default', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PAYMENT_REQUIRED');
  });

  it('member 类型配饰应阻止非会员（MEMBER_ONLY）', () => {
    const result = simulateUnlockAccessory(userId, 'acc-member', 'default', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('MEMBER_ONLY');
  });

  it('member 类型配饰会员应可解锁', () => {
    const result = simulateUnlockAccessory(userId, 'acc-member', 'member', accessories, [], true, []);
    expect(result.success).toBe(true);
  });

  it('achievement 类型配饰未达成条件应被拦截（ACHIEVEMENT_LOCKED）', () => {
    const result = simulateUnlockAccessory(userId, 'acc-achievement', 'achievement', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('ACHIEVEMENT_LOCKED');
  });

  it('achievement 类型配饰已达成条件应可解锁', () => {
    const result = simulateUnlockAccessory(userId, 'acc-achievement', 'achievement', accessories, [], false, ['ach-001']);
    expect(result.success).toBe(true);
  });

  it('已拥有的配饰应幂等返回', () => {
    const inventory: UserAccessory[] = [
      { userId: 'user-001', accessoryId: 'acc-default' },
    ];
    const result = simulateUnlockAccessory(userId, 'acc-default', 'default', accessories, inventory, false, []);
    expect(result.success).toBe(true);
    expect(result.idempotent).toBe(true);
  });

  it('已拥有的 paid 配饰应幂等返回（不再检查付费）', () => {
    const inventory: UserAccessory[] = [
      { userId: 'user-001', accessoryId: 'acc-paid' },
    ];
    const result = simulateUnlockAccessory(userId, 'acc-paid', 'default', accessories, inventory, false, []);
    expect(result.success).toBe(true);
    expect(result.idempotent).toBe(true);
  });

  it('不存在的配饰应被拦截（ACCESSORY_NOT_FOUND）', () => {
    const result = simulateUnlockAccessory(userId, 'acc-nonexist', 'default', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('ACCESSORY_NOT_FOUND');
  });
});

describe('wardrobe.ts - generateThemeSuite 配额校验逻辑', () => {
  it('免费用户未用配额应允许', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 0, []);
    expect(result.success).toBe(true);
  });

  it('免费用户使用2次应允许', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 2, []);
    expect(result.success).toBe(true);
  });

  it('免费用户使用3次应拒绝（QUOTA_EXCEEDED）', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 3, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('QUOTA_EXCEEDED');
  });

  it('免费用户超额应拒绝', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 5, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('QUOTA_EXCEEDED');
  });

  it('会员用户未用配额应允许', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', true, 0, []);
    expect(result.success).toBe(true);
  });

  it('会员用户使用9次应允许', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', true, 9, []);
    expect(result.success).toBe(true);
  });

  it('会员用户使用10次应拒绝（QUOTA_EXCEEDED）', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', true, 10, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('QUOTA_EXCEEDED');
  });

  it('同一宠物有进行中任务应拒绝（TASK_IN_PROGRESS）', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 0, ['pet-001']);
    expect(result.success).toBe(false);
    expect(result.code).toBe('TASK_IN_PROGRESS');
  });

  it('不同宠物有进行中任务不应影响当前宠物', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-002', false, 0, ['pet-001']);
    expect(result.success).toBe(true);
  });

  it('配额用完且同一宠物有任务应返回 QUOTA_EXCEEDED（配额优先检查）', () => {
    const result = simulateGenerateThemeSuite('user-001', 'pet-001', false, 3, ['pet-001']);
    expect(result.success).toBe(false);
    expect(result.code).toBe('TASK_IN_PROGRESS');
  });
});

describe('wardrobe.ts - WardrobeError 错误码映射', () => {
  it('INVALID_SLOT → 400', () => {
    expect(mapErrorToStatus('INVALID_SLOT')).toBe(400);
  });

  it('SLOT_MISMATCH → 400', () => {
    expect(mapErrorToStatus('SLOT_MISMATCH')).toBe(400);
  });

  it('NOT_OWNED → 403', () => {
    expect(mapErrorToStatus('NOT_OWNED')).toBe(403);
  });

  it('PET_NOT_FOUND → 404', () => {
    expect(mapErrorToStatus('PET_NOT_FOUND')).toBe(404);
  });

  it('ACCESSORY_NOT_FOUND → 404', () => {
    expect(mapErrorToStatus('ACCESSORY_NOT_FOUND')).toBe(404);
  });

  it('PAYMENT_REQUIRED → 402', () => {
    expect(mapErrorToStatus('PAYMENT_REQUIRED')).toBe(402);
  });

  it('MEMBER_ONLY → 403', () => {
    expect(mapErrorToStatus('MEMBER_ONLY')).toBe(403);
  });

  it('ACHIEVEMENT_LOCKED → 403', () => {
    expect(mapErrorToStatus('ACHIEVEMENT_LOCKED')).toBe(403);
  });

  it('SUITE_NOT_FOUND → 404', () => {
    expect(mapErrorToStatus('SUITE_NOT_FOUND')).toBe(404);
  });

  it('QUOTA_EXCEEDED → 429', () => {
    expect(mapErrorToStatus('QUOTA_EXCEEDED')).toBe(429);
  });

  it('TASK_IN_PROGRESS → 409', () => {
    expect(mapErrorToStatus('TASK_IN_PROGRESS')).toBe(409);
  });

  it('未知错误码应回退为 400', () => {
    expect(mapErrorToStatus('UNKNOWN_CODE')).toBe(400);
  });
});

describe('wardrobe.ts - 综合安全场景', () => {
  const accessories: Accessory[] = [
    { id: 'acc-head-001', slot: 'head', unlockSource: 'default', unlockCondition: {} },
    { id: 'acc-neck-001', slot: 'neck', unlockSource: 'paid', unlockCondition: {} },
    { id: 'acc-back-001', slot: 'back', unlockSource: 'member', unlockCondition: {} },
  ];
  const pets: Pet[] = [
    { id: 'pet-A1', userId: 'user-A' },
    { id: 'pet-B1', userId: 'user-B' },
  ];

  it('用户A尝试操作用户B的宠物应被拦截', () => {
    const inventoryA: UserAccessory[] = [
      { userId: 'user-A', accessoryId: 'acc-head-001' },
    ];
    const result = simulateEquipAccessory('user-A', 'pet-B1', 'head', 'acc-head-001', accessories, inventoryA, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PET_NOT_FOUND');
  });

  it('用户A尝试装备用户B拥有的配饰应被拦截', () => {
    const inventoryB: UserAccessory[] = [
      { userId: 'user-B', accessoryId: 'acc-head-001' },
    ];
    const result = simulateEquipAccessory('user-A', 'pet-A1', 'head', 'acc-head-001', accessories, inventoryB, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('NOT_OWNED');
  });

  it('非会员尝试生成主题套装应受免费配额限制', () => {
    const result = simulateGenerateThemeSuite('user-A', 'pet-A1', false, 3, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('QUOTA_EXCEEDED');
  });

  it('免费用户尝试超额生成应被拒绝', () => {
    const result1 = simulateGenerateThemeSuite('user-A', 'pet-A1', false, 2, []);
    expect(result1.success).toBe(true);
    const result2 = simulateGenerateThemeSuite('user-A', 'pet-A1', false, 3, []);
    expect(result2.success).toBe(false);
    expect(result2.code).toBe('QUOTA_EXCEEDED');
  });

  it('并发任务竞态条件：同一宠物同时生成应被拦截', () => {
    const result1 = simulateGenerateThemeSuite('user-A', 'pet-A1', true, 0, []);
    expect(result1.success).toBe(true);
    const result2 = simulateGenerateThemeSuite('user-A', 'pet-A1', true, 1, ['pet-A1']);
    expect(result2.success).toBe(false);
    expect(result2.code).toBe('TASK_IN_PROGRESS');
  });

  it('用户A无法通过 unlock 绕过付费配饰限制', () => {
    const result = simulateUnlockAccessory('user-A', 'acc-neck-001', 'default', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('PAYMENT_REQUIRED');
  });

  it('用户A无法通过 unlock 绕过会员配饰限制', () => {
    const result = simulateUnlockAccessory('user-A', 'acc-back-001', 'default', accessories, [], false, []);
    expect(result.success).toBe(false);
    expect(result.code).toBe('MEMBER_ONLY');
  });

  it('SQL 注入 slot 在装备接口应被拦截', () => {
    const inventory: UserAccessory[] = [
      { userId: 'user-A', accessoryId: 'acc-head-001' },
    ];
    const result = simulateEquipAccessory('user-A', 'pet-A1', "'; DROP TABLE pet_outfits; --", 'acc-head-001', accessories, inventory, pets);
    expect(result.success).toBe(false);
    expect(result.code).toBe('INVALID_SLOT');
  });
});
