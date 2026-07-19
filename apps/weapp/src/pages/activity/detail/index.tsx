import { View, Text, Button, ScrollView, Image, Swiper, SwiperItem } from '@tarojs/components'
import { useState, useEffect, useCallback } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { consumeLoginReturnAction, getUserId, isLoggedIn, navigateToLoginWithRedirect, userAuthHeader } from '../../../utils/user'
import { canOpenActivityLocation, openActivityLocation } from '../../../utils/location'

import { API_BASE_URL as API } from '../../../config/api'
import { formatBeijingDateTime } from '../../../utils/date'
import { getActivityPrice } from '../../../utils/priceEngine'
import navigationIcon from '../../../assets/icons/navigation-user-provided.png'

function ImgWithFallback({ src, style, mode = 'aspectFill' }: { src: string; style: React.CSSProperties; mode?: string }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return <Image src={src} mode={mode as any} style={style} onError={() => setFailed(true)} />
}

function AvatarCircle({ src, size, fontSize = '28rpx' }: { src?: string; size: string; fontSize?: string }) {
  const [failed, setFailed] = useState(false)
  const resolved = src ? imgUrl(src) : ''
  return (
    <View style={{ width: size, height: size, borderRadius: '50%', background: C.lightGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {resolved && !failed ? (
        <Image src={resolved} mode='aspectFill' style={{ width: size, height: size }} onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontSize, color: C.secondary }}>头像</Text>
      )}
    </View>
  )
}

function NavPointerIcon() {
  return (
    <Image src={navigationIcon} mode='aspectFit' style={{ width: '42rpx', height: '42rpx', marginLeft: '12rpx', flexShrink: 0 }} />
  )
}

function imgUrl(cover: string | undefined): string {
  if (!cover) return ''
  if (cover.startsWith('http')) return cover
  return API + (cover.startsWith('/') ? '' : '/') + cover
}

function safeFields(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  if (!raw) return []
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] } catch (e) { console.error('[activity-detail] parse error', e); return [] }
}

interface ActivityData {
  id: number; title: string; description: string; location: string
  category?: { id: string; name: string } | null
  locationName?: string; locationAddress?: string; locationLat?: number; locationLng?: number
  startTime: string; endTime: string; capacity: number; registeredCount: number
  coverImage: string; status: string; effectivePrice: number; effectivePriceLabel: string
  requiredUserInfoFields?: any; hasGroupQr?: boolean
  groupQrType?: string; groupQrImageUrl?: string; groupQrTitle?: string; groupQrDescription?: string
  registrationStartTime?: string; registrationEndTime?: string
  memoryImages?: any; memoryText?: string
  imageUrls?: any; contentBlocks?: any; pricingRules?: any
  price?: number; memberPrice?: number; lifetimeMemberPrice?: number
  paymentMode?: string; prepayAmount?: number; remainingAmount?: number
  createdAt: string
}

interface Participant {
  userId: string; avatarUrl: string; nickname: string; name: string
  gender: string; commonActivityCount: number; motto: string; status: string
}

type RegStatus = 'NOT_REGISTERED' | 'REGISTERED' | 'PAID' | 'CHECKED_IN' | 'EXPIRED'

const C = {
  bg: '#F7F6F2', white: '#FFFFFF', green: '#3F6B4F', dark: '#18231E',
  body: '#3E463F', neutral: '#7A8178', secondary: '#A6AAA2',
  lightGreen: '#EEF5EF', border: '#EDE9DF', disabledBg: '#E9EAE5', disabledText: '#8A9288',
}

const STATUS_LABEL: Record<RegStatus, string> = {
  NOT_REGISTERED: '可报名', REGISTERED: '待支付', PAID: '已报名', CHECKED_IN: '已签到', EXPIRED: '已过期',
}

const PLACEHOLDER_BG = 'linear-gradient(160deg, #DCE6E2 0%, #BED5C5 30%, #9AB8A8 65%, #789A85 100%)'
const GENDER_ICON: Record<string, string> = { '男': '♂', '女': '♀' }

export default function ActivityDetail() {
  const router = useRouter()
  const [id, setId] = useState(0)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [userStatus, setUserStatus] = useState<RegStatus>('NOT_REGISTERED')
  const [userType, setUserType] = useState<string>('普通用户')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [modalUser, setModalUser] = useState<Participant | null>(null)
  const [showPayConfirm, setShowPayConfirm] = useState(false)
  // V2.5C: group QR display
  const [showGroupQr, setShowGroupQr] = useState(false)
  const [groupQrFailed, setGroupQrFailed] = useState(false)
  // V2.8-D: Postpay order info
  const [orderInfo, setOrderInfo] = useState<any>(null)
  const [postpayActing, setPostpayActing] = useState(false)
  const [handledLoginAction, setHandledLoginAction] = useState(false)
  const [pendingLoginAction, setPendingLoginAction] = useState<any>(null)

  useEffect(() => { const p = router.params as any; if (p.id) setId(Number(p.id)) }, [router.params])
  useEffect(() => { if (id === 0) return; load(id) }, [id])
  useDidShow(() => {
    if (id === 0) return
    const action = consumeLoginReturnAction()
    if (action?.action === 'REGISTER' && String(action.activityId || '') === String(id)) {
      setPendingLoginAction(action)
      setHandledLoginAction(false)
    }
    load(id)
  })
  // V2.5C: check enrollSuccess to show group QR
  useEffect(() => {
    const p = router.params as any
    if (p?.enrollSuccess === '1') setShowGroupQr(true)
  }, [router.params])

  const load = useCallback(async (activityId: number) => {
    setLoading(true); setError('')
    try {
      const loggedIn = isLoggedIn()
      const authHeader = userAuthHeader()
      const [d, s, p, profileRes, orderRes] = await Promise.all([
        Taro.request({ url: `${API}/activity/${activityId}` }),
        loggedIn ? Taro.request({ url: `${API}/activity/${activityId}/status`, header: authHeader }) : Promise.resolve({ data: { status: 'NOT_REGISTERED' } }),
        Taro.request({ url: `${API}/activity/${activityId}/participants` }).catch(() => ({ data: [] })),
        loggedIn ? Taro.request({ url: `${API}/users/me/profile`, header: authHeader }).catch(() => ({ data: {} })) : Promise.resolve({ data: {} }),
        loggedIn ? Taro.request({ url: `${API}/activity/${activityId}/order-status`, header: authHeader }).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ])
      setActivity(d.data as ActivityData)
      setUserStatus((s.data as any).status || 'NOT_REGISTERED')
      setParticipants((p.data as Participant[]) || [])
      setUserType((profileRes.data as any)?.identityType || '普通用户')
      setOrderInfo((orderRes.data as any) || null)
    } catch (e) { console.error('[activity-detail] load', e); setError('加载失败，请下拉重试') }
    finally { setLoading(false) }
  }, [])

  const openEnrollmentStep = useCallback(() => {
    const cap = activity?.capacity ?? 0
    const reg = activity?.registeredCount ?? 0
    if (cap > 0 && reg >= cap) { Taro.showToast({ title: '活动名额已满', icon: 'none' }); return }

    // V2.5C: check requiredUserInfoFields
    const requiredFields = safeFields(activity?.requiredUserInfoFields)
    if (requiredFields.length > 0) {
      Taro.navigateTo({ url: `/pages/activity/registration-info/index?activityId=${id}` })
      return
    }

    // No required fields — use existing flow
    setShowPayConfirm(true)
  }, [activity, id])

  useEffect(() => {
    const p = router.params as any
    const shouldRegister = p?.loginAction === 'REGISTER' || pendingLoginAction?.action === 'REGISTER'
    if (!shouldRegister || handledLoginAction || loading || !activity || !isLoggedIn()) return
    if (userStatus !== 'NOT_REGISTERED' && userStatus !== 'REGISTERED') return
    setHandledLoginAction(true)
    setPendingLoginAction(null)
    openEnrollmentStep()
  }, [router.params, pendingLoginAction, handledLoginAction, loading, activity, userStatus, openEnrollmentStep])

  const handleEnroll = async () => {
    if (!isLoggedIn()) {
      navigateToLoginWithRedirect({
        returnUrl: `/pages/activity/detail/index?id=${id}&loginAction=REGISTER`,
        action: 'REGISTER',
        activityId: id,
        preferBack: true,
      })
      return
    }
    openEnrollmentStep()
  }

  const confirmPay = async () => {
    setShowPayConfirm(false)
    if (acting) return; setActing(true)
    try {
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/activity/${id}/enroll-pay`,
        header: { 'content-type': 'application/json', ...userAuthHeader() },
      })
      if ((res.data as any)?.status === 'PAID') {
        Taro.showToast({ title: '报名成功', icon: 'success' })
        Taro.setStorageSync('dirtyActivityId', id)
        setShowGroupQr(true)
        await load(id)
      } else if ((res.data as any)?.message) {
        Taro.showToast({ title: (res.data as any).message, icon: 'none' })
      }
    } catch (e) { console.error('[activity-detail] pay', e); Taro.showToast({ title: '操作失败，请重试', icon: 'none' }) }
    finally { setActing(false) }
  }

  const cancelPay = () => { setShowPayConfirm(false) }

  // V2.8-D: Mock complete postpay
  const handlePostpay = async () => {
    if (!orderInfo?.id || postpayActing) return
    setPostpayActing(true)
    try {
      const res = await Taro.request({
        method: 'POST',
        url: `${API}/orders/${orderInfo.id}/postpay/mock-pay`,
        header: userAuthHeader(),
      })
      if ((res.data as any)?.postpayStatus === 'PAID') {
        Taro.showToast({ title: '后付款已完成', icon: 'success' })
        await load(id)
      } else if ((res.data as any)?.error) {
        Taro.showToast({ title: (res.data as any).error, icon: 'none' })
      }
    } catch (e) { Taro.showToast({ title: '操作失败', icon: 'none' }) }
    finally { setPostpayActing(false) }
  }

  const goQR = () => {
    Taro.navigateTo({ url: `/pages/activity/qr/index?activityId=${id}&title=${encodeURIComponent(activity?.title || '')}` })
  }

  const fmtDate = (d: string) => { if (!d) return ''; const dt = new Date(d); const w = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()]; return `${dt.getMonth() + 1}月${dt.getDate()}日（周${w}）` }
  const fmtTimeOnly = (s: string | null | undefined) => { if (!s) return ''; const d = new Date(s); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  const fmtTimeRange = (s: string | null | undefined, e: string | null | undefined) => {
    const st = fmtDate(s || ''); const so = fmtTimeOnly(s)
    if (!s) return '—'
    if (!e) return `${st} ${so}`
    const et = fmtDate(e); const eo = fmtTimeOnly(e)
    if (st === et) return `${st} ${so} - ${eo}`
    return `${st} ${so} - ${et} ${eo}`
  }

  const reg = activity?.registeredCount ?? 0
  const cap = activity?.capacity ?? 0
  const isSelf = (p: Participant) => p.userId === getUserId()
  const aAny = (activity || {}) as any
  // V2.5.1: activity finished check
  const isFinished = activity ? (activity.endTime ? new Date(activity.endTime).getTime() < Date.now() : false) : false
  const memoryImagesArr = safeFields(aAny.memoryImages).filter(
    (v) => typeof v === 'string' && v.trim().length > 0
  )
  const memoryText = typeof aAny.memoryText === 'string' ? aAny.memoryText.trim() : ''
  const hasMemory = isFinished && (memoryImagesArr.length > 0 || memoryText.length > 0)
  const hasGroupQr = activity?.hasGroupQr && activity?.groupQrImageUrl
  const isPaid = userStatus === 'PAID' || userStatus === 'CHECKED_IN'

  // V2.8-B: imageUrls and contentBlocks
  const detailImages: string[] = (() => {
    const urls = safeFields(aAny.imageUrls).filter((v) => typeof v === 'string' && v.trim().length > 0)
    if (urls.length > 0) return urls
    // Fallback: use coverImage as single image
    if (activity?.coverImage) return [activity.coverImage]
    return []
  })()
  const contentBlocks: any[] = safeFields(aAny.contentBlocks)
  // Fallback: if contentBlocks empty, wrap description as a single text block
  const displayBlocks: any[] = contentBlocks.length > 0
    ? contentBlocks.filter((b: any) => b && typeof b === 'object')
    : (activity?.description ? [{ type: 'text', text: activity.description }] : [])

  // ── V2.8-C: Unified pricing via priceEngine ──
  const priceVM = getActivityPrice({ activity, identityType: userType })
  const payMode = priceVM.payMode
  const isPrepay = payMode === 'PREPAY'
  const isLoggedInNow = isLoggedIn()
  const orderPrepayAmount = Number(orderInfo?.orderPrepayAmount || 0)
  const orderPostpayAmount = Number(orderInfo?.orderPostpayAmount || 0)
  const orderFullAmount = Number(orderInfo?.amount || priceVM.myFull || 0)
  const totalPayAmount = orderInfo?.payType === 'PREPAY' || isPrepay ? orderPrepayAmount + orderPostpayAmount || Number(priceVM.myPrepay || 0) + Number(priceVM.myPostpay || 0) : orderFullAmount
  const currentPaidAmount = orderInfo
    ? (orderInfo.payType === 'PREPAY' ? orderPrepayAmount + (orderInfo.postpayStatus === 'PAID' ? orderPostpayAmount : 0) : Number(orderInfo.amount || 0))
    : 0
  const postpayStatusText = orderInfo?.postpayStatus === 'PAID' ? '已完成' : orderInfo?.postpayStatus === 'WAIVED' ? '已免除' : orderInfo?.postpayStatus === 'OVERDUE' ? '待支付（已逾期）' : orderInfo?.postpayStatus === 'UNPAID' ? '待支付' : '无'
  const overallPayStatusText = userStatus === 'CHECKED_IN' || userStatus === 'PAID'
    ? (orderInfo?.payType === 'PREPAY' && orderPostpayAmount > 0 && orderInfo.postpayStatus !== 'PAID' && orderInfo.postpayStatus !== 'WAIVED' ? '预付款已完成，后付款待完成' : '已完成')
    : userStatus === 'REGISTERED' ? '待支付' : '未报名'
  const canShowPostpayButton = orderInfo?.payType === 'PREPAY'
    && (orderInfo.postpayStatus === 'UNPAID' || orderInfo.postpayStatus === 'OVERDUE')
    && orderPostpayAmount > 0
    && isLoggedInNow

  // V2.5.1: toast helper for disabled actions
  const toastFinished = () => Taro.showToast({ title: '活动已结束', icon: 'none' })
  const handleGoQR = () => { if (isFinished) { toastFinished(); return }; goQR() }
  const handleGroupQr = () => { if (isFinished) { toastFinished(); return }; setShowGroupQr(true) }
  const goOrders = () => Taro.navigateTo({ url: '/pages/mine/orders/index' })
  const handleLocationTap = () => {
    if (canOpenActivityLocation(activity)) { openActivityLocation(activity); return }
    const text = (activity as any)?.locationAddress || (activity as any)?.locationName || activity?.location || ''
    if (text) {
      Taro.setClipboardData({ data: text })
      Taro.showToast({ title: '地点已复制', icon: 'success' })
    }
  }
  const handleBack = () => {
    const pages = Taro.getCurrentPages?.() || []
    if (pages.length > 1) {
      Taro.navigateBack()
      return
    }
    Taro.navigateTo({ url: '/pages/activity/list/index' })
  }

  if (loading) return <View style={{ padding: '120rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ color: C.secondary, fontSize: '28rpx' }}>加载中...</Text></View>
  if (error || !activity) return <View style={{ padding: '160rpx 32rpx', textAlign: 'center', minHeight: '100vh', background: C.bg }}><Text style={{ display: 'block', fontSize: '32rpx', color: C.body, marginBottom: '20rpx' }}>{error || '活动未找到'}</Text><Button onClick={() => load(id)} style={{ height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', lineHeight: '88rpx', border: 'none', padding: '0 56rpx' }}>重试</Button></View>

  return (
    <View style={{ minHeight: '100vh', background: C.bg, paddingBottom: '260rpx' }}>
      <View style={{ height: '112rpx', padding: '48rpx 24rpx 0', display: 'flex', flexDirection: 'row', alignItems: 'center', background: C.bg }}>
        <View onClick={handleBack} style={{ width: '64rpx', height: '64rpx', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: '40rpx', color: C.dark }}>&lt;</Text>
        </View>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: '30rpx', fontWeight: '700', color: C.dark }}>活动详情</Text>
        <View style={{ width: '64rpx', height: '64rpx' }} />
      </View>

      {/* 1. Title + status pill */}
      <View style={{ margin: '0 32rpx', padding: '32rpx 0 24rpx' }}>
        {activity.category?.name ? (
          <View style={{ alignSelf: 'flex-start', marginBottom: '14rpx', padding: '6rpx 16rpx', borderRadius: '999rpx', background: C.lightGreen, display: 'flex' }}>
            <Text style={{ fontSize: '23rpx', color: C.green, fontWeight: '600' }}>{activity.category.name}</Text>
          </View>
        ) : null}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: '40rpx', fontWeight: '700', color: C.dark, lineHeight: '1.25' }}>{activity.title}</Text>
          <View style={{ flexShrink: 0, marginLeft: '16rpx', marginTop: '6rpx', padding: '6rpx 16rpx', borderRadius: '999rpx', background: C.lightGreen }}>
            <Text style={{ fontSize: '22rpx', color: C.green, fontWeight: '500' }}>{STATUS_LABEL[userStatus]}</Text>
          </View>
        </View>
      </View>

      {/* 2. Cover / Image Swiper */}
      {detailImages.length > 0 ? (
        <View style={{ margin: '0 32rpx', height: '460rpx', borderRadius: '16rpx', overflow: 'hidden' }}>
          <Swiper indicatorDots indicatorColor="rgba(255,255,255,0.4)" indicatorActiveColor="#FFFFFF" autoplay circular style={{ width: '100%', height: '100%' }}>
            {detailImages.map((img: string, i: number) => (
              <SwiperItem key={i}>
                <ImgWithFallback src={imgUrl(img)} style={{ width: '100%', height: '100%' }} />
              </SwiperItem>
            ))}
          </Swiper>
        </View>
      ) : (
        <View style={{ margin: '0 32rpx', height: '460rpx', borderRadius: '16rpx', overflow: 'hidden', background: PLACEHOLDER_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {activity.coverImage ? (
            <ImgWithFallback src={imgUrl(activity.coverImage)} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Text style={{ fontSize: '72rpx', color: 'rgba(24,35,30,0.15)' }}>行者学社</Text>
          )}
        </View>
      )}

      {/* 3. Info card */}
      <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.06)' }}>
        {(aAny.registrationStartTime || aAny.registrationEndTime) && (
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
            <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>报名时间</Text>
            <Text style={{ flex: 1, fontSize: '26rpx', color: C.body, lineHeight: '1.5' }}>{fmtTimeRange(aAny.registrationStartTime, aAny.registrationEndTime)}</Text>
          </View>
        )}
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>活动时间</Text>
          <Text style={{ flex: 1, fontSize: '26rpx', color: C.body, lineHeight: '1.5' }}>{fmtTimeRange(activity.startTime, activity.endTime)}</Text>
        </View>
        {/* V2.6E: Location card — full row clickable, icon replaces '导航' text */}
        <View onClick={handleLocationTap}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>地点</Text>
          <Text style={{ flex: 1, fontSize: '26rpx', color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(activity as any).locationName || activity.location || '活动地点待确认'}
          </Text>
          <NavPointerIcon />
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', paddingBottom: '18rpx', marginBottom: '18rpx', borderBottom: '1rpx solid #EDE9DF' }}>
          <Text style={{ width: '140rpx', flexShrink: 0, fontSize: '26rpx', color: C.neutral }}>名额</Text>
          <Text style={{ fontSize: '26rpx', color: C.body }}>
            {cap > 0 && (reg / cap) >= 0.6
              ? <Text><Text style={{ fontWeight: '700', color: C.dark }}>已报名 {reg}</Text><Text style={{ color: C.secondary }}> / {cap}</Text></Text>
              : <Text style={{ color: C.secondary }}>{cap > 0 ? `${cap} 个名额` : '名额不限'}</Text>
            }
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '16rpx' }}>费用与付款</Text>
          {!isLoggedInNow ? (
            <Text style={{ fontSize: '26rpx', color: C.secondary }}>请登录后查看价格</Text>
          ) : !priceVM.priceReady ? (
            <Text style={{ fontSize: '26rpx', color: C.secondary }}>价格待确认</Text>
          ) : (
            <View>
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', gap: '8rpx', marginBottom: '10rpx' }}>
                {priceVM.detailHasStrikethrough ? (
                  <>
                    <Text style={{ fontSize: '22rpx', color: C.secondary, textDecoration: 'line-through' }}>{priceVM.detailStrikethroughPrice}</Text>
                    {priceVM.showIdentityLabel ? (
                      <Text style={{ fontSize: '20rpx', color: '#4A7C5D', background: '#EEF5EF', borderRadius: '6rpx', padding: '2rpx 10rpx' }}>{priceVM.identityLabel}</Text>
                    ) : null}
                  </>
                ) : null}
                <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark }}>{priceVM.detailCurrentPrice}</Text>
              </View>

              <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral, marginTop: '4rpx' }}>活动总费用：¥{totalPayAmount}</Text>
              {isPrepay || orderInfo?.payType === 'PREPAY' ? (
                <>
                  <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral, marginTop: '4rpx' }}>预付款金额及状态：¥{orderPrepayAmount || Number(priceVM.myPrepay || 0)} / {userStatus === 'PAID' || userStatus === 'CHECKED_IN' ? '已完成' : '待支付'}</Text>
                  <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral, marginTop: '4rpx' }}>后付款金额及状态：¥{orderPostpayAmount || Number(priceVM.myPostpay || 0)} / {postpayStatusText}</Text>
                  {(orderInfo?.postpayDate || priceVM.detailPostpayDateText) ? (
                    <Text style={{ display: 'block', fontSize: '22rpx', color: C.secondary, marginTop: '4rpx' }}>
                      后付款截止时间：{formatBeijingDateTime(orderInfo?.postpayDate) || priceVM.detailPostpayDateText}
                    </Text>
                  ) : null}
                </>
              ) : null}
              <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral, marginTop: '4rpx' }}>当前已付金额：¥{currentPaidAmount}</Text>
              <Text style={{ display: 'block', fontSize: '24rpx', color: C.neutral, marginTop: '4rpx' }}>整体付款状态：{overallPayStatusText}</Text>

              {canShowPostpayButton ? (
                <View onClick={handlePostpay} style={{ marginTop: '16rpx', width: '100%', height: '72rpx', borderRadius: '999rpx', background: postpayActing ? '#E9EAE5' : C.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: '28rpx', fontWeight: '600', color: postpayActing ? '#8A9288' : '#FFFFFF' }}>{postpayActing ? '处理中...' : '完成后付款支付'}</Text>
                </View>
              ) : null}

              <View onClick={goOrders} style={{ marginTop: '16rpx', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text style={{ fontSize: '24rpx', color: C.green, fontWeight: '600' }}>查看付款记录 &gt;</Text>
              </View>
            </View>
          )}
        </View>

      </View>

      {/* 4. 活动介绍 — V2.8-B: contentBlocks or description fallback */}
      {displayBlocks.length > 0 && (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '30rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '20rpx' }}>活动介绍</Text>
          {displayBlocks.map((block: any, i: number) => {
            if (block.type === 'image') {
              const url = block.url || ''
              if (!url) return null
              return (
                <View key={i} style={{ marginTop: i > 0 ? '16rpx' : 0 }}>
                  <ImgWithFallback src={imgUrl(url)} mode="widthFix" style={{ width: '100%', borderRadius: '12rpx' }} />
                </View>
              )
            }
            return (
              <Text key={i} style={{ fontSize: '27rpx', color: C.body, lineHeight: '1.65', display: 'block', marginTop: i > 0 ? '16rpx' : 0 }}>
                {block.text || ''}
              </Text>
            )
          })}
        </View>
      )}

      {/* V2.5C: Group QR for paid users — only button, opens popup */}
      {isPaid && hasGroupQr && (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '20rpx 28rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: isFinished ? 0.5 : 1 }}>
          <View>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: isFinished ? C.disabledText : C.dark, display: 'block' }}>{activity.groupQrTitle || '加入活动群'}{isFinished ? '（活动已结束）' : ''}</Text>
            <Text style={{ fontSize: '23rpx', color: C.neutral, display: 'block', marginTop: '4rpx' }}>{activity.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'}</Text>
          </View>
          <Button onClick={handleGroupQr} disabled={isFinished}
            style={{ flexShrink: 0, marginLeft: '16rpx', height: '60rpx', borderRadius: '999rpx', background: isFinished ? C.disabledBg : C.lightGreen, border: `1rpx solid ${C.border}`, color: isFinished ? C.disabledText : C.green, fontSize: '26rpx', lineHeight: '60rpx', padding: '0 24rpx' }}
          >查看</Button>
        </View>
      )}

      {/* V2.5.1: Memory module for finished activities */}
      {isFinished && hasMemory && (
        <View style={{ margin: '24rpx 32rpx 0', background: C.white, borderRadius: '24rpx', padding: '28rpx 32rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, display: 'block', marginBottom: '6rpx' }}>活动回忆</Text>
          <Text style={{ fontSize: '23rpx', color: C.neutral, display: 'block', marginBottom: '16rpx' }}>那些走过的路，都会成为你的行者印记。</Text>
          {memoryText ? <Text style={{ fontSize: '26rpx', color: C.body, lineHeight: '1.65', display: 'block', marginBottom: '16rpx' }}>{memoryText}</Text> : null}
          {memoryImagesArr.length > 0 && (
            <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: '12rpx' }}>
                {memoryImagesArr.map((img: string, i: number) => (
                  <ImgWithFallback key={i} src={img.startsWith('http') ? img : `${API}${img.startsWith('/') ? '' : '/'}${img}`} mode='aspectFill' style={{ width: '200rpx', height: '160rpx', borderRadius: '12rpx', flexShrink: 0 }} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* 理念提示卡 */}
      <View style={{ margin: '24rpx 32rpx 0', padding: '24rpx', background: C.lightGreen, borderRadius: '18rpx', border: '1rpx solid rgba(46,125,90,0.12)' }}>
        <Text style={{ fontSize: '28rpx', fontWeight: '700', color: C.green, display: 'block', lineHeight: '1.5' }}>这不是一次打卡式活动。</Text>
        <Text style={{ fontSize: '25rpx', color: C.neutral, display: 'block', marginTop: '8rpx', lineHeight: '1.5' }}>我们会用一段真实的时间，把身体从屏幕里带出来。</Text>
      </View>

      {/* 报名须知 */}
      <View style={{ margin: '22rpx 32rpx 0', padding: '24rpx', background: C.white, borderRadius: '18rpx', border: '1rpx solid #EDE9DF', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: '26rpx', color: C.neutral }}>适合人群 · 注意事项 · 报名须知</Text>
        <Text style={{ fontSize: '24rpx', color: C.secondary }}>→</Text>
      </View>

      {/* 已报名行者 */}
      <View style={{ margin: '24rpx 32rpx 0' }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12rpx' }}>
          <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark }}>已报名行者</Text>
          <Text style={{ fontSize: '24rpx', color: C.secondary }}>{participants.length} 人报名</Text>
        </View>
        <View style={{ background: C.white, borderRadius: '24rpx', padding: '24rpx', border: '1rpx solid #EDE9DF', boxShadow: '0 8rpx 24rpx rgba(24,35,30,0.05)' }}>
          {participants.length === 0 ? (
            <View style={{ padding: '28rpx', background: C.bg, borderRadius: '18rpx', textAlign: 'center' }}>
              <Text style={{ fontSize: '26rpx', color: C.secondary }}>还没有行者报名，成为第一个出发的人。</Text>
            </View>
          ) : (
            <ScrollView scrollX style={{ whiteSpace: 'nowrap' }}>
              <View style={{ display: 'flex', flexDirection: 'row', gap: '20rpx' }}>
                {participants.map((p, i) => {
                  const self = isSelf(p)
                  return (
                    <View key={i} onClick={() => setModalUser(p)} style={{ width: '96rpx', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <AvatarCircle src={p.avatarUrl} size='72rpx' fontSize='22rpx' />
                      <Text style={{ fontSize: '22rpx', color: C.body, marginTop: '10rpx', maxWidth: '88rpx', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        {p.nickname}{self ? '（我）' : ''}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Modal: participant detail */}
      {modalUser && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setModalUser(null)}>
          <View style={{ width: '620rpx', maxWidth: 'calc(100vw - 96rpx)', background: C.white, borderRadius: '28rpx', padding: '40rpx 36rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <View style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <View onClick={() => setModalUser(null)} style={{ width: '48rpx', height: '48rpx', borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '30rpx', color: C.neutral }}>×</Text>
              </View>
            </View>
            <View style={{ display: 'flex', justifyContent: 'center', marginTop: '12rpx' }}>
              <AvatarCircle src={modalUser.avatarUrl} size='128rpx' fontSize='28rpx' />
            </View>
            <Text style={{ fontSize: '34rpx', fontWeight: '700', color: C.dark, textAlign: 'center', marginTop: '24rpx' }}>
              {modalUser.nickname || '行者'}{isSelf(modalUser) ? '（我）' : ''}
              {modalUser.gender !== '未知' && <Text style={{ fontSize: '26rpx', color: C.green, marginLeft: '8rpx' }}>{GENDER_ICON[modalUser.gender] || ''}</Text>}
            </Text>
            {!isSelf(modalUser) && (
              <Text style={{ fontSize: '26rpx', color: C.green, textAlign: 'center', marginTop: '14rpx' }}>共同参加 {modalUser.commonActivityCount} 场活动</Text>
            )}
            {modalUser.motto ? (
              <View style={{ background: '#FBFAF6', border: '1rpx solid #EDE9DF', borderRadius: '18rpx', padding: '24rpx', marginTop: '28rpx' }}>
                <Text style={{ fontSize: '22rpx', color: C.secondary, display: 'block', marginBottom: '4rpx' }}>简介</Text>
                <Text style={{ fontSize: '26rpx', color: C.body, lineHeight: '1.6' }}>「{modalUser.motto}」</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Modal: mock 支付确认 (V2.5C: shows regInfo if present) */}
      {showPayConfirm && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={cancelPay}>
          <View style={{ width: '560rpx', background: C.white, borderRadius: '24rpx', padding: '40rpx 36rpx 32rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <Text style={{ fontSize: '32rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block' }}>{priceVM.paymentDialogTitle}</Text>
            <Text style={{ fontSize: '26rpx', color: C.neutral, textAlign: 'center', display: 'block', marginTop: '12rpx' }}>{activity?.title || ''}</Text>
            <Text style={{ fontSize: '28rpx', fontWeight: '600', color: C.dark, textAlign: 'center', display: 'block', marginTop: '16rpx' }}>{priceVM.paymentDialogMainText}</Text>
            {priceVM.paymentDialogSubText ? (
              <Text style={{ fontSize: '22rpx', color: C.secondary, textAlign: 'center', display: 'block', marginTop: '8rpx' }}>{priceVM.paymentDialogSubText}</Text>
            ) : null}
            <View style={{ display: 'flex', flexDirection: 'row', gap: '20rpx', marginTop: '36rpx' }}>
              <Button onClick={cancelPay} style={{ flex: 1, height: '88rpx', borderRadius: '999rpx', background: C.white, border: '1rpx solid #EDE9DF', color: C.neutral, fontSize: '30rpx', lineHeight: '88rpx', textAlign: 'center' }}>取消</Button>
              <Button onClick={confirmPay} disabled={acting} style={{ flex: 2, height: '88rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '30rpx', fontWeight: '600', lineHeight: '88rpx', border: 'none', textAlign: 'center' }}>{acting ? '...' : priceVM.paymentButtonText}</Button>
            </View>
          </View>
        </View>
      )}

      {/* Bottom fixed button */}
      <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '20rpx 32rpx', paddingBottom: 'calc(20rpx + env(safe-area-inset-bottom))', background: 'rgba(247,246,242,0.96)', boxShadow: '0 -8rpx 24rpx rgba(24,35,30,0.06)', zIndex: 10 }}>
        {isFinished && (userStatus === 'NOT_REGISTERED' || userStatus === 'REGISTERED') && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', color: C.disabledText, fontWeight: '600' }}>活动已结束</Text>
          </View>
        )}
        {isFinished && userStatus === 'PAID' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', color: C.disabledText, fontWeight: '600' }}>活动已结束</Text>
          </View>
        )}
        {isFinished && userStatus === 'CHECKED_IN' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '30rpx', color: C.disabledText, fontWeight: '600' }}>已签到</Text>
          </View>
        )}
        {!isFinished && userStatus === 'NOT_REGISTERED' && (
          <Button onClick={handleEnroll} disabled={acting}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: acting ? C.disabledBg : C.green, color: acting ? C.disabledText : '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
          >{acting ? '...' : '立即报名'}</Button>
        )}
        {!isFinished && userStatus === 'REGISTERED' && (
          <Button onClick={handleEnroll} disabled={acting}
            style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: acting ? C.disabledBg : C.green, color: acting ? C.disabledText : '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
          >{acting ? '...' : '完成支付后查看二维码'}</Button>
        )}
        {!isFinished && userStatus === 'PAID' && (
          <View style={{ display: 'flex', flexDirection: 'column', gap: '12rpx' }}>
            <Button onClick={goQR}
              style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.green, color: '#FFFFFF', fontSize: '32rpx', fontWeight: '600', lineHeight: '92rpx', border: 'none', textAlign: 'center' }}
            >查看签到二维码</Button>
            {hasGroupQr && (
              <Button onClick={handleGroupQr}
                style={{ width: '100%', height: '72rpx', borderRadius: '999rpx', background: C.lightGreen, border: `1rpx solid ${C.border}`, color: C.green, fontSize: '28rpx', lineHeight: '72rpx', textAlign: 'center' }}
              >加入活动群</Button>
            )}
          </View>
        )}
        {!isFinished && userStatus === 'CHECKED_IN' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>已签到</Text>
          </View>
        )}
        {!isFinished && userStatus === 'EXPIRED' && (
          <View style={{ width: '100%', height: '92rpx', borderRadius: '999rpx', background: C.disabledBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32rpx', color: C.disabledText, fontWeight: '600' }}>暂无签到二维码</Text>
          </View>
        )}
      </View>

      {/* V2.5C: Group QR popup modal */}
      {showGroupQr && hasGroupQr && (
        <View style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowGroupQr(false)}>
          <View style={{ width: '560rpx', background: C.white, borderRadius: '24rpx', padding: '36rpx 32rpx 28rpx', boxShadow: '0 16rpx 48rpx rgba(0,0,0,0.16)' }} onClick={(e) => e.stopPropagation()}>
            <View style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8rpx' }}>
              <View onClick={() => setShowGroupQr(false)} style={{ width: '48rpx', height: '48rpx', borderRadius: '50%', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: '30rpx', color: C.neutral }}>×</Text>
              </View>
            </View>
            <Text style={{ fontSize: '30rpx', fontWeight: '700', color: C.dark, textAlign: 'center', display: 'block' }}>{activity!.groupQrTitle || '加入活动群'}</Text>
            <Text style={{ fontSize: '25rpx', color: C.neutral, textAlign: 'center', display: 'block', marginTop: '8rpx' }}>{activity!.groupQrDescription || '活动通知、集合安排和现场事项将在群内同步'}</Text>
            <View style={{ textAlign: 'center', marginTop: '20rpx' }}>
              {!groupQrFailed ? (
                <Image src={activity!.groupQrImageUrl!} mode='widthFix' style={{ width: '300rpx', borderRadius: '12rpx' }} onError={() => setGroupQrFailed(true)} />
              ) : (
                <View style={{ padding: '32rpx', background: C.lightGreen, borderRadius: '12rpx' }}>
                  <Text style={{ fontSize: '26rpx', color: C.neutral }}>活动群二维码暂不可用，请联系活动组织者。</Text>
                </View>
              )}
            </View>
            <View style={{ marginTop: '12rpx', padding: '12rpx', background: C.lightGreen, borderRadius: '8rpx' }}>
              <Text style={{ fontSize: '24rpx', color: C.neutral, textAlign: 'center', display: 'block' }}>长按识别二维码加入活动群</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
