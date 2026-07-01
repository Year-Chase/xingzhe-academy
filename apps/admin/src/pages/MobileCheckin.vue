<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { post, get } from '@/api/client'
import { MessagePlugin } from 'tdesign-vue-next'

interface Activity { id: number; title: string; startTime: string; status: string }
interface CheckinResult { success: boolean; message: string; status?: string; userId?: string; activityId?: number }

const activities = ref<Activity[]>([])
const selectedActivityId = ref<number | null>(null)
const code = ref('')
const loading = ref(false)
const checkingIn = ref(false)
const recentResults = ref<CheckinResult[]>([])
const message = ref('')
const msgType = ref<'success'|'warn'|'error'>('success')

onMounted(async () => {
  try {
    const data = await get<{ items: Activity[] }>('/admin/activity', { page: 1, limit: 200, status: 'PUBLISHED' })
    activities.value = (data.items || []).filter((a: Activity) => a.status === 'PUBLISHED')
    if (activities.value.length > 0) selectedActivityId.value = activities.value[0].id
  } catch (e) { console.error('load activities', e) }
})

async function doCheckin() {
  if (!selectedActivityId.value || !code.value.trim()) {
    MessagePlugin.warning('请选择活动并输入核销码')
    return
  }
  checkingIn.value = true
  message.value = ''
  try {
    const res = await post<CheckinResult>(`/admin/activity/${selectedActivityId.value}/checkin`, { code: code.value.trim() })
    msgType.value = 'success'
    message.value = res.message || '签到成功'
    recentResults.value.unshift({ ...res })
    if (recentResults.value.length > 20) recentResults.value = recentResults.value.slice(0, 20)
    code.value = ''
  } catch (e: any) {
    msgType.value = 'error'
    message.value = e?.response?.data?.message || e?.message || '核销失败'
    recentResults.value.unshift({ success: false, message: message.value })
    if (recentResults.value.length > 20) recentResults.value = recentResults.value.slice(0, 20)
  } finally { checkingIn.value = false }
}
</script>

<template>
  <div style="max-width: 480px; margin: 0 auto; padding: 24px 16px;">
    <h2 style="font-size: 22px; font-weight: 700; color: #18231E; margin: 0 0 20px;">活动核销</h2>

    <!-- Activity selector -->
    <div style="margin-bottom: 16px;">
      <label style="color: #8A9288; font-size: 13px; display: block; margin-bottom: 4px;">选择活动</label>
      <select v-model="selectedActivityId"
        style="width: 100%; height: 44px; border-radius: 8px; border: 1px solid #EDE9DF; padding: 0 12px; font-size: 15px; background: #fff;">
        <option v-for="a in activities" :key="a.id" :value="a.id">{{ a.title }}</option>
      </select>
    </div>

    <!-- Code input -->
    <div style="margin-bottom: 20px;">
      <label style="color: #8A9288; font-size: 13px; display: block; margin-bottom: 4px;">核销码</label>
      <input v-model="code" type="text" placeholder="输入或粘贴核销码"
        style="width: 100%; height: 52px; border-radius: 8px; border: 1px solid #EDE9DF; padding: 0 14px; font-size: 16px; box-sizing: border-box;"
        @keyup.enter="doCheckin" />
    </div>

    <!-- Check-in button -->
    <button @click="doCheckin" :disabled="checkingIn"
      style="width: 100%; height: 52px; border-radius: 12px; background: #2E7D5A; border: none; color: #fff; font-size: 18px; font-weight: 600; cursor: pointer;">
      {{ checkingIn ? '核销中...' : '确认核销' }}
    </button>

    <!-- Result -->
    <div v-if="message"
      style="margin-top: 16px; padding: 14px 16px; border-radius: 10px; font-size: 14px;"
      :style="{ background: msgType === 'success' ? '#EEF5EF' : msgType === 'warn' ? '#FFF8E5' : '#FDF0EE', color: msgType === 'success' ? '#2E7D5A' : msgType === 'warn' ? '#8A6D3B' : '#B35B4B', border: '1px solid ' + (msgType === 'success' ? '#C8E6C9' : msgType === 'warn' ? '#FFE082' : '#EF9A9A') }">
      {{ message }}
    </div>

    <!-- Recent results -->
    <div v-if="recentResults.length > 0" style="margin-top: 28px;">
      <h3 style="font-size: 16px; font-weight: 600; color: #18231E; margin: 0 0 12px;">最近核销记录</h3>
      <div v-for="(r, i) in recentResults" :key="i"
        style="padding: 10px 12px; margin-bottom: 8px; border-radius: 8px; font-size: 13px;"
        :style="{ background: r.success ? '#F7F6F2' : '#FDF0EE', border: '1px solid ' + (r.success ? '#EDE9DF' : '#EF9A9A') }">
        <span :style="{ color: r.success ? '#2E7D5A' : '#B35B4B', fontWeight: 500 }">{{ r.success ? '✓' : '✗' }}</span>
        <span style="color: #4E5A52; margin-left: 8px;">{{ r.message }}</span>
      </div>
    </div>
  </div>
</template>
