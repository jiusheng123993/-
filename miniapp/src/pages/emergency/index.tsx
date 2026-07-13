// 星寰海 v2.0 - 急救流程页面
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import './index.scss';
import { useEmergency } from '@/hooks/useEmergency';
import CrisisAlert from '@/components/CrisisAlert';
import EmergencyStepNaming from '@/components/EmergencyStepNaming';
import EmergencyStepWriting from '@/components/EmergencyStepWriting';
import EmergencyStepAction from '@/components/EmergencyStepAction';
import EmergencyStepConnect from '@/components/EmergencyStepConnect';
import EmergencyStepClosing from '@/components/EmergencyStepClosing';

export function EmergencyPage() {
  const emergency = useEmergency();
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);

  // 从URL获取flowId并启动流程
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const flowIdFromUrl = params.flowId as string | undefined;
    if (flowIdFromUrl && !emergency.session) {
      emergency.startFlow(flowIdFromUrl);
    }
  }, [emergency]);

  // 危机检测
  useEffect(() => {
    if (emergency.isCrisisActive) {
      setShowCrisisAlert(true);
    }
  }, [emergency.isCrisisActive]);

  // 完成流程时执行安全检查
  const handleComplete = async () => {
    // 执行安全检查（使用默认强度值）
    const safetyResult = emergency.checkSafety(5, emergency.currentStep + 1);

    if (safetyResult.needsFollowUp) {
      Taro.showModal({
        title: '情绪变化提醒',
        content: safetyResult.reason || '你的情绪强度有较大变化，建议关注自己的状态。',
        confirmText: '我知道了',
        showCancel: false,
      });
    }

    await emergency.complete();
  };

  const handleNext = async () => {
    await emergency.nextStep();
  };

  const handlePrevious = () => {
    emergency.previousStep();
  };

  const handleCloseCrisis = () => {
    setShowCrisisAlert(false);
    emergency.recoverFromCrisis();
  };

  // 如果没有会话，显示提示
  if (!emergency.session && !emergency.isLoading) {
    return (
      <div className="emergency-page">
        <div className="no-session">
          <p>请先从首页选择一个情绪入口</p>
        </div>
      </div>
    );
  }

  return (
    <div className="emergency-page">
      {/* 进度指示器 */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${emergency.progressPercentage}%` }} />
        <span className="progress-text">
          {emergency.currentStep + 1} / {emergency.allSteps.length}
        </span>
      </div>

      {/* 当前步骤内容 */}
      <div className="step-content">
        {emergency.currentStepConfig ? (
          <>
            <h2 className="step-title">{emergency.currentStepConfig.title}</h2>
            <p className="step-description">{emergency.currentStepConfig.description}</p>

            {/* 根据组件类型渲染不同内容 */}
            <div className="step-component">
              {renderStepComponent(
                emergency.currentStepConfig.component,
                emergency.currentStepConfig.config,
                emergency,
                setShowCrisisAlert
              )}
            </div>
          </>
        ) : (
          <div className="loading">加载中...</div>
        )}
      </div>

      {/* 导航按钮 */}
      <div className="navigation-buttons">
        {emergency.currentStep > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handlePrevious}
            disabled={emergency.isLoading}
          >
            上一步
          </button>
        )}

        {!emergency.isCompleted ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={emergency.isLoading || emergency.currentStep >= emergency.allSteps.length - 1}
          >
            {emergency.currentStep >= emergency.allSteps.length - 1 ? '完成' : '下一步'}
          </button>
        ) : (
          <button className="btn btn-success" onClick={handleComplete}>
            完成
          </button>
        )}
      </div>

      {/* 危机弹窗 */}
      {showCrisisAlert && emergency.crisisLevel !== 'mild' && (
        <CrisisAlert
          level={emergency.crisisLevel}
          onClose={handleCloseCrisis}
        />
      )}
    </div>
  );
}

export default EmergencyPage;
function renderStepComponent(
  componentType: string,
  config: any,
  emergency: ReturnType<typeof useEmergency>,
  setShowCrisisAlert: (show: boolean) => void
): React.ReactNode {
  // 获取流程颜色 - 从第一个步骤的配置中获取
  const firstStepConfig = emergency.allSteps[0]?.config;
  const flowColor = (firstStepConfig as any)?.flowColor || '#667eea';

  switch (componentType) {
    // 新组件类型
    case 'EmergencyStepNaming':
      return (
        <EmergencyStepNaming
          title={(config?.subtitle as string) || ''}
          subtitle={undefined}
          options={(config?.options as any[]) || []}
          flowColor={flowColor}
          onSelect={(optionId) => {
            emergency.updateContent(emergency.currentStep, { selectedOption: optionId });
          }}
        />
      );

    case 'EmergencyStepWriting':
      return (
        <EmergencyStepWriting
          title={(config?.subtitle as string) || ''}
          subtitle={undefined}
          prompts={(config?.prompts as any[]) || []}
          flowColor={flowColor}
          onComplete={(text) => {
            emergency.updateContent(emergency.currentStep, { writing: text });
          }}
          onCrisisDetected={(level) => {
            if (level === 'severe' || level === 'moderate') {
              setShowCrisisAlert(true);
              emergency.detectCrisis('检测到危机关键词');
            }
          }}
        />
      );

    case 'EmergencyStepAction':
      return (
        <EmergencyStepAction
          title={(config?.subtitle as string) || ''}
          subtitle={undefined}
          options={(config?.options as any[]) || []}
          flowColor={flowColor}
          defaultOptionId={config?.defaultOptionId as string}
          onSelect={(optionId) => {
            emergency.updateContent(emergency.currentStep, { selectedAction: optionId });
          }}
        />
      );

    case 'EmergencyStepConnect':
      return (
        <EmergencyStepConnect
          title={(config?.subtitle as string) || ''}
          subtitle={undefined}
          flowColor={flowColor}
          resourceType={(config?.resourceType as any) || 'peer'}
          resources={(config?.resources as any[]) || []}
          supportMessages={(config?.supportMessages as any[]) || []}
          onResourceClick={(resourceId) => {
            emergency.updateContent(emergency.currentStep, { selectedResource: resourceId });
          }}
        />
      );

    case 'EmergencyStepClosing':
      return (
        <EmergencyStepClosing
          title={(config?.subtitle as string) || ''}
          subtitle={undefined}
          flowColor={flowColor}
          summaries={(config?.summaries as any[]) || []}
          encouragements={(config?.encouragements as any[]) || []}
          showGratitude={(config?.showGratitude as boolean) || false}
          onComplete={(data) => {
            emergency.updateContent(emergency.currentStep, { gratitude: data.gratitude });
          }}
        />
      );

    // 旧组件类型（兼容）
    case 'TextInput':
      return (
        <textarea
          className="text-input"
          placeholder="在这里写下你的感受..."
          rows={6}
          onChange={(e) => {
            const result = emergency.detectCrisis(e.target.value);
            if (result.detected && result.level !== 'mild') {
              setShowCrisisAlert(true);
            }
          }}
        />
      );

    case 'ColorSelector':
      return (
        <div className="color-selector">
          <div className="color-options">
            {['#ff5252', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#333', '#fff'].map((color) => (
              <div
                key={color}
                className="color-option"
                style={{ backgroundColor: color }}
                onClick={() => emergency.updateContent(emergency.currentStep, { color })}
              />
            ))}
          </div>
        </div>
      );

    case 'ActionSelector':
      return (
        <div className="action-selector">
          <div className="action-options">
            {['深呼吸', '喝水', '站起来走走', '听音乐'].map((action) => (
              <button
                key={action}
                className="action-option"
                onClick={() => emergency.updateContent(emergency.currentStep, { action })}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      );

    case 'ConnectMessage':
      return (
        <div className="connect-message">
          <p>今晚有3,247人也没睡</p>
          <p>你不是一个人在感受这些</p>
        </div>
      );

    case 'ClosingSummary':
      return (
        <div className="closing-summary">
          <p>你已经完成了所有步骤</p>
          <p>记住，你的感受很重要</p>
        </div>
      );

    case 'BreathingAnimation':
      return (
        <div className="breathing-animation">
          <div className="breathing-circle">
            <p>吸气4秒...</p>
            <p>屏住7秒...</p>
            <p>呼气8秒...</p>
          </div>
        </div>
      );

    case 'ChoiceSelector':
      return (
        <div className="choice-selector">
          <div className="choice-options">
            {['是想法', '是事实', '不确定'].map((choice) => (
              <button
                key={choice}
                className="choice-option"
                onClick={() => emergency.updateContent(emergency.currentStep, { choice })}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      );

    case 'ControlCircle':
      return (
        <div className="control-circle">
          <p>我能控制的：</p>
          <p>我不能控制的：</p>
        </div>
      );

    case 'AllowanceMessage':
      return (
        <div className="allowance-message">
          <p>允许自己有这样的感受</p>
          <p>这很正常</p>
        </div>
      );

    case 'SelfCareSelector':
      return (
        <div className="selfcare-selector">
          <div className="selfcare-options">
            {['睡觉', '白噪音', '热水澡', '关通知'].map((option) => (
              <button
                key={option}
                className="selfcare-option"
                onClick={() => emergency.updateContent(emergency.currentStep, { option })}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );

    case 'SocialProof':
      return (
        <div className="social-proof">
          <p>今夜有3,247人也没睡</p>
          <p>你不是一个人</p>
        </div>
      );

    case 'TreeholeLink':
      return (
        <div className="treehole-link">
          <p>去树洞看看别人的故事</p>
          <button className="btn btn-link">进入树洞</button>
        </div>
      );

    case 'GoodnightExchange':
      return (
        <div className="goodnight-exchange">
          <p>给一个陌生人说句晚安？</p>
          <p>你也会收到一句</p>
        </div>
      );

    case 'ColorResponse':
      return (
        <div className="color-response">
          <p>每种颜色都有它的意义</p>
          <p>红色代表愤怒，蓝色代表平静...</p>
        </div>
      );

    case 'AudioSelector':
      return (
        <div className="audio-selector">
          <p>选一首音乐，只听声音</p>
          <div className="audio-options">
            {['雨声', '海浪', '森林', '钢琴'].map((audio) => (
              <button key={audio} className="audio-option">
                {audio}
              </button>
            ))}
          </div>
        </div>
      );

    default:
      return <div className="default-component">{componentType}</div>;
  }
}
