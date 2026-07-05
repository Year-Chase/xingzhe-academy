/**
 * V2.8-C Price Engine — unified price calculation & display text generation
 *
 * Single source of truth for all activity price rendering across:
 * - Activity list cards (listPriceText)
 * - Activity detail page (detailMainPriceText, detailSubLines)
 * - Enrollment/payment dialog (paymentDialogTitle, paymentDialogMainText, paymentDialogSubText, paymentButtonText)
 *
 * Rules:
 * - FULL: normalFull = normal user fullAmount, myFull = current user fullAmount
 * - PREPAY: normalFull = normal user (prepay+postpay), myFull = current user (prepay+postpay)
 * - showDiscount when myFull < normalFull AND both > 0
 * - Discount display: strikethrough normal price + current identity price
 */

// ── Types ──

export interface PriceEngineInput {
  activity: any
  identityType?: string | null
}

export interface ActivityPriceViewModel {
  identityType: string
  payMode: 'FULL' | 'PREPAY'
  normalFull: number          // 普通用户 total price
  myFull: number              // current user total price
  myPrepay: number            // current user prepay portion (0 for FULL)
  myPostpay: number           // current user postpay portion (0 for FULL)
  normalPrepay: number        // normal user prepay portion (0 for FULL)
  postpayDate: string | null  // postpay date (PREPAY only)
  showDiscount: boolean       // myFull < normalFull
  priceReady: boolean         // has pricing data at all
  // Display strings for list card
  listPriceText: string
  // Display strings for detail page
  detailMainPriceText: string     // e.g. "¥999" or "¥999 ¥799"
  detailHasStrikethrough: boolean
  detailStrikethroughPrice: string  // e.g. "¥999"
  detailCurrentPrice: string        // e.g. "¥799"
  detailSubLines: string[]         // PREPAY: ["预付款：¥699", "后付款：¥101"]
  detailPostpayDateText: string    // "后付款日期：2026年7月31日"
  // Display strings for payment dialog
  paymentDialogTitle: string
  paymentDialogMainText: string
  paymentDialogSubText: string | null
  paymentButtonText: string
  // Identity label
  showIdentityLabel: boolean    // showDiscount && identityType !== '普通用户'
  identityLabel: string         // e.g. "会员" — the identity type name
}

// ── Helpers ──

function safeArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (!raw) return []
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : [] } catch { return [] }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const day = d.getDate()
    return `${y}年${m}月${day}日`
  } catch { return dateStr }
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '¥0'
  return '¥' + n
}

// ── Main engine ──

export function getActivityPrice(input: PriceEngineInput): ActivityPriceViewModel {
  const { activity, identityType } = input
  const safeIdentityType = identityType || '普通用户'
  const aAny = (activity || {}) as any

  const pricingRules = safeArray(aAny.pricingRules)
  const payMode = (aAny.paymentMode || 'FULL') as 'FULL' | 'PREPAY'
  const postpayDate = (aAny.postpayDate || aAny.remainingPayDate || null) as string | null

  // Legacy price fields for fallback
  const legacyPrice = Number(aAny.price ?? 0)
  const legacyMemberPrice = Number(aAny.memberPrice ?? 0)
  const legacyLifetimePrice = Number(aAny.lifetimeMemberPrice ?? 0)
  const legacyPrepay = Number(aAny.prepayAmount ?? 0)
  const legacyRemaining = Number(aAny.remainingAmount ?? 0)

  // ── Extract pricing from rules or legacy ──
  let normalFull = 0
  let myFull = 0
  let myPrepay = 0
  let myPostpay = 0
  let normalPrepay = 0

  if (pricingRules.length > 0) {
    const normalRule = pricingRules.find((r: any) => r.userType === '普通用户' && r.enabled !== false)
    let myRule = pricingRules.find((r: any) => r.userType === safeIdentityType && r.enabled !== false)
      || normalRule
      || { fullAmount: 0, prepayAmount: 0, postpayAmount: 0 }

    if (payMode === 'FULL') {
      normalFull = Number(normalRule?.fullAmount ?? legacyPrice)
      myFull = Number(myRule?.fullAmount ?? 0)
      if (myFull === 0 && myRule?.userType !== '普通用户') {
        myFull = normalFull // fallback: no specific price, use normal
      }
      myPrepay = 0
      myPostpay = 0
      normalPrepay = 0
    } else {
      // PREPAY: total = prepay + postpay
      normalPrepay = Number(normalRule?.prepayAmount ?? 0)
      const normalPostpay = Number(normalRule?.postpayAmount ?? 0)
      normalFull = normalPrepay + normalPostpay
      myPrepay = Number(myRule?.prepayAmount ?? 0)
      myPostpay = Number(myRule?.postpayAmount ?? 0)
      myFull = myPrepay + myPostpay
      if (myFull === 0 && myRule?.userType !== '普通用户') {
        myPrepay = normalPrepay
        myPostpay = normalPostpay
        myFull = normalFull
      }
    }
  } else {
    // Legacy fallback — no pricingRules
    if (payMode === 'FULL') {
      normalFull = legacyPrice
      if (safeIdentityType === '会员' && legacyMemberPrice > 0) myFull = legacyMemberPrice
      else if (safeIdentityType === '终身会员') {
        if (legacyLifetimePrice > 0) myFull = legacyLifetimePrice
        else if (legacyMemberPrice > 0) myFull = legacyMemberPrice
        else myFull = legacyPrice
      } else myFull = legacyPrice
    } else {
      // PREPAY legacy
      normalPrepay = legacyPrepay
      normalFull = legacyPrepay + Math.max(0, legacyPrice - legacyPrepay)
      if (safeIdentityType === '会员' && legacyMemberPrice > 0) {
        myPrepay = legacyPrepay
        myPostpay = Math.max(0, legacyMemberPrice - legacyPrepay)
        myFull = myPrepay + myPostpay
      } else if (safeIdentityType === '终身会员') {
        const base = legacyLifetimePrice > 0 ? legacyLifetimePrice : (legacyMemberPrice > 0 ? legacyMemberPrice : legacyPrice)
        myPrepay = legacyPrepay
        myPostpay = Math.max(0, base - legacyPrepay)
        myFull = myPrepay + myPostpay
      } else {
        myPrepay = legacyPrepay
        myPostpay = legacyRemaining
        myFull = normalFull
      }
    }
  }

  const priceReady = normalFull > 0 || myFull > 0 || myPrepay > 0
  const showDiscount = myFull > 0 && normalFull > 0 && myFull < normalFull && safeIdentityType !== '普通用户'

  // ── Identity label ──
  const showIdentityLabel = showDiscount && safeIdentityType !== '普通用户'
  const identityLabel = showIdentityLabel ? safeIdentityType : ''

  // ── List price text ──
  let listPriceText = '价格待确认'
  if (priceReady) {
    if (payMode === 'FULL') {
      if (showDiscount) {
        const labelMap: Record<string, string> = { '会员': '会员价', '终身会员': '终身会员价', '志愿者': '志愿者价', '工作人员': '工作人员价' }
        const label = labelMap[safeIdentityType] || '身份价'
        listPriceText = `${label} ¥${myFull}`
      } else {
        listPriceText = `¥${normalFull} 起`
      }
    } else {
      if (showDiscount) {
        const labelMap: Record<string, string> = { '会员': '会员价', '终身会员': '终身会员价', '志愿者': '志愿者价', '工作人员': '工作人员价' }
        const label = labelMap[safeIdentityType] || '身份价'
        listPriceText = `${label}预付 ¥${myPrepay}`
      } else {
        listPriceText = `预付 ¥${normalPrepay || normalFull} 起`
      }
    }
  }

  // ── Detail price text ──
  let detailMainPriceText = '价格待确认'
  let detailHasStrikethrough = false
  let detailStrikethroughPrice = ''
  let detailCurrentPrice = ''

  if (priceReady) {
    if (payMode === 'FULL') {
      if (showDiscount) {
        detailHasStrikethrough = true
        detailStrikethroughPrice = formatPrice(normalFull)
        detailCurrentPrice = formatPrice(myFull)
        detailMainPriceText = `${detailStrikethroughPrice}  ${detailCurrentPrice}`
      } else {
        detailCurrentPrice = formatPrice(myFull)
        detailMainPriceText = detailCurrentPrice
      }
    } else {
      // PREPAY detail
      const totalPrice = showDiscount ? myFull : normalFull
      detailCurrentPrice = formatPrice(totalPrice)
      detailMainPriceText = `合计：${detailCurrentPrice}`
      if (showDiscount) {
        detailHasStrikethrough = true
        detailStrikethroughPrice = formatPrice(normalFull)
        detailMainPriceText = `合计：${formatPrice(normalFull)}  ${formatPrice(myFull)}`
      }
    }
  }

  // ── Detail sub-lines (PREPAY only) ──
  const detailSubLines: string[] = []
  if (payMode === 'PREPAY' && priceReady) {
    detailSubLines.push(`预付款：${formatPrice(myPrepay)}`)
    detailSubLines.push(`后付款：${formatPrice(myPostpay)}`)
  }

  // ── Postpay date text ──
  let detailPostpayDateText = ''
  if (payMode === 'PREPAY' && postpayDate) {
    const formatted = formatDate(postpayDate)
    detailPostpayDateText = `后付款日期：${formatted}`
  } else if (payMode === 'PREPAY' && !postpayDate) {
    detailPostpayDateText = '后付款日期：待确认'
  }

  // ── Payment dialog texts ──
  let paymentDialogTitle = '确认报名'
  let paymentDialogMainText = ''
  let paymentDialogSubText: string | null = null
  let paymentButtonText = '确认支付'

  if (payMode === 'FULL') {
    paymentDialogMainText = `本次需支付：${formatPrice(myFull)}`
    paymentButtonText = '确认支付'
  } else {
    paymentDialogMainText = `本次仅支付预付款，金额：${formatPrice(myPrepay)}`
    paymentButtonText = '确认支付预付款'
    if (postpayDate) {
      const formatted = formatDate(postpayDate)
      paymentDialogSubText = `后付款将于 ${formatted} 再次支付 ${formatPrice(myPostpay)}。`
    } else {
      paymentDialogSubText = `后付款将再次支付 ${formatPrice(myPostpay)}。`
    }
  }

  return {
    identityType: safeIdentityType,
    payMode,
    normalFull,
    myFull,
    myPrepay,
    myPostpay,
    normalPrepay,
    postpayDate,
    showDiscount,
    priceReady,
    listPriceText,
    detailMainPriceText,
    detailHasStrikethrough,
    detailStrikethroughPrice,
    detailCurrentPrice,
    detailSubLines,
    detailPostpayDateText,
    paymentDialogTitle,
    paymentDialogMainText,
    paymentDialogSubText,
    paymentButtonText,
    showIdentityLabel,
    identityLabel,
  }
}
