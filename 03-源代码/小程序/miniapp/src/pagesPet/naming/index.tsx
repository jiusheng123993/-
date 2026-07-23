import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import { interpretName, recommendNames } from '../../services/namingService'

export default function NamingPage() {
  const [tab, setTab] = useState<'interpret' | 'recommend'>('interpret')
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInterpret = async () => {
    if (!name || !breed || !birthDate) return
    setLoading(true)
    try {
      const res = await interpretName(name, breed, birthDate)
      setResult(res)
    } catch {
      setResult('解读服务暂时不可用，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  const handleRecommend = async () => {
    if (!breed || !birthDate || !gender) return
    setLoading(true)
    try {
      const res = await recommendNames(breed, birthDate, gender)
      setResult(res)
    } catch {
      setResult('推荐服务暂时不可用，请稍后再试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ minHeight: '100vh', background: '#0F1724', padding: '20px', paddingTop: '60px' }}>
      <Text style={{ color: '#F5D78C', fontSize: '22px', fontFamily: 'serif', display: 'block', textAlign: 'center', marginBottom: '24px' }}>给宝贝取名 ✦</Text>

      <View style={{ display: 'flex', marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(232,168,56,0.2)' }}>
        <View onClick={() => { setTab('interpret'); setResult('') }} style={{
          flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer',
          background: tab === 'interpret' ? 'rgba(232,168,56,0.15)' : 'transparent',
          color: tab === 'interpret' ? '#E8A838' : '#8899AA',
          fontSize: '13px',
        }}>
          <Text>我取好了，想看看寓意</Text>
        </View>
        <View onClick={() => { setTab('recommend'); setResult('') }} style={{
          flex: 1, padding: '12px', textAlign: 'center', cursor: 'pointer',
          background: tab === 'recommend' ? 'rgba(232,168,56,0.15)' : 'transparent',
          color: tab === 'recommend' ? '#E8A838' : '#8899AA',
          fontSize: '13px',
        }}>
          <Text>帮我想想</Text>
        </View>
      </View>

      {tab === 'interpret' ? (
        <View>
          <Input style={inputStyle} value={name} onInput={e => setName(e.detail.value)} placeholder='输入宠物名字' placeholderStyle='color:#556' />
          <Input style={inputStyle} value={breed} onInput={e => setBreed(e.detail.value)} placeholder='品种（如英短、田园猫）' placeholderStyle='color:#556' />
          <Input style={inputStyle} value={birthDate} onInput={e => setBirthDate(e.detail.value)} placeholder='出生日期（如2025-03-15）' placeholderStyle='color:#556' />
          <View onClick={handleInterpret} style={btnStyle}>
            <Text style={{ color: '#0F1724', fontWeight: 600 }}>{loading ? '解读中...' : '开始解读'}</Text>
          </View>
        </View>
      ) : (
        <View>
          <Input style={inputStyle} value={breed} onInput={e => setBreed(e.detail.value)} placeholder='品种（如英短、田园猫）' placeholderStyle='color:#556' />
          <Input style={inputStyle} value={birthDate} onInput={e => setBirthDate(e.detail.value)} placeholder='出生日期（如2025-03-15）' placeholderStyle='color:#556' />
          <View style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <View onClick={() => setGender('公')} style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', background: gender === '公' ? 'rgba(91,154,155,0.2)' : 'rgba(255,255,255,0.04)', border: gender === '公' ? '1px solid #5B9A9B' : '1px solid rgba(255,255,255,0.06)', color: gender === '公' ? '#5B9A9B' : '#8899AA' }}>
              <Text>♂ 公</Text>
            </View>
            <View onClick={() => setGender('母')} style={{ flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'center', background: gender === '母' ? 'rgba(224,133,107,0.2)' : 'rgba(255,255,255,0.04)', border: gender === '母' ? '1px solid #E0856B' : '1px solid rgba(255,255,255,0.06)', color: gender === '母' ? '#E0856B' : '#8899AA' }}>
              <Text>♀ 母</Text>
            </View>
          </View>
          <View onClick={handleRecommend} style={btnStyle}>
            <Text style={{ color: '#0F1724', fontWeight: 600 }}>{loading ? '推荐中...' : '帮我推荐'}</Text>
          </View>
        </View>
      )}

      {result && (
        <View style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: '16px',
          background: '#1A2332',
          border: '1px solid rgba(232,168,56,0.2)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <Text style={{ color: '#F5D78C', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{result}</Text>
        </View>
      )}
    </View>
  )
}

const inputStyle = {
  width: '100%',
  padding: '14px',
  marginBottom: '12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E8DFD5',
  fontSize: '14px',
  boxSizing: 'border-box' as const,
}

const btnStyle = {
  width: '100%',
  padding: '14px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #E8A838, #C88520)',
  textAlign: 'center' as const,
  marginTop: '8px',
}
