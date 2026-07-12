// 星寰海 v2.0 - 4-7-8呼吸动画组件
import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import './BreathingAnimation.scss';

// 呼吸阶段类型
type BreathPhase = 'inhale' | 'hold' | 'exhale';

// 呼吸阶段配置
interface BreathPhaseConfig {
  phase: BreathPhase;
  duration: number; // 秒
  text: string;
  color: string;
}

// 4-7-8呼吸法配置
const BREATHING_PHASES: BreathPhaseConfig[] = [
  { phase: 'inhale', duration: 4, text: '吸气', color: '#667eea' },
  { phase: 'hold', duration: 7, text: '屏息', color: '#764ba2' },
  { phase: 'exhale', duration: 8, text: '呼气', color: '#f093fb' },
];

interface BreathingAnimationProps {
  autoStart?: boolean; // 是否自动开始
  loop?: boolean; // 是否循环
  onComplete?: () => void; // 完成回调
  className?: string; // 自定义类名
}

export default function BreathingAnimation({
  autoStart = false,
  loop = true,
  onComplete,
  className = '',
}: BreathingAnimationProps) {
  const [isPlaying, setIsPlaying] = useState(autoStart);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(BREATHING_PHASES[0].duration);
  const [circleScale, setCircleScale] = useState(1);

  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // 开始倒计时
  const startCountdown = useCallback((duration: number) => {
    setCountdown(duration);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    countdownRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // 切换到下一个阶段
  const nextPhase = useCallback(
    (currentIndex: number) => {
      const nextIndex = (currentIndex + 1) % BREATHING_PHASES.length;
      setPhaseIndex(nextIndex);
      startCountdown(BREATHING_PHASES[nextIndex].duration);

      // 设置圆圈缩放效果
      const currentPhase = BREATHING_PHASES[nextIndex].phase;
      if (currentPhase === 'inhale') {
        setCircleScale(1.2);
      } else if (currentPhase === 'hold') {
        setCircleScale(1.1);
      } else {
        setCircleScale(1);
      }

      // 设置下一个阶段的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        nextPhase(nextIndex);
      }, BREATHING_PHASES[nextIndex].duration * 1000);
    },
    [startCountdown]
  );

  // 开始呼吸练习
  const startExercise = useCallback(() => {
    setIsPlaying(true);
    setPhaseIndex(0);
    startCountdown(BREATHING_PHASES[0].duration);
    setCircleScale(1.2); // 吸气时放大

    // 设置第一个阶段的定时器
    timerRef.current = window.setTimeout(() => {
      nextPhase(0);
    }, BREATHING_PHASES[0].duration * 1000);
  }, [startCountdown, nextPhase]);

  // 停止呼吸练习
  const stopExercise = useCallback(() => {
    setIsPlaying(false);
    clearTimers();
    setPhaseIndex(0);
    setCountdown(BREATHING_PHASES[0].duration);
    setCircleScale(1);
  }, [clearTimers]);

  // 重置呼吸练习
  const resetExercise = useCallback(() => {
    stopExercise();
    if (autoStart) {
      startExercise();
    }
  }, [autoStart, stopExercise, startExercise]);

  // 自动开始
  useEffect(() => {
    if (autoStart) {
      startExercise();
    }
    return () => {
      clearTimers();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 监听完成事件（非循环模式）
  useEffect(() => {
    if (!loop && isPlaying && phaseIndex === BREATHING_PHASES.length - 1 && countdown === 0) {
      setIsPlaying(false);
      clearTimers();
      onComplete?.();
    }
  }, [phaseIndex, countdown, isPlaying, loop, onComplete, clearTimers]);

  // 当前阶段配置
  const currentPhase = BREATHING_PHASES[phaseIndex];

  return (
    <View className={`breathing-container ${className}`}>
      {/* 呼吸圆圈 */}
      <View
        className="breathing-circle"
        style={{
          background: `radial-gradient(circle, ${currentPhase.color}40 0%, ${currentPhase.color}20 100%)`,
          transform: `scale(${circleScale})`,
        }}
      >
        <Text className="breathing-phase-text">{currentPhase.text}</Text>
        <Text className="breathing-countdown-text">{countdown > 0 ? countdown : ''}</Text>
      </View>

      {/* 控制按钮 */}
      <View className="breathing-controls">
        {!isPlaying ? (
          <View className="play-btn" onClick={startExercise}>
            <Text>开始呼吸练习</Text>
          </View>
        ) : (
          <View className="stop-btn" onClick={stopExercise}>
            <Text>停止</Text>
          </View>
        )}
        {isPlaying && (
          <View className="reset-btn" onClick={resetExercise}>
            <Text>重置</Text>
          </View>
        )}
      </View>

      {/* 提示文字 */}
      <View className="breathing-tips">
        <Text className="tips-text">
          4-7-8呼吸法：吸气4秒，屏息7秒，呼气8秒
        </Text>
        <Text className="tips-subtext">
          重复3-4次，帮助放松身心
        </Text>
      </View>
    </View>
  );
}
