/**
 * 意见反馈页面
 * NPS 满意度评分 + 文字反馈
 */
import { useState, useCallback } from 'react'
import { View, Text, Textarea, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { submitNpsFeedback } from '../../services/feedbackService'
import { useThemeClass } from '../../hooks/useThemeClass'
import contactQr from '../../assets/contact-qr.jpg'
import './index.scss'

const SCORE_LABELS = ['极差', '很差', '较差', '一般', '还行', '不错', '满意', '很好', '非常好', '极好', '完美']
const CONTACT_WECHAT = 'qiqi82016_'

export default function FeedbackPage() {
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const themeClass = useThemeClass()

  // 复制运营微信号，方便用户加微信
  const copyWx = useCallback(() => {
    Taro.setClipboardData({ data: CONTACT_WECHAT })
  }, [])

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

      {/* 联系我们：微信二维码 + 微信号 */}
      <View className='feedback-contact'>
        <Text className='feedback-contact__title'>想直接找我们？</Text>
        <View className='feedback-contact__row'>
          <Text className='feedback-contact__wx'>
            微信号：<Text className='feedback-contact__id'>{CONTACT_WECHAT}</Text>
          </Text>
          <View className='feedback-contact__copy' onClick={copyWx}>
            <Text>复制</Text>
          </View>
        </View>
        <Image className='feedback-contact__qr' src={contactQr} mode='aspectFit' />
        <Text className='feedback-contact__hint'>扫码或搜索微信号添加，备注「星河宠记」</Text>
      </View>
    </View>
  )
}
