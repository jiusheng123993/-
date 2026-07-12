// 星寰海 v2.0 - 急救状态管理
import { create } from 'zustand';
import type { CrisisLevel } from '../memory-body/types/memoryBodyTypes';
import { EmergencyEngine } from '../engines/emergency/EmergencyEngine';
import { getFlowById } from '../data/emergencyFlows';
import type { SafetyCheckResult } from '../utils/crisisDetector';
import { requestSubscribe, FOLLOWUP_TEMPLATE_ID } from '../services/subscribeService';
import { scheduleFollowup } from '../services/notificationService';

/** 会话数据接口 */
interface EmergencySessionData {
  sessionId: string;
  flowId: string;
  mood: string;
  preIntensity: number;
  postIntensity: number;
  stepsCompleted: number[];
  createdAt: number;
  completedAt: number | null;
}

interface EmergencyState {
  // 会话数据
  session: EmergencySessionData | null;
  flowId: string | null;

  // 引擎状态
  state: string;
  currentStep: number;
  totalSteps: number;
  content: Record<string, unknown>;
  crisisLevel: CrisisLevel;
  isCrisisActive: boolean;

  // UI状态
  isLoading: boolean;
  error: string | null;

  // 内部引擎实例
  engine: EmergencyEngine;

  // Actions
  startSession: (flowId: string) => Promise<void>;
  updateStep: (stepIndex: number, content: Record<string, unknown>) => void;
  nextStep: () => Promise<boolean>;
  previousStep: () => boolean;
  completeSession: () => Promise<void>;
  resetSession: () => void;
  detectCrisis: (text: string) => { detected: boolean; level?: CrisisLevel; suggestion?: string };
  checkSafety: (preIntensity: number, postIntensity: number) => SafetyCheckResult;
  recoverFromCrisis: () => void;
  setError: (error: string | null) => void;
}

export const useEmergencyStore = create<EmergencyState>((set, get) => ({
  session: null,
  flowId: null,
  state: 'idle',
  currentStep: 0,
  totalSteps: 0,
  content: {},
  crisisLevel: 'mild',
  isCrisisActive: false,
  isLoading: false,
  error: null,
  engine: new EmergencyEngine(),

  startSession: async (flowId: string) => {
    try {
      set({ isLoading: true, error: null });

      const flowConfig = getFlowById(flowId);
      if (!flowConfig) {
        throw new Error(`Unknown flow ID: ${flowId}`);
      }

      const engine = get().engine;
      engine.startFlow(flowId);

      const sessionData: EmergencySessionData = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        flowId,
        mood: flowConfig.mood,
        preIntensity: 8, // 默认强度
        postIntensity: 0,
        stepsCompleted: [],
        createdAt: Date.now(),
        completedAt: null
      };

      set({
        session: sessionData,
        flowId,
        state: engine.getState(),
        currentStep: engine.getCurrentStepIndex(),
        totalSteps: engine.getAllSteps().length,
        content: engine.getContentHistory(),
        isLoading: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage, isLoading: false });
    }
  },

  updateStep: (stepIndex: number, content: Record<string, unknown>) => {
    const engine = get().engine;
    const currentStep = engine.getCurrentStep();

    if (currentStep && stepIndex === engine.getCurrentStepIndex()) {
      engine.updateStepContent(content);
      set({
        content: engine.getContentHistory(),
        state: engine.getState()
      });
    }
  },

  nextStep: async () => {
    try {
      set({ isLoading: true });

      const engine = get().engine;
      const success = engine.nextStep();

      if (success) {
        set({
          state: engine.getState(),
          currentStep: engine.getCurrentStepIndex(),
          content: engine.getContentHistory(),
          isLoading: false
        });
      } else {
        set({ isLoading: false });
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage, isLoading: false });
      return false;
    }
  },

  previousStep: () => {
    const engine = get().engine;
    const success = engine.previousStep();

    if (success) {
      set({
        state: engine.getState(),
        currentStep: engine.getCurrentStepIndex(),
        content: engine.getContentHistory()
      });
    }

    return success;
  },

  completeSession: async () => {
    try {
      set({ isLoading: true });

      const engine = get().engine;
      engine.complete();

      const session = get().session;
      if (session) {
        session.postIntensity = 3;
        session.completedAt = Date.now();
        session.stepsCompleted = Array.from({ length: engine.getAllSteps().length }, (_, i) => i);

        requestSubscribe([FOLLOWUP_TEMPLATE_ID]).then((results) => {
          if (results[FOLLOWUP_TEMPLATE_ID]) {
            scheduleFollowup(session.sessionId, session.flowId, session.mood);
            console.log('[EmergencyStore] 已安排第二天跟进推送');
          }
        });
      }

      set({
        state: 'completed',
        isLoading: false
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      set({ error: errorMessage, isLoading: false });
    }
  },

  resetSession: () => {
    const engine = get().engine;
    engine.reset();

    set({
      session: null,
      flowId: null,
      state: 'idle',
      currentStep: 0,
      totalSteps: 0,
      content: {},
      crisisLevel: 'mild',
      isCrisisActive: false,
      error: null
    });
  },

  detectCrisis: (text: string) => {
    const engine = get().engine;
    const result = engine.detectCrisis(text);

    if (result.detected) {
      set({
        crisisLevel: result.level as CrisisLevel,
        isCrisisActive: true
      });

      if (result.level === 'severe') {
        engine.triggerCrisis();
        set({ state: 'crisis' });
      }
    }

    return result;
  },

  checkSafety: (_preIntensity: number, postIntensity: number): SafetyCheckResult => {
    const engine = get().engine;
    const result = engine.performSafetyCheck();

    // 如果需要跟进，记录到session
    if (result.needsFollowUp) {
      const session = get().session;
      if (session) {
        session.postIntensity = postIntensity;
      }
    }

    return result;
  },

  recoverFromCrisis: () => {
    const engine = get().engine;
    engine.recoverFromCrisis();
    set({
      isCrisisActive: false,
      state: engine.getState()
    });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
