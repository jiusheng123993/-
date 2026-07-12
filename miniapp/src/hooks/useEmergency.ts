// 星寰海 v2.0 - 急救流程Hook
import { useCallback, useMemo } from 'react';
import Taro from '@tarojs/taro';
import { useEmergencyStore } from '../stores/emergencyStore';
import type { SafetyCheckResult } from '../utils/crisisDetector';

export function useEmergency() {
  const store = useEmergencyStore();

  // 从store派生状态
  const state = store.state;
  const currentStep = store.currentStep;
  const content = store.content;
  const isLoading = store.isLoading;
  const error = store.error;
  const session = store.session;
  const flowId = store.flowId;
  const crisisLevel = store.crisisLevel;
  const isCrisisActive = store.isCrisisActive;

  // 获取当前步骤配置
  const currentStepConfig = useMemo(() => {
    const engine = store.engine;
    return engine.getCurrentStep();
  }, [store.engine, currentStep]);

  // 获取所有步骤
  const allSteps = useMemo(() => {
    const engine = store.engine;
    return engine.getAllSteps();
  }, [store.engine]);

  // 获取进度百分比
  const progressPercentage = useMemo(() => {
    const engine = store.engine;
    return engine.getProgressPercentage();
  }, [store.engine, currentStep]);

  // 开始急救流程
  const startFlow = useCallback(async (flowId: string) => {
    await store.startSession(flowId);
    // 导航到紧急页面
    Taro.navigateTo({ url: `/pages/emergency/index?flowId=${flowId}` });
  }, [store]);

  // 下一步
  const nextStep = useCallback(async () => {
    const success = await store.nextStep();
    return success;
  }, [store]);

  // 上一步
  const previousStep = useCallback(() => {
    return store.previousStep();
  }, [store]);

  // 完成流程
  const complete = useCallback(async () => {
    await store.completeSession();
  }, [store]);

  // 检查是否已完成
  const isCompleted = useMemo(() => {
    return state === 'completed';
  }, [state]);

  // 重置
  const reset = useCallback(() => {
    store.resetSession();
  }, [store]);

  // 检测危机关键词
  const detectCrisis = useCallback((text: string) => {
    return store.detectCrisis(text);
  }, [store]);

  // 安全检查
  const checkSafety = useCallback((preIntensity: number, postIntensity: number): SafetyCheckResult => {
    return store.checkSafety(preIntensity, postIntensity);
  }, [store]);

  // 从危机中恢复
  const recoverFromCrisis = useCallback(() => {
    store.recoverFromCrisis();
  }, [store]);

  // 更新步骤内容
  const updateContent = useCallback((stepIndex: number, content: Record<string, unknown>) => {
    store.updateStep(stepIndex, content);
  }, [store]);

  // 设置错误
  const setError = useCallback((error: string | null) => {
    store.setError(error);
  }, [store]);

  return {
    // 状态
    state,
    currentStep,
    content,
    isLoading,
    error,
    session,
    flowId,
    crisisLevel,
    isCrisisActive,
    isCompleted,

    // 步骤信息
    currentStepConfig,
    allSteps,
    progressPercentage,

    // 方法
    startFlow,
    nextStep,
    previousStep,
    complete,
    reset,
    detectCrisis,
    checkSafety,
    recoverFromCrisis,
    updateContent,
    setError
  };
}
