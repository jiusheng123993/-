// 星寰海 v2.0 - 危机检测Hook
// 提供React组件中使用的危机检测功能

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CrisisDetector,
  CrisisDetectionResult,
  SafetyCheckResult,
  CrisisEvent,
  createCrisisDetector,
} from '../utils/crisisDetector';

/** Hook配置选项 */
export interface UseCrisisDetectionOptions {
  enableLogging?: boolean;
  minTextLength?: number;
  maxTextLength?: number;
  followUpThreshold?: number;
  debounceMs?: number; // 防抖时间（毫秒）
}

/** Hook返回值 */
export interface UseCrisisDetectionReturn {
  // 状态
  isDetecting: boolean;
  lastResult: CrisisDetectionResult | null;
  crisisHistory: CrisisEvent[];
  safetyCheck: SafetyCheckResult | null;

  // 方法
  detect: (text: string) => CrisisDetectionResult;
  checkSafety: (preIntensity: number, postIntensity: number) => SafetyCheckResult;
  clearHistory: () => void;
  reset: () => void;

  // 事件监听
  onCrisisDetected?: (event: CrisisEvent) => void;
}

/**
 * 危机检测Hook
 * 在React组件中使用危机检测功能
 *
 * @param options 配置选项
 * @returns 检测状态和方法
 */
export function useCrisisDetection(
  options: UseCrisisDetectionOptions = {}
): UseCrisisDetectionReturn {
  const {
    enableLogging = true,
    minTextLength = 1,
    maxTextLength = 5000,
    followUpThreshold = 2,
  } = options;

  // 创建检测器实例（使用ref避免重复创建）
  const detectorRef = useRef<CrisisDetector>();
  if (!detectorRef.current) {
    detectorRef.current = createCrisisDetector({
      enableLogging,
      minTextLength,
      maxTextLength,
      followUpThreshold,
    });
  }

  // 状态
  const [isDetecting, setIsDetecting] = useState(false);
  const [lastResult, setLastResult] = useState<CrisisDetectionResult | null>(null);
  const [crisisHistory, setCrisisHistory] = useState<CrisisEvent[]>([]);
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(null);

  // 检测文本
  const detect = useCallback(
    (text: string): CrisisDetectionResult => {
      if (!detectorRef.current) {
        return {
          detected: false,
          level: 'mild',
          matchedKeywords: [],
          suggestion: '',
          intensity: 0,
        };
      }

      setIsDetecting(true);
      const result = detectorRef.current.detect(text);
      setLastResult(result);
      setIsDetecting(false);

      return result;
    },
    []
  );

  // 安全检查
  const checkSafety = useCallback(
    (preIntensity: number, postIntensity: number): SafetyCheckResult => {
      if (!detectorRef.current) {
        return {
          preIntensity,
          postIntensity,
          intensityChange: postIntensity - preIntensity,
          needsFollowUp: false,
        };
      }

      const result = detectorRef.current.checkSafety(preIntensity, postIntensity);
      setSafetyCheck(result);
      return result;
    },
    []
  );

  // 清除历史
  const clearHistory = useCallback(() => {
    if (detectorRef.current) {
      detectorRef.current.clearHistory();
      setCrisisHistory([]);
    }
  }, []);

  // 重置
  const reset = useCallback(() => {
    setLastResult(null);
    setSafetyCheck(null);
    clearHistory();
  }, [clearHistory]);

  // 监听危机事件
  useEffect(() => {
    if (!detectorRef.current) return;

    const listener = (event: CrisisEvent) => {
      setCrisisHistory((prev) => [...prev, event]);
    };

    detectorRef.current.addEventListener(listener);

    return () => {
      detectorRef.current?.removeEventListener(listener);
    };
  }, []);

  return {
    isDetecting,
    lastResult,
    crisisHistory,
    safetyCheck,
    detect,
    checkSafety,
    clearHistory,
    reset,
  };
}
