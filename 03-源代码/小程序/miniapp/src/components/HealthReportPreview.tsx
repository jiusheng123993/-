import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import { HealthReportData } from '../types/reportTypes'
import './HealthReportPreview.scss'

interface Props {
  data: HealthReportData
}

export const HealthReportPreview: React.FC<Props> = ({ data }) => {
  const { pet, entries, symptoms, vaccines, generatedAt, period } = data

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'red': return '#ff4d4f'
      case 'orange': return '#ff7a45'
      case 'yellow': return '#ffc53d'
      default: return '#52c41a'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'done': return '已完成'
      case 'overdue': return '已逾期'
      default: return '待接种'
    }
  }

  return (
    <View className="health-report-preview" id="health-report-preview">
      <View className="report-header">
        <Text className="report-title">宠物健康报告</Text>
        <Text className="report-subtitle">{pet.name}的健康档案</Text>
        <Text className="report-period">报告周期：{period}</Text>
        <Text className="report-generated">生成时间：{generatedAt}</Text>
      </View>

      <View className="report-section">
        <Text className="section-title">宠物档案</Text>
        <View className="pet-info-grid">
          <View className="info-item">
            <Text className="info-label">姓名</Text>
            <Text className="info-value">{pet.name}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">品种</Text>
            <Text className="info-value">{pet.breed}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">性别</Text>
            <Text className="info-value">{pet.gender === 'male' ? '公' : '母'}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">绝育</Text>
            <Text className="info-value">{pet.neutered ? '已绝育' : '未绝育'}</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">体重</Text>
            <Text className="info-value">{pet.weight} kg</Text>
          </View>
          <View className="info-item">
            <Text className="info-label">出生日期</Text>
            <Text className="info-value">{pet.birthDate}</Text>
          </View>
        </View>

        {pet.allergies.length > 0 && (
          <View className="info-row">
            <Text className="info-label">过敏史：</Text>
            <Text className="info-value">{pet.allergies.join('、')}</Text>
          </View>
        )}

        {pet.medications.length > 0 && (
          <View className="info-row">
            <Text className="info-label">当前用药：</Text>
            <Text className="info-value">{pet.medications.join('、')}</Text>
          </View>
        )}

        {pet.chronicConditions.length > 0 && (
          <View className="info-row">
            <Text className="info-label">慢性病：</Text>
            <Text className="info-value">{pet.chronicConditions.join('、')}</Text>
          </View>
        )}
      </View>

      {entries.length > 0 && (
        <View className="report-section">
          <Text className="section-title">健康打卡记录（最近30天）</Text>
          <View className="entries-table">
            <View className="table-header">
              <Text className="th">日期</Text>
              <Text className="th">便便</Text>
              <Text className="th">食欲</Text>
              <Text className="th">精神</Text>
              <Text className="th">运动</Text>
            </View>
            {entries.map((entry, index) => (
              <View key={index} className="table-row">
                <Text className="td">{entry.date}</Text>
                <Text className="td">{entry.bowel}</Text>
                <Text className="td">{entry.appetite}</Text>
                <Text className="td">{entry.energy}</Text>
                <Text className="td">{entry.exercise}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {symptoms.length > 0 && (
        <View className="report-section">
          <Text className="section-title">症状记录</Text>
          {symptoms.map((symptom, index) => (
            <View key={index} className="symptom-card">
              <View className="symptom-header">
                <Text className="symptom-date">{symptom.date}</Text>
                <View
                  className="urgency-badge"
                  style={{ backgroundColor: getUrgencyColor(symptom.urgencyLevel) }}
                >
                  <Text className="urgency-text">
                    {symptom.urgencyLevel === 'red' ? '紧急' :
                     symptom.urgencyLevel === 'orange' ? '尽快就医' :
                     symptom.urgencyLevel === 'yellow' ? '关注' : '观察'}
                  </Text>
                </View>
              </View>
              <Text className="symptom-list">症状：{symptom.symptoms.join('、')}</Text>
              <Text className="ai-assessment">AI评估：{symptom.aiAssessment}</Text>
            </View>
          ))}
        </View>
      )}

      {vaccines.length > 0 && (
        <View className="report-section">
          <Text className="section-title">疫苗记录</Text>
          <View className="vaccine-list">
            {vaccines.map((vaccine, index) => (
              <View key={index} className="vaccine-item">
                <Text className="vaccine-name">{vaccine.name}</Text>
                <Text className="vaccine-status">{getStatusText(vaccine.status)}</Text>
                <Text className="vaccine-date">
                  {vaccine.dateGiven ? `接种日期：${vaccine.dateGiven}` : `预计接种：${vaccine.dateDue}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="report-footer">
        <Text className="disclaimer">
          本报告由星寰海AI宠物管家生成，仅供参考，不替代专业兽医诊断。
          如宠物出现健康问题，请及时就医。
        </Text>
        <Text className="report-brand">星寰海 · 有记忆的AI宠物管家</Text>
      </View>
    </View>
  )
}

export default HealthReportPreview
