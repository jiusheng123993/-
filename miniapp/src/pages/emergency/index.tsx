// 星寰海 v3.0 - 情绪急救箱页面（水墨风格）
import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useEmergency } from '../../hooks/useEmergency';
import { useEmergencyStore } from '../../stores/emergencyStore';
import { CrisisDetector } from '../../utils/crisisDetector';
import EmergencyStepNaming from '../../components/EmergencyStepNaming';
import EmergencyStepWriting from '../../components/EmergencyStepWriting';
import EmergencyStepAction from '../../components/EmergencyStepAction';
import EmergencyStepConnect from '../../components/EmergencyStepConnect';
import EmergencyStepClosing from '../../components/EmergencyStepClosing';
import FloatingNav from '../../components/FloatingNav';
import './index.scss';

export default function EmergencyPage() {
  const { currentFlow, currentStep, currentStepData, isComplete, completeFlow, resetFlow } = useEmergency();
  const { addCompletedFlow } = useEmergencyStore();
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [crisisLevel, setCrisisLevel] = useState<'high' | 'critical' | null>(null);

  // 检查URL参数
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    if (params?.flowId) {
      // 从URL参数获取流程ID
      console.log('[Emergency] 从URL获取流程ID:', params.flowId);
    }
  }, []);

  // 危机检测
  useEffect(() => {
    if (currentStepData?.crisisKeywords && currentStepData.crisisKeywords.length > 0) {
      const detector = new CrisisDetector();
      const text = currentStepData.crisisKeywords.join(' ');
      const result = detector.analyzeText(text);

      if (result.level === 'critical' || result.level === 'high') {
        setCrisisLevel(result.level);
        setShowCrisisModal(true);
      }
    }
  }, [currentStepData]);

  // 处理步骤完成
  const handleStepComplete = (stepId: string, data?: Record<string, unknown>) => {
    console.log('[Emergency] 步骤完成:', stepId, data);

    // 如果是最后一步，完成整个流程
    if (currentFlow && currentStep === currentFlow.steps.length - 1) {
      completeFlow();
      if (currentFlow) {
        addCompletedFlow(currentFlow.id);
      }
    }
  };

  // 处理流程完成
  const handleFlowComplete = () => {
    Taro.showToast({
      title: '急救完成，你很棒！',
      icon: 'none',
      duration: 2000,
    });

    // 延迟返回首页
    setTimeout(() => {
      Taro.redirectTo({ url: '/pages/index/index' });
    }, 2000);
  };

  // 渲染当前步骤
  const renderStep = () => {
    if (!currentFlow || !currentStepData) {
      return (
        <View className='empty-state'>
          <Text className='empty-text'>请选择一种情绪开始急救</Text>
        </View>
      );
    }

    const step = currentStepData;
    const stepType = step.type;

    switch (stepType) {
      case 'naming':
        return (
          <EmergencyStepNaming
            title={step.title}
            subtitle={step.subtitle || ''}
            options={step.options || []}
            onSelect={(optionId) => handleStepComplete(step.id, { selectedOption: optionId })}
          />
        );

      case 'writing':
        return (
          <EmergencyStepWriting
            title={step.title}
            subtitle={step.subtitle || ''}
            prompts={step.prompts || []}
            crisisKeywords={step.crisisKeywords || []}
            onSubmit={(content) => handleStepComplete(step.id, { content })}
          />
        );

      case 'action':
        return (
          <EmergencyStepAction
            title={step.title}
            subtitle={step.subtitle || ''}
            options={step.options || []}
            onSelect={(optionId) => handleStepComplete(step.id, { selectedOption: optionId })}
          />
        );

      case 'connect':
        return (
          <EmergencyStepConnect
            title={step.title}
            subtitle={step.subtitle || ''}
            resourceType={step.resourceType || 'general'}
            resources={step.resources || []}
            supportMessages={step.supportMessages || []}
            onSelect={(resourceId) => handleStepComplete(step.id, { selectedResource: resourceId })}
          />
        );

      case 'closing':
        return (
          <EmergencyStepClosing
            title={step.title}
            subtitle={step.subtitle || ''}
            options={step.options || []}
            onComplete={(optionId) => {
              handleStepComplete(step.id, { selectedOption: optionId });
              handleFlowComplete();
            }}
          />
        );

      default:
        return (
          <View className='empty-state'>
            <Text className='empty-text'>未知步骤类型: {stepType}</Text>
          </View>
        );
    }
  };

  // 渲染进度指示器
  const renderProgress = () => {
    if (!currentFlow) return null;

    return (
      <View className='progress-indicator'>
        <View className='progress-bar'>
          {currentFlow.steps.map((_, index) => (
            <View
              key={index}
              className={`progress-dot ${index <= currentStep ? 'active' : ''}`}
            />
          ))}
        </View>
        <Text className='progress-text'>
          步骤 {currentStep + 1} / {currentFlow.steps.length}
        </Text>
      </View>
    );
  };

  // 渲染危机弹窗
  const renderCrisisModal = () => {
    if (!showCrisisModal) return null;

    return (
      <View className='crisis-modal'>
        <View className='crisis-overlay' onClick={() => setShowCrisisModal(false)} />
        <View className='crisis-content'>
          <Text className='crisis-title'>⚠️ 安全提醒</Text>
          <Text className='crisis-text'>
            我们注意到你可能正在经历一些困难。如果你感到不安全或有伤害自己的念头，请立即寻求帮助。
          </Text>
          <View className='crisis-actions'>
            <View className='crisis-btn primary' onClick={() => Taro.makePhoneCall({ phoneNumber: '400-161-9995' })}>
              <Text className='crisis-btn-text'>拨打希望24热线</Text>
            </View>
            <View className='crisis-btn' onClick={() => setShowCrisisModal(false)}>
              <Text className='crisis-btn-text'>我暂时安全</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className='emergency-page'>
      {/* 水墨背景装饰 */}
      <View className='ink-bg-decoration ink-bg-1' />
      <View className='ink-bg-decoration ink-bg-2' />

      {/* 页面头部 */}
      <View className='page-header'>
        <Text className='page-title'>情绪急救箱</Text>
        <Text className='page-subtitle'>EMERGENCY KIT</Text>
      </View>

      {/* 进度指示器 */}
      {renderProgress()}

      {/* 步骤内容 */}
      <View className='step-content'>
        {renderStep()}
      </View>

      {/* 危机弹窗 */}
      {renderCrisisModal()}

      {/* 悬浮导航栏 */}
      <FloatingNav />
    </View>
  );
}
