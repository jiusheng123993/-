import { useCallback, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { getStorage, setStorage } from '../utils/storage';
import { updateFollowupStatus, getFollowupBySessionId, type PendingFollowup } from '../services/notificationService';
import { MiniProgramMemoryBodyStore } from '../memory-body/store/miniProgramMemoryBodyStore';

const FOLLOWUP_RECORDS_KEY = 'followup_records';

export type FollowupResponse = 'better' | 'okay' | 'still_bad';

export interface FollowupRecord {
  sessionId: string;
  flowId: string;
  mood: string;
  response: FollowupResponse;
  respondedAt: number;
  consecutiveBadDays: number;
  createdAt: number;
}

export interface UseFollowupReturn {
  submitFollowup: (sessionId: string, response: FollowupResponse) => Promise<FollowupResult>;
  getFollowupHistory: () => FollowupRecord[];
  checkConsecutiveBadDays: () => number;
  getFollowupBySessionId: (sessionId: string) => PendingFollowup | null;
}

export interface FollowupResult {
  success: boolean;
  response: FollowupResponse;
  consecutiveBadDays: number;
  message: string;
  showCounselingSuggestion: boolean;
}

export function useFollowup(): UseFollowupReturn {
  const memoryStore = useMemo(() => new MiniProgramMemoryBodyStore(), []);

  const submitFollowup = useCallback(async (sessionId: string, response: FollowupResponse): Promise<FollowupResult> => {
    const followup = getFollowupBySessionId(sessionId);
    if (!followup) {
      console.error('[useFollowup] 未找到跟进记录:', sessionId);
      return {
        success: false,
        response,
        consecutiveBadDays: 0,
        message: '跟进记录不存在',
        showCounselingSuggestion: false,
      };
    }

    updateFollowupStatus(sessionId, 'responded', response);

    const consecutiveBadDays = checkConsecutiveBadDays();
    const newConsecutiveBadDays = response === 'still_bad' ? consecutiveBadDays + 1 : 0;

    const record: FollowupRecord = {
      sessionId,
      flowId: followup.flowId,
      mood: followup.mood,
      response,
      respondedAt: Date.now(),
      consecutiveBadDays: newConsecutiveBadDays,
      createdAt: followup.createdAt,
    };

    saveFollowupRecord(record);

    const showCounselingSuggestion = newConsecutiveBadDays >= 3;
    const message = getResponseMessage(response, showCounselingSuggestion);

    if (response === 'better') {
      memoryStore.saveMoodEntry({
        id: `followup_${sessionId}`,
        userId: 'local',
        mood: 'calm',
        intensity: 3,
        note: '急救跟进：感觉好一点了',
        createdAt: new Date(),
      });
    }

    return {
      success: true,
      response,
      consecutiveBadDays: newConsecutiveBadDays,
      message,
      showCounselingSuggestion,
    };
  }, [memoryStore]);

  const getFollowupHistory = useCallback((): FollowupRecord[] => {
    return getStorage<FollowupRecord[]>(FOLLOWUP_RECORDS_KEY) || [];
  }, []);

  const checkConsecutiveBadDays = useCallback((): number => {
    const records = getFollowupHistory();
    if (records.length === 0) return 0;

    const sortedRecords = [...records].sort((a, b) => b.respondedAt - a.respondedAt);

    let consecutiveCount = 0;
    for (const record of sortedRecords) {
      if (record.response === 'still_bad') {
        consecutiveCount++;
      } else {
        break;
      }
    }

    return consecutiveCount;
  }, []);

  return {
    submitFollowup,
    getFollowupHistory,
    checkConsecutiveBadDays,
    getFollowupBySessionId,
  };
}

function saveFollowupRecord(record: FollowupRecord): void {
  const records = getStorage<FollowupRecord[]>(FOLLOWUP_RECORDS_KEY) || [];
  records.unshift(record);
  if (records.length > 100) {
    records.splice(100);
  }
  setStorage(FOLLOWUP_RECORDS_KEY, records);
}

function getResponseMessage(response: FollowupResponse, showCounselingSuggestion: boolean): string {
  switch (response) {
    case 'better':
      return '太好了！急救方法对你有效。继续保持，记得照顾好自己。';

    case 'okay':
      return '嗯，有时候就是这样。如果需要，可以再试试其他方法，或者记录一下今天的感受。';

    case 'still_bad':
      if (showCounselingSuggestion) {
        return '你已经连续几天感觉不好了，这很不容易。也许可以试试和专业心理咨询师聊聊？';
      }
      return '抱歉你还在难受。情绪的恢复需要时间，如果需要，可以再试一次急救流程。';

    default:
      return '感谢你的反馈。';
  }
}

export function navigateToFollowup(sessionId: string): void {
  Taro.navigateTo({
    url: `/packageEmergency/pages/followup/index?sessionId=${sessionId}`,
  });
}
