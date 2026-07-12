// 星寰海 v2.0 - 急救引擎核心逻辑
import type { CrisisResult, EmergencyStep, EmergencyFlow } from './types';
import { getFlowById } from '../../data/emergencyFlows';
import { CrisisDetector, SafetyCheckResult } from '../../utils/crisisDetector';

export class EmergencyEngine {
  private currentState: string = 'idle';
  private currentStep: number = 0;
  private flowSteps: EmergencyStep[] = [];
  private flowConfig: EmergencyFlow | null = null;
  private contentHistory: Record<string, unknown> = {};
  private crisisDetector: CrisisDetector;
  private preFlowIntensity: number = 0; // 事前强度
  private postFlowIntensity: number = 0; // 事后强度

  constructor() {
    this.crisisDetector = new CrisisDetector({
      enableLogging: true,
      minTextLength: 1,
      maxTextLength: 5000,
      followUpThreshold: 2,
    });
  }

  /** 获取当前状态 */
  getState(): string {
    return this.currentState;
  }

  /** 获取当前步骤索引 */
  getCurrentStepIndex(): number {
    return this.currentStep;
  }

  /** 获取当前步骤配置 */
  getCurrentStep(): EmergencyStep | undefined {
    return this.flowSteps[this.currentStep];
  }

  /** 获取所有步骤 */
  getAllSteps(): EmergencyStep[] {
    return [...this.flowSteps];
  }

  /** 获取流程配置 */
  getFlowConfig(): EmergencyFlow | null {
    return this.flowConfig;
  }

  /** 获取内容历史 */
  getContentHistory(): Record<string, unknown> {
    return { ...this.contentHistory };
  }

  /** 开始急救流程 */
  startFlow(flowId: string): void {
    const flowConfig = getFlowById(flowId);
    if (!flowConfig) {
      throw new Error(`Unknown flow ID: ${flowId}`);
    }

    this.flowConfig = flowConfig;
    this.flowSteps = flowConfig.steps;
    this.currentState = 'entry';
    this.currentStep = 0;
    this.contentHistory = {};

    // 记录事前强度（默认为5）
    this.preFlowIntensity = 5;
  }

  /** 推进到下一步 */
  nextStep(): boolean {
    if (this.currentStep >= this.flowSteps.length - 1) {
      return false; // 已经是最后一步
    }

    this.currentStep++;
    this.updateState();
    return true;
  }

  /** 回退到上一步 */
  previousStep(): boolean {
    if (this.currentStep <= 0) {
      return false; // 已经是第一步
    }

    this.currentStep--;
    this.updateState();
    return true;
  }

  /** 跳转到指定步骤 */
  goToStep(stepIndex: number): boolean {
    if (stepIndex < 0 || stepIndex >= this.flowSteps.length) {
      return false;
    }

    this.currentStep = stepIndex;
    this.updateState();
    return true;
  }

  /** 更新当前步骤的内容 */
  updateStepContent(content: Record<string, unknown>): void {
    const stepId = this.flowSteps[this.currentStep]?.stepId;
    if (stepId) {
      this.contentHistory[stepId] = content;

      // 如果内容包含强度评分，更新事后强度
      if (typeof content.intensity === 'number') {
        this.postFlowIntensity = content.intensity;
      }
    }
  }

  /** 完成急救流程 */
  complete(): void {
    this.currentState = 'completed';
  }

  /** 触发危机模式 */
  triggerCrisis(): void {
    this.currentState = 'crisis';
  }

  /** 从危机中恢复 */
  recoverFromCrisis(): void {
    if (this.currentState === 'crisis') {
      this.currentState = this.getNextNormalState();
    }
  }

  /** 检测高危关键词（增强版） */
  detectCrisis(text: string): CrisisResult {
    const result = this.crisisDetector.detect(text);

    // 如果检测到危机，触发引擎状态变更
    if (result.detected && result.level !== 'mild') {
      this.triggerCrisis();
    }

    return {
      detected: result.detected,
      level: result.level,
      matchedKeywords: result.matchedKeywords,
      suggestion: result.suggestion,
    };
  }

  /** 执行安全检查 */
  performSafetyCheck(): SafetyCheckResult {
    const result = this.crisisDetector.checkSafety(
      this.preFlowIntensity,
      this.postFlowIntensity
    );

    // 如果需要跟进，记录日志
    if (result.needsFollowUp) {
      console.log('[EmergencyEngine] Safety check triggered follow-up:', {
        preIntensity: result.preIntensity,
        postIntensity: result.postIntensity,
        change: result.intensityChange,
        reason: result.reason,
      });
    }

    return result;
  }

  /** 设置事前强度 */
  setPreFlowIntensity(intensity: number): void {
    this.preFlowIntensity = Math.max(1, Math.min(10, intensity));
  }

  /** 获取事前强度 */
  getPreFlowIntensity(): number {
    return this.preFlowIntensity;
  }

  /** 获取事后强度 */
  getPostFlowIntensity(): number {
    return this.postFlowIntensity;
  }

  /** 获取危机历史 */
  getCrisisHistory() {
    return this.crisisDetector.getCrisisHistory();
  }

  /** 检查是否可以继续 */
  canContinue(): boolean {
    return this.currentState !== 'completed' && this.currentState !== 'crisis';
  }

  /** 检查是否已完成 */
  isCompleted(): boolean {
    return this.currentState === 'completed';
  }

  /** 检查是否处于危机状态 */
  isInCrisis(): boolean {
    return this.currentState === 'crisis';
  }

  /** 重置引擎 */
  reset(): void {
    this.currentState = 'idle';
    this.currentStep = 0;
    this.flowSteps = [];
    this.flowConfig = null;
    this.contentHistory = {};
    this.preFlowIntensity = 0;
    this.postFlowIntensity = 0;
  }

  /** 恢复会话（用于中断后恢复） */
  restoreSession(sessionData: {
    state: string;
    currentStep: number;
    content: Record<string, unknown>;
    flowId: string;
  }): boolean {
    const flowConfig = getFlowById(sessionData.flowId);
    if (!flowConfig) {
      return false;
    }

    this.flowConfig = flowConfig;
    this.flowSteps = flowConfig.steps;
    this.currentState = sessionData.state;
    this.currentStep = sessionData.currentStep;
    this.contentHistory = sessionData.content;

    return true;
  }

  /** 获取进度百分比 */
  getProgressPercentage(): number {
    if (this.flowSteps.length === 0) return 0;
    return Math.round(((this.currentStep + 1) / this.flowSteps.length) * 100);
  }

  /** 获取剩余步骤数 */
  getRemainingSteps(): number {
    return this.flowSteps.length - this.currentStep - 1;
  }

  /** 内部方法：更新状态 */
  private updateState(): void {
    // 根据步骤类型推断状态
    const currentStep = this.flowSteps[this.currentStep];
    if (!currentStep) return;

    const stepType = currentStep.stepId;
    const stateMap: Record<string, string> = {
      naming: 'naming',
      writing: 'writing',
      action: 'action',
      connect: 'connect',
      breathing: 'action', // 呼吸属于行动类
      distinguish: 'writing', // 区分属于书写类
      control: 'action', // 控制圈属于行动类
      attribute: 'naming', // 归因属于命名类
      respond: 'connect', // 回应属于连接类
      sensory: 'action', // 感官属于行动类
      closing: 'closing'
    };

    this.currentState = stateMap[stepType] || 'naming';
  }

  /** 内部方法：获取下一个正常状态 */
  private getNextNormalState(): string {
    const normalStates = ['idle', 'entry', 'naming', 'writing', 'action', 'connect', 'closing'];
    const currentIndex = normalStates.indexOf(this.currentState);
    if (currentIndex >= 0 && currentIndex < normalStates.length - 1) {
      return normalStates[currentIndex + 1];
    }
    return 'completed';
  }
}
