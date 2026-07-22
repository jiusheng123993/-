import { View, Text, Input } from '@tarojs/components'
import { useState, useCallback } from 'react'
import {
  GRIEF_FLOW_STEPS,
  getGriefStepMessage,
  getDisclaimer,
  detectExtremeEmotion,
  getCrisisMessage,
} from '../engines/emotion'
import type { GriefStep, GriefFlowState } from '../types/emotionTypes'
import CrisisReferralCard from './CrisisReferralCard'
import './GriefCompanion.scss'

interface GriefCompanionProps {
  petId: string
  petName: string
  petAvatar?: string
  species: 'dog' | 'cat'
  deceasedDate: string
  onComplete: () => void
}

const INITIAL_STATE: GriefFlowState = {
  currentStep: 'name',
  selectedFeeling: '',
  userMessage: '',
  connectedCount: 2847,
}

export default function GriefCompanion({
  petName,
  species,
  deceasedDate,
  onComplete,
}: GriefCompanionProps) {
  const [flowState, setFlowState] = useState<GriefFlowState>(INITIAL_STATE)
  const [inputText, setInputText] = useState('')
  const [showCrisisReferral, setShowCrisisReferral] = useState(false)

  const disclaimer = getDisclaimer('grief')
  const stepIndex = GRIEF_FLOW_STEPS.findIndex(s => s.step === flowState.currentStep)
  const stepConfig = GRIEF_FLOW_STEPS[stepIndex]
  const message = getGriefStepMessage(flowState.currentStep, petName, flowState.selectedFeeling)

  const handleSelectFeeling = useCallback((feeling: string) => {
    setFlowState(prev => ({ ...prev, selectedFeeling: feeling, currentStep: 'write' }))
  }, [])

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return
    if (detectExtremeEmotion(inputText.trim())) {
      setShowCrisisReferral(true)
    }
    setFlowState(prev => ({ ...prev, userMessage: inputText.trim(), currentStep: 'connect' }))
    setInputText('')
  }, [inputText])

  const handleSkipWrite = useCallback(() => {
    setFlowState(prev => ({ ...prev, currentStep: 'connect' }))
  }, [])

  const handleClose = useCallback(() => {
    setFlowState(prev => ({ ...prev, currentStep: 'close' }))
  }, [])

  const petLabel = species === 'cat' ? '猫咪' : '狗狗'

  return (
    <View className='grief-companion'>
      <View className='grief-companion__header'>
        <Text className='grief-companion__title'>🤍 纪念{petName}</Text>
        <Text className='grief-companion__subtitle'>
          {petLabel}·{deceasedDate ? `离开于${deceasedDate}` : '已离世'}
        </Text>
      </View>

      <View className='grief-companion__progress'>
        {GRIEF_FLOW_STEPS.map((s, i) => (
          <View
            key={s.step}
            className={`grief-companion__progress-dot ${i <= stepIndex ? 'grief-companion__progress-dot--active' : ''}`}
          />
        ))}
      </View>

      <View className='grief-companion__content'>
        <Text className='grief-companion__message'>{message}</Text>

        {flowState.currentStep === 'name' && stepConfig.options && (
          <View className='grief-companion__options'>
            {stepConfig.options.map(option => (
              <View
                key={option}
                className={`grief-companion__option ${flowState.selectedFeeling === option ? 'grief-companion__option--selected' : ''}`}
                onClick={() => handleSelectFeeling(option)}
              >
                <Text className='grief-companion__option-text'>{option}</Text>
              </View>
            ))}
          </View>
        )}

        {flowState.currentStep === 'write' && (
          <View className='grief-companion__write'>
            <Input
              className='grief-companion__input'
              value={inputText}
              onInput={e => setInputText(e.detail.value)}
              placeholder={stepConfig.placeholder || '说说你的感受...'}
              confirmType='send'
              onConfirm={handleSendMessage}
            />
            <View className='grief-companion__write-actions'>
              <View className='grief-companion__send-btn' onClick={handleSendMessage}>
                <Text className='grief-companion__send-text'>发送</Text>
              </View>
              <View className='grief-companion__skip-btn' onClick={handleSkipWrite}>
                <Text className='grief-companion__skip-text'>暂时不想</Text>
              </View>
            </View>
          </View>
        )}

        {flowState.currentStep === 'connect' && (
          <View className='grief-companion__connect'>
            <Text className='grief-companion__connect-count'>
              过去1个月，{flowState.connectedCount}人也经历了同样的失去
            </Text>
            <View className='grief-companion__connect-btn' onClick={handleClose}>
              <Text className='grief-companion__connect-btn-text'>继续</Text>
            </View>
          </View>
        )}

        {flowState.currentStep === 'close' && (
          <View className='grief-companion__close'>
            <Text className='grief-companion__close-message'>
              {petName}有你这样的家人，是{petName}的幸运。
            </Text>
            <Text className='grief-companion__close-sub'>
              如果需要，这里一直有
            </Text>
            <View className='grief-companion__complete-btn' onClick={onComplete}>
              <Text className='grief-companion__complete-text'>关闭</Text>
            </View>
          </View>
        )}
      </View>

      <Text className='grief-companion__disclaimer'>{disclaimer}</Text>

      {showCrisisReferral && (
        <CrisisReferralCard
          message={getCrisisMessage('grief')}
          severity='severe'
          triggerSource='extreme_emotion'
          onDismiss={() => setShowCrisisReferral(false)}
        />
      )}
    </View>
  )
}
