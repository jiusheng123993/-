import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { useFamilyStore } from '../../../stores/familyStore'

export default function FamilyDashboard() {
  const { currentFamily, members, fetchFamilies } = useFamilyStore()

  useEffect(() => {
    fetchFamilies()
  }, [])

  if (!currentFamily) {
    return (
      <View
        style={{
          minHeight: '100vh',
          background: '#0F1724',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ textAlign: 'center', padding: '40px' }}>
          <Text
            style={{
              color: '#F5D78C',
              fontSize: '20px',
              fontFamily: 'serif',
              display: 'block',
              marginBottom: '16px',
            }}
          >
            还没有创建家庭
          </Text>
          <View
            style={{
              padding: '12px 32px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #E8A838, #C88520)',
              display: 'inline-block',
            }}
          >
            <Text style={{ color: '#0F1724', fontSize: '14px', fontWeight: 600 }}>
              创建家庭
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View
      style={{
        minHeight: '100vh',
        background: '#0F1724',
        padding: '20px',
        paddingTop: '60px',
      }}
    >
      <Text
        style={{
          color: '#F5D78C',
          fontSize: '22px',
          fontFamily: 'serif',
          display: 'block',
          textAlign: 'center',
          marginBottom: '4px',
        }}
      >
        {currentFamily.name}
      </Text>
      <Text
        style={{
          color: '#8899AA',
          fontSize: '13px',
          textAlign: 'center',
          marginBottom: '24px',
          display: 'block',
        }}
      >
        {members.length}位家人
      </Text>

      <View
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {members.map((m: any, idx: number) => (
          <View
            key={idx}
            style={{
              flex: '1 1 calc(50% - 6px)',
              padding: '16px',
              borderRadius: '16px',
              background: '#1A2332',
              border: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
            }}
          >
            <View
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                margin: '0 auto 8px',
                background: ['#8CAD7E', '#E0856B', '#5B9A9B', '#F5D78C'][idx % 4],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: idx === 3 ? '#1A2332' : '#fff',
                fontSize: '18px',
                fontWeight: 600,
              }}
            >
              <Text>{['青', '花', '墨', '雪'][idx % 4]}</Text>
            </View>
            <Text style={{ color: '#E8DFD5', fontSize: '14px' }}>
              {['青橘', '花花', '墨团', '小雪'][idx % 4]}
            </Text>
            <Text
              style={{
                color: '#8899AA',
                fontSize: '11px',
                display: 'block',
                marginTop: '2px',
              }}
            >
              {m.role || ['老大', '团宠', '新成员', '守护星'][idx % 4]}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ display: 'flex', gap: '12px' }}>
        <View
          style={{
            flex: 1,
            padding: '20px',
            borderRadius: '16px',
            background: '#1A2332',
            textAlign: 'center',
            border: '1px solid rgba(232,168,56,0.2)',
          }}
        >
          <Text style={{ fontSize: '28px', display: 'block' }}>🧬</Text>
          <Text
            style={{
              color: '#E8DFD5',
              fontSize: '13px',
              marginTop: '8px',
              display: 'block',
            }}
          >
            家族图谱
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            padding: '20px',
            borderRadius: '16px',
            background: '#1A2332',
            textAlign: 'center',
            border: '1px solid rgba(232,168,56,0.2)',
          }}
        >
          <Text style={{ fontSize: '28px', display: 'block' }}>📅</Text>
          <Text
            style={{
              color: '#E8DFD5',
              fontSize: '13px',
              marginTop: '8px',
              display: 'block',
            }}
          >
            家庭日历
          </Text>
        </View>
      </View>
    </View>
  )
}
