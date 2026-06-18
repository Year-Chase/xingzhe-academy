import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'

interface Activity {
  id: number
  title: string
  status: string
  createdAt: string
}

export default function Index() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch(`${API_BASE}/activity`)
        const data = await res.json()

        // 兼容后端返回结构（如果是数组直接用）
        setActivities(Array.isArray(data) ? data : [])
      } catch (err) {
         console.error('fetch activity error:', err)

         setError('接口请求失败，已使用本地数据')

  // fallback mock（防崩）
          setActivities([
          { id: 1, title: '晨跑打卡', status: 'active', createdAt: '2026-06-16' },
          { id: 2, title: '周末骑行', status: 'pending', createdAt: '2026-06-15' }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <View style={{ padding: '20px' }}>
      <Text style={{ fontSize: '24px', fontWeight: 'bold', display: 'block', marginBottom: '20px' }}>
        行者 V3 - 活动列表
      </Text>

      {loading && (
        <Text style={{ display: 'block', marginBottom: '10px' }}>
          加载中...
        </Text>
      )}
      {error && (
  <Text style={{ display: 'block', marginBottom: '10px', color: 'red' }}>
    {error}
  </Text>
      )}
      {activities.map((activity) => (
        <View
          key={activity.id}
          style={{
            background: '#fff',
            padding: '16px',
            marginBottom: '12px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <Text style={{ fontSize: '16px', fontWeight: 'bold', display: 'block' }}>
            {activity.title}
          </Text>

          <Text style={{ fontSize: '12px', color: '#999', display: 'block', marginTop: '4px' }}>
            状态: {activity.status} | {activity.createdAt}
          </Text>
        </View>
      ))}
    </View>
  )
}