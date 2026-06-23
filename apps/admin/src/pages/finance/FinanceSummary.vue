<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { get } from '@/api/client'

interface FinanceSummary { totalRevenue: number; totalRefund: number; netRevenue: number; orderCount: number; paidOrderCount: number; refundedOrderCount: number; partialRefundOrderCount: number; refundRate: number }

const summary = ref<FinanceSummary | null>(null)
const loading = ref(false)

const fetch = async () => {
  loading.value = true
  try { summary.value = await get<FinanceSummary>('/admin/finance/summary') }
  catch { summary.value = null }
  finally { loading.value = false }
}

onMounted(fetch)
</script>

<template>
  <div>
    <h2 style="font-size: 24px; font-weight: 700; color: #18231E; margin: 0 0 24px;">财务概览</h2>
    <div v-if="loading" style="padding: 40px; text-align: center; color: #8A9288;">加载中...</div>
    <div v-else-if="summary" style="display: flex; flex-direction: column; gap: 20px;">
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
        <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #EDE9DF; box-shadow: 0 2px 8px rgba(24,35,30,0.04);">
          <div style="font-size: 13px; color: #8A9288; margin-bottom: 8px;">总收入</div>
          <div style="font-size: 32px; font-weight: 700; color: #18231E;">¥{{ summary.totalRevenue }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 24px; border: 1px solid #EDE9DF; box-shadow: 0 2px 8px rgba(24,35,30,0.04);">
          <div style="font-size: 13px; color: #8A9288; margin-bottom: 8px;">总退款</div>
          <div style="font-size: 32px; font-weight: 700; color: #B35B4B;">¥{{ summary.totalRefund }}</div>
        </div>
        <div style="background: #EEF5EF; border-radius: 12px; padding: 24px; border: 1px solid rgba(46,125,90,0.12);">
          <div style="font-size: 13px; color: #2E7D5A; margin-bottom: 8px;">净收入</div>
          <div style="font-size: 32px; font-weight: 700; color: #2E7D5A;">¥{{ summary.netRevenue }}</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
        <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; border: 1px solid #EDE9DF;">
          <div style="font-size: 13px; color: #8A9288;">总订单</div><div style="font-size: 28px; font-weight: 700; margin-top: 8px; color: #18231E;">{{ summary.orderCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; border: 1px solid #EDE9DF;">
          <div style="font-size: 13px; color: #8A9288;">已退款订单</div><div style="font-size: 28px; font-weight: 700; margin-top: 8px; color: #18231E;">{{ summary.refundedOrderCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; border: 1px solid #EDE9DF;">
          <div style="font-size: 13px; color: #8A9288;">部分退款</div><div style="font-size: 28px; font-weight: 700; margin-top: 8px; color: #18231E;">{{ summary.partialRefundOrderCount }}</div>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 20px; border: 1px solid #EDE9DF;">
          <div style="font-size: 13px; color: #8A9288;">退款率</div><div style="font-size: 28px; font-weight: 700; margin-top: 8px; color: #18231E;">{{ (summary.refundRate * 100).toFixed(1) }}%</div>
        </div>
      </div>
    </div>
  </div>
</template>
