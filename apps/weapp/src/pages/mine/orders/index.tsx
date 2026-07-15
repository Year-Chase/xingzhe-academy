import { View, Text, ScrollView, Image } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import { API_BASE_URL as API } from '../../../config/api'
import { formatBeijingDateTime } from '../../../utils/date'
import { isLoggedIn, navigateToLoginWithRedirect, userAuthHeader } from '../../../utils/user'

const C = {
  bg: '#F7F6F2',
  white: '#FFFFFF',
  green: '#3F6B4F',
  dark: '#18231E',
  body: '#3E463F',
  neutral: '#7A8178',
  secondary: '#A6AAA2',
  lightGreen: '#EEF5EF',
  border: '#EDE9DF',
  amber: '#8A6D3B',
  amberBg: '#FFF9E5',
  danger: '#B35B4B',
}

interface OrderItem {
  id: number
  orderId: number
  activityId: number | null
  activityTitle: string
  activityCoverUrl: string
  activityStartTime: string | null
  activityLocation: string
  paymentMode: 'FULL' | 'PREPAY'
  payType: 'FULL' | 'PREPAY'
  orderStatus: string
  paymentStatus: string
  fullAmount: number
  amount: number
  orderPrepayAmount: number
  orderPostpayAmount: number
  paidAmount: number
  refundedAmount: number
  invoiceableAmount: number
  refundStatus: string
  postpayStatus: string
  postpayDate: string | null
  invoiceStatus: string
  canApplyInvoice: boolean
  invoiceBlockedReason: string
  canRequestRefund: boolean
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actingKey, setActingKey] = useState('')

  const load = async () => {
    if (!isLoggedIn()) {
      navigateToLoginWithRedirect({ returnUrl: '/pages/mine/orders/index', action: 'OPEN_ORDER' })
      return
    }
    setLoading(true); setError('')
    try {
      const res = await Taro.request({
        url: `${API}/users/me/orders`,
        header: userAuthHeader(),
      })
      setOrders(((res.data as any)?.items || []) as OrderItem[])
    } catch (_e) {
      console.error('[mine-orders] load failed')
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useDidShow(() => { load() })
  usePullDownRefresh(() => { load().then(() => Taro.stopPullDownRefresh()) })

  const completePostpay = async (order: OrderItem) => {
    if (actingKey) return
    setActingKey(`postpay-${order.orderId}`)
    try {
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/orders/${order.orderId}/postpay/mock-pay`,
        header: userAuthHeader(),
      })
      if ((res.data as any)?.postpayStatus === 'PAID') {
        Taro.showToast({ title: '后付款已完成', icon: 'success' })
        load()
      } else {
        Taro.showToast({ title: (res.data as any)?.error || '操作失败', icon: 'none' })
      }
    } catch (e) {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      setActingKey('')
    }
  }

  const submitInvoice = async (order: OrderItem) => {
    if (!order.canApplyInvoice || actingKey) {
      const reason = order.invoiceBlockedReason || invoiceActionReason(order)
      if (reason === '请先完善默认开票信息') {
        promptInvoiceProfile()
      } else {
        Taro.showToast({ title: reason, icon: 'none' })
      }
      return
    }
    setActingKey(`invoice-${order.orderId}`)
    try {
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/users/me/invoice-requests`,
        data: { orderId: order.orderId },
        header: { 'content-type': 'application/json', ...userAuthHeader() },
      })
      if (res.statusCode < 200 || res.statusCode >= 300) {
        const message = (res.data as any)?.message || '提交失败'
        if (message.includes('默认开票信息')) promptInvoiceProfile()
        else Taro.showToast({ title: message, icon: 'none' })
        return
      }
      Taro.showToast({ title: '开票申请已提交，请等待处理', icon: 'none' })
      load()
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '提交失败', icon: 'none' })
    } finally {
      setActingKey('')
    }
  }

  const promptInvoiceProfile = () => {
    Taro.showModal({
      title: '先完善开票信息',
      content: '请先在发票管理中保存默认开票信息，再提交开票申请。',
      confirmText: '去完善',
      success: res => {
        if (res.confirm) Taro.navigateTo({ url: '/pages/mine/invoices/index?returnToOrders=1' })
      },
    })
  }

  const requestRefund = (order: OrderItem) => {
    if (order.invoiceStatus === 'ISSUED') {
      Taro.showModal({
        title: '申请退款',
        content: '该订单已开票，请联系管理员处理退款。',
        showCancel: false,
        confirmText: '知道了',
      })
      return
    }
    Taro.showModal({
      title: '申请退款',
      content: '当前退款由管理员线下处理，本入口不会发起真实微信退款。请联系管理员确认退款事项。',
      showCancel: false,
      confirmText: '知道了',
    })
  }

  const goDetail = (order: OrderItem) => {
    if (!order.activityId) return
    Taro.navigateTo({ url: `/pages/activity/detail/index?id=${order.activityId}` })
  }

  if (loading) return <View style={center}><Text style={{ fontSize: '28rpx', color: C.secondary }}>加载中...</Text></View>
  if (error) return <View style={center}><Text style={{ fontSize: '30rpx', color: C.dark }}>{error}</Text></View>

  if (orders.length === 0) {
    return (
      <View style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48rpx' }}>
        <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block', marginBottom: '12rpx' }}>你还没有订单。</Text>
        <Text style={{ fontSize: '26rpx', color: C.neutral, textAlign: 'center', display: 'block', marginBottom: '28rpx' }}>报名活动后，支付、后付款、退款和发票会在这里处理。</Text>
        <View onClick={() => Taro.switchTab({ url: '/pages/index/index' })} style={primaryPill}><Text style={{ color: '#FFFFFF', fontSize: '28rpx' }}>去看看活动</Text></View>
      </View>
    )
  }

  return (
    <ScrollView scrollY style={{ height: '100vh', background: C.bg }}>
      <View style={{ padding: '24rpx 24rpx 80rpx' }}>
        <Text style={{ display: 'block', fontSize: '36rpx', fontWeight: '700', color: C.dark, marginBottom: '16rpx' }}>我的订单</Text>
        {orders.map(order => {
          const pendingPostpay = order.payType === 'PREPAY' && (order.postpayStatus === 'UNPAID' || order.postpayStatus === 'OVERDUE')
          const postpayDone = order.payType === 'PREPAY' && order.postpayStatus === 'PAID'
          const fullyRefunded = order.refundStatus === 'REFUNDED'
          const hasInvoiceableAmount = Number(order.invoiceableAmount || 0) > 0
          const formattedPostpayDate = formatBeijingDateTime(order.postpayDate)
          return (
            <View key={order.orderId} style={card}>
              <View onClick={() => goDetail(order)} style={{ display: 'flex', flexDirection: 'row' }}>
                <View style={{ width: '128rpx', height: '128rpx', borderRadius: '12rpx', background: C.lightGreen, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {order.activityCoverUrl ? <Image src={imgUrl(order.activityCoverUrl)} mode='aspectFill' style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: '36rpx', color: C.green }}>行</Text>}
                </View>
                <View style={{ flex: 1, marginLeft: '16rpx', minWidth: 0 }}>
                  <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.activityTitle || `订单 ${order.orderId}`}</Text>
                  <Text style={meta}>{order.activityLocation || '地点待确认'} · {fmtDate(order.activityStartTime)}</Text>
                  <View style={{ marginTop: '10rpx', display: 'flex', gap: '8rpx', flexWrap: 'wrap' }}>
                    <Tag label={order.payType === 'PREPAY' ? '预付+后付' : '全款'} color={C.green} bg={C.lightGreen} />
                    <Tag label={orderStatusLabel(order)} color={pendingPostpay ? C.amber : C.green} bg={pendingPostpay ? C.amberBg : C.lightGreen} />
                    <Tag label={invoiceStatusLabel(order.invoiceStatus)} color={order.invoiceStatus === 'ISSUED' ? C.green : order.invoiceStatus === 'REFUNDED' ? C.danger : C.amber} bg={order.invoiceStatus === 'NONE' ? '#F1F1EE' : order.invoiceStatus === 'ISSUED' ? C.lightGreen : C.amberBg} />
                  </View>
                </View>
              </View>

              <View style={{ marginTop: '18rpx', paddingTop: '16rpx', borderTop: `1rpx solid ${C.border}` }}>
                {order.payType === 'FULL' ? (
                  <InfoLine label='订单金额' value={money(order.paidAmount || order.amount || order.fullAmount)} />
                ) : (
                  <>
                    <InfoLine label='预付款' value={money(order.orderPrepayAmount || order.amount)} />
                    <InfoLine label='后付款' value={`${money(order.orderPostpayAmount)} · ${postpayStatusLabel(order.postpayStatus)}`} />
                    {formattedPostpayDate ? <InfoLine label='后付款日期' value={formattedPostpayDate} /> : null}
                  </>
                )}
                <InfoLine label='已退金额' value={money(order.refundedAmount)} />
                <InfoLine label='可开票金额' value={money(order.invoiceableAmount)} />
                <InfoLine label='创建时间' value={fmtFullDate(order.createdAt)} last />
              </View>

              <View style={{ marginTop: '18rpx', display: 'flex', flexDirection: 'row', gap: '12rpx', flexWrap: 'wrap' }}>
                {pendingPostpay ? (
                  <ActionButton primary disabled={actingKey === `postpay-${order.orderId}`} label={actingKey === `postpay-${order.orderId}` ? '处理中...' : '完成后付款'} onClick={() => completePostpay(order)} />
                ) : null}
                {!fullyRefunded && hasInvoiceableAmount ? (
                  <ActionButton label={order.invoiceStatus === 'NONE' ? '申请开票' : invoiceStatusLabel(order.invoiceStatus)} disabled={order.invoiceStatus !== 'NONE'} onClick={() => submitInvoice(order)} />
                ) : null}
                {order.canRequestRefund ? (
                  <ActionButton label='申请退款' muted={order.invoiceStatus === 'ISSUED'} onClick={() => requestRefund(order)} />
                ) : null}
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

function ActionButton({ label, onClick, primary, disabled, muted }: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean; muted?: boolean }) {
  return (
    <View onClick={() => { if (!disabled) onClick() }} style={{ padding: '10rpx 24rpx', borderRadius: '999rpx', background: disabled || muted ? '#E9EAE5' : primary ? C.green : C.lightGreen, border: disabled || primary ? 'none' : `1rpx solid rgba(63,107,79,0.12)` }}>
      <Text style={{ fontSize: '23rpx', color: disabled || muted ? C.secondary : primary ? '#FFFFFF' : C.green, fontWeight: '500' }}>{label}</Text>
    </View>
  )
}

function InfoLine({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '6rpx 0', borderBottom: last ? 'none' : '0' }}>
      <Text style={{ fontSize: '23rpx', color: C.neutral }}>{label}</Text>
      <Text style={{ fontSize: '23rpx', color: C.body, maxWidth: '420rpx', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

function Tag({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <View style={{ padding: '4rpx 12rpx', background: bg, borderRadius: '999rpx' }}><Text style={{ fontSize: '20rpx', color }}>{label}</Text></View>
}

function imgUrl(path: string): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return API + (path.startsWith('/') ? '' : '/') + path
}

function money(value: unknown): string {
  const n = Number(value ?? 0)
  return `¥${(Number.isFinite(n) ? n : 0).toFixed(2)}`
}

function fmtDate(s: string | null) {
  if (!s) return '时间待确认'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '时间待确认'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtFullDate(s: string | null) {
  if (!s) return '-'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function postpayStatusLabel(status: string) {
  if (status === 'PAID') return '后付款已完成'
  if (status === 'WAIVED') return '后付款已免除'
  if (status === 'OVERDUE') return '待后付'
  if (status === 'UNPAID') return '待后付'
  return '无后付款'
}

function invoiceStatusLabel(status: string) {
  if (status === 'ISSUED') return '已开票'
  if (status === 'PENDING' || status === 'REQUESTED') return '待开票'
  if (status === 'REFUNDED') return '已退款'
  return '未申请'
}

function orderStatusLabel(order: OrderItem) {
  if (order.refundStatus === 'REFUNDED') return '已退款'
  if (order.refundStatus === 'PARTIAL_REFUND') return '部分退款'
  if (order.payType === 'PREPAY' && (order.postpayStatus === 'UNPAID' || order.postpayStatus === 'OVERDUE')) return '待后付'
  if (order.payType === 'PREPAY' && order.postpayStatus === 'PAID') return '后付款已完成'
  if (order.orderStatus === 'PAID') return '已支付'
  return order.orderStatus || '订单'
}

function invoiceActionReason(order: OrderItem) {
  if (order.invoiceStatus !== 'NONE') return invoiceStatusLabel(order.invoiceStatus)
  if (order.refundStatus === 'REFUNDED') return '全额退款订单不可申请开票'
  if (order.invoiceableAmount <= 0) return '该订单暂无可开票金额'
  if (order.payType === 'PREPAY' && order.postpayStatus !== 'PAID' && order.postpayStatus !== 'WAIVED') return '后付款完成后可申请开票'
  return '请先完善默认开票信息'
}

const center: React.CSSProperties = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const card: React.CSSProperties = { marginBottom: '18rpx', background: C.white, borderRadius: '20rpx', padding: '20rpx', border: `1rpx solid ${C.border}` }
const meta: React.CSSProperties = { display: 'block', fontSize: '22rpx', color: C.neutral, marginTop: '4rpx', lineHeight: '1.5' }
const primaryPill: React.CSSProperties = { padding: '16rpx 48rpx', background: C.green, borderRadius: '999rpx', display: 'flex', alignItems: 'center', justifyContent: 'center' }
