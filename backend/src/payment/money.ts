export function yuanToCentsStrict(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined) throw new Error('Invalid payment amount')
  const raw = String(amount).trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(raw)) {
    throw new Error('Invalid payment amount')
  }
  const [yuan, fraction = ''] = raw.split('.')
  const cents = Number.parseInt(yuan, 10) * 100 + Number.parseInt(fraction.padEnd(2, '0') || '0', 10)
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid payment amount')
  return cents
}
