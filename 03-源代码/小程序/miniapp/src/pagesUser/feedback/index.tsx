/**
 * 意见反馈页面
 * NPS 满意度评分 + 文字反馈
 */
import { useState, useCallback } from 'react'
import { View, Text, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { submitNpsFeedback } from '../../services/feedbackService'
import { useThemeClass } from '../../hooks/useThemeClass'
import './index.scss'

const SCORE_LABELS = ['极差', '很差', '较差', '一般', '还行', '不错', '满意', '很好', '非常好', '极好', '完美']

export default function FeedbackPage() {
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const themeClass = useThemeClass()

  const handleSubmit = useCallback(async () => {
    if (score === null) {
      Taro.showToast({ title: '请先选择评分', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const success = await submitNpsFeedback({
        score,
        feedback: feedback.trim() || undefined,
        trigger_event: 'manual_feedback',
      })
      if (success) {
        setSubmitted(true)
        Taro.showToast({ title: '感谢您的反馈！', icon: 'success' })
      } else {
        Taro.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
      }
    } catch {
      Taro.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }, [score, feedback])

  if (submitted) {
    return (
      <View className={`feedback-page ${themeClass}`}>
        <View className='feedback-success'>
          <Text className='feedback-success__icon'>🎉</Text>
          <Text className='feedback-success__title'>感谢您的反馈</Text>
          <Text className='feedback-success__desc'>我们会认真对待每一条建议，不断优化产品体验</Text>
          <View className='feedback-success__btn' onClick={() => Taro.navigateBack()}>
            <Text>返回</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className={`feedback-page ${themeClass}`}>
      <View className='feedback-header'>
        <Text className='feedback-header__title'>意见反馈</Text>
        <Text className='feedback-header__desc'>您的建议对我们很重要，帮助我们做得更好</Text>
      </View>

      {/* NPS 评分 */}
      <View className='feedback-section'>
        <Text className='feedback-section__title'>整体满意度</Text>
        <View className='feedback-score-row'>
          {Array.from({ length: 11 }, (_, i) => (
            <View
              key={i}
              className={`feedback-score-item ${score === i ? 'feedback-score-item--active' : ''}`}
              onClick={() => setScore(i)}
            >
              <Text className='feedback-score-item__num'>{i}</Text>
            </View>
          ))}
        </View>
        {score !== null && (
          <Text className='feedback-score-label'>{score}分 - {SCORE_LABELS[score]}</Text>
        )}
      </View>

      {/* 文字反馈 */}
      <View className='feedback-section'>
        <Text className='feedback-section__title'>详细描述（选填）</Text>
        <Textarea
          className='feedback-textarea'
          placeholder='请描述您遇到的问题或建议...'
          value={feedback}
          onInput={(e: { detail: { value: string } }) => setFeedback(e.detail.value)}
          maxlength={500}
          autoHeight
        />
        <Text className='feedback-textarea__count'>{feedback.length}/500</Text>
      </View>

      {/* 提交按钮 */}
      <View
        className={`feedback-submit ${submitting ? 'feedback-submit--disabled' : ''}`}
        onClick={submitting ? undefined : handleSubmit}
      >
        <Text className='feedback-submit__text'>
          {submitting ? '提交中...' : '提交反馈'}
        </Text>
      </View>
    </View>
  )
}