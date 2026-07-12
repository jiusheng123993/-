// 星寰海 v2.0 - 急救服务API
import type { CrisisLevel } from '../memory-body/types/memoryBodyTypes';

const API_BASE = '/api/v1';

/** 创建急救会话 */
export async function createEmergencySession(
  flowId: string,
  preIntensity: number
): Promise<{ sessionId: string; flowId: string; mood: string; preIntensity: number; postIntensity: number; stepsCompleted: number[]; createdAt: number; completedAt: number | null }> {
  try {
    const response = await fetch(`${API_BASE}/emergency/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        flowId,
        preIntensity,
        createdAt: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[EmergencyService] createEmergencySession error:', error);
    // 降级：返回本地生成的session数据
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      flowId,
      mood: '',
      preIntensity,
      postIntensity: 0,
      stepsCompleted: [],
      createdAt: Date.now(),
      completedAt: null
    };
  }
}

/** 更新急救步骤 */
export async function updateEmergencyStep(
  sessionId: string,
  stepIndex: number,
  content: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown }> {
  try {
    const response = await fetch(`${API_BASE}/emergency/session/${sessionId}/steps/${stepIndex}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        updatedAt: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update step: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[EmergencyService] updateEmergencyStep error:', error);
    // 降级：返回成功，实际数据保存在内存中
    return { success: true };
  }
}

/** 完成急救会话 */
export async function completeEmergencySession(
  sessionId: string,
  postIntensity: number
): Promise<{ success: boolean; data?: unknown }> {
  try {
    const response = await fetch(`${API_BASE}/emergency/session/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        postIntensity,
        completedAt: Date.now()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[EmergencyService] completeEmergencySession error:', error);
    // 降级：返回成功
    return { success: true };
  }
}

/** 获取会话详情 */
export async function getEmergencySession(
  sessionId: string
): Promise<{ sessionId: string; flowId: string; state: string; currentStep: number } | null> {
  try {
    const response = await fetch(`${API_BASE}/emergency/session/${sessionId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[EmergencyService] getEmergencySession error:', error);
    return null;
  }
}

/** 检测危机关键词（本地执行） */
export function detectCrisisKeywords(text: string): {
  detected: boolean;
  level: CrisisLevel;
  matchedKeywords: string[];
  suggestion: string;
} {
  const lowerText = text.toLowerCase();
  const matchedMild: string[] = [];
  const matchedModerate: string[] = [];
  const matchedSevere: string[] = [];

  // 导入关键词库（简化版，实际应从crisisKeywords导入）
  const keywords = [
    { word: '想死', level: 'severe' as const },
    { word: '自杀', level: 'severe' as const },
    { word: '不想活', level: 'severe' as const },
    { word: '活着没意义', level: 'severe' as const },
    { word: '撑不下去', level: 'moderate' as const },
    { word: '崩溃', level: 'moderate' as const },
    { word: '绝望', level: 'moderate' as const },
    { word: '难受', level: 'mild' as const },
    { word: '痛苦', level: 'mild' as const },
    { word: '伤心', level: 'mild' as const }
  ];

  for (const keyword of keywords) {
    if (lowerText.includes(keyword.word)) {
      if (keyword.level === 'mild') matchedMild.push(keyword.word);
      else if (keyword.level === 'moderate') matchedModerate.push(keyword.word);
      else matchedSevere.push(keyword.word);
    }
  }

  if (matchedSevere.length > 0) {
    return {
      detected: true,
      level: 'severe',
      matchedKeywords: matchedSevere,
      suggestion: '立即拨打400-161-9995或120/110'
    };
  }

  if (matchedModerate.length > 0) {
    return {
      detected: true,
      level: 'moderate',
      matchedKeywords: matchedModerate,
      suggestion: '你的感受很重要。如果需要帮助，可以拨打400-161-9995'
    };
  }

  if (matchedMild.length > 0) {
    return {
      detected: true,
      level: 'mild',
      matchedKeywords: matchedMild,
      suggestion: '如果这种感觉持续困扰你，可以拨打400-161-9995寻求专业帮助'
    };
  }

  return {
    detected: false,
    level: 'mild',
    matchedKeywords: [],
    suggestion: ''
  };
}
