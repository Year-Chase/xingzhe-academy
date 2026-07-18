export interface CreatePaymentInput {
  merchantOrderNo: string
  amountCents: number
  description: string
  openid?: string
  notifyUrl?: string
}

export interface CreatePaymentResult {
  providerTransactionNo?: string | null
  prepayId?: string | null
  raw?: unknown
}

export interface QueryPaymentResult {
  status: string
  providerTransactionNo?: string | null
  paidAt?: Date | null
  raw?: unknown
}

export interface CreateRefundInput {
  merchantRefundNo: string
  providerTransactionNo?: string | null
  amountCents: number
  reason?: string
  notifyUrl?: string
}

export interface CreateRefundResult {
  providerRefundNo?: string | null
  raw?: unknown
}

export interface QueryRefundResult {
  status: string
  providerRefundNo?: string | null
  successAt?: Date | null
  failureReason?: string | null
  raw?: unknown
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
  queryPayment(merchantOrderNo: string): Promise<QueryPaymentResult>
  closePayment(merchantOrderNo: string): Promise<void>
  createRefund(input: CreateRefundInput): Promise<CreateRefundResult>
  queryRefund(merchantRefundNo: string): Promise<QueryRefundResult>
  verifyNotify(headers: Record<string, string | string[] | undefined>, body: Buffer | string): Promise<unknown>
}
