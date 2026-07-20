import { View, Text, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import './index.scss'

const AGREEMENT_CONTENT: Record<string, { title: string; content: string }> = {
  user: {
    title: '用户协议',
    content: '<h3>一、服务条款</h3><p>星寰海（以下简称"本应用"）是一款宠物健康管理工具，为用户提供宠物健康打卡、食物安全查询、症状初筛、疫苗管理等服务。</p><h3>二、用户责任</h3><p>1. 用户应确保提供的宠物信息真实准确。</p><p>2. 本应用提供的健康建议仅供参考，不替代专业兽医诊断。</p><p>3. 用户应遵守相关法律法规，不得利用本应用从事违法活动。</p><h3>三、免责声明</h3><p>1. 本应用的症状初筛功能基于规则引擎，仅供参考，不构成医疗诊断。</p><p>2. 食物安全数据来源于公开资料，可能存在更新不及时的情况。</p><p>3. 因用户自身原因导致的宠物健康问题，本应用不承担责任。</p><h3>四、隐私保护</h3><p>我们重视用户隐私保护，具体隐私政策请参阅《隐私政策》。</p><h3>五、服务变更</h3><p>我们保留随时修改服务内容和本协议的权利，修改后的协议将在应用内公示。</p>'
  },
  privacy: {
    title: '隐私政策',
    content: '<h3>一、信息收集</h3><p>我们收集以下信息用于提供服务：</p><p>1. 微信授权信息：用于登录和身份验证。</p><p>2. 宠物信息：品种、年龄、体重等，用于提供个性化健康建议。</p><p>3. 健康数据：打卡记录、症状记录、疫苗记录等，用于健康趋势分析。</p><h3>二、信息使用</h3><p>我们仅将收集的信息用于：</p><p>1. 提供和改善服务。</p><p>2. 发送服务通知（打卡提醒、疫苗提醒等）。</p><p>3. 生成健康趋势报告。</p><h3>三、信息保护</h3><p>1. 我们采用加密存储保护用户数据。</p><p>2. 未经用户同意，我们不会向第三方共享用户个人信息。</p><p>3. 我们会采取合理措施保护数据安全。</p><h3>四、用户权利</h3><p>1. 用户有权查看、修改、删除自己的个人信息。</p><p>2. 用户有权撤回授权同意。</p><p>3. 用户有权注销账号。</p><h3>五、未成年人保护</h3><p>我们高度重视未成年人信息保护，不会主动收集未成年人个人信息。</p>'
  }
}

export default function AgreementPage() {
  const [agreementType, setAgreementType] = useState<'user' | 'privacy'>('user')

  useEffect(() => {
    const instance = Taro.getCurrentInstance()
    const type = instance.router?.params?.type
    if (type === 'user' || type === 'privacy') {
      setAgreementType(type)
    }
  }, [])

  const agreement = AGREEMENT_CONTENT[agreementType]

  return (
    <View className='agreement-page'>
      <View className='agreement-page__header'>
        <Text className='agreement-page__title'>{agreement.title}</Text>
      </View>
      <View className='agreement-page__content'>
        <RichText nodes={agreement.content} />
      </View>
    </View>
  )
}
